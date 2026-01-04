import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey;
const supabase = createClient(supabaseUrl, supabaseKey);

// Route GET /api/me - Retourne les infos de l'utilisateur connecté
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: "Token manquant" });
    }

    try {
        // Vérifier le token et récupérer l'utilisateur
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        if (userError || !user) {
            return res.status(401).json({ error: "Token invalide" });
        }

        // Récupérer les métadonnées depuis users_meta
        const supabaseUser = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        });

        const { data: userMeta, error: metaError } = await supabaseUser
            .from('users_meta')
            .select('*')
            .eq('id', user.id)
            .single();

        // Si erreur RLS, essayer avec service key
        if (metaError) {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
            const { data: metaAdmin, error: metaErrorAdmin } = await supabaseAdmin
                .from('users_meta')
                .select('*')
                .eq('id', user.id)
                .single();

            if (metaErrorAdmin) {
                console.error('Erreur lecture users_meta (me):', metaErrorAdmin);
                return res.status(500).json({ 
                    error: "Erreur lors de la lecture du profil utilisateur",
                    details: metaErrorAdmin.message 
                });
            }

            // Retourner les infos formatées
            return res.json({
                id: user.id,
                role: metaAdmin.role,
                dept_id: metaAdmin.dept_id,
                formation_id: metaAdmin.formation_id
            });
        }

        // Retourner les infos formatées
        res.json({
            id: user.id,
            role: userMeta.role,
            dept_id: userMeta.dept_id,
            formation_id: userMeta.formation_id
        });
    } catch (err) {
        console.error('Erreur /api/me:', err);
        res.status(500).json({ error: "Erreur serveur", details: err.message });
    }
});

export default router;

