import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || supabaseKey; // Service role key pour bypass RLS si nécessaire
const supabase = createClient(supabaseUrl, supabaseKey);

// Rôles valides
const VALID_ROLES = ['admin_examens', 'chef_dept', 'doyen', 'prof', 'etudiant'];

// Route de login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
        return res.status(400).json({ 
            error: "L'email et le mot de passe sont requis" 
        });
    }

    try {
        // Authentification avec Supabase
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) {
            console.error('Erreur d\'authentification:', authError);
            return res.status(401).json({ 
                error: "Email ou mot de passe incorrect",
                details: authError.message 
            });
        }

        const userId = authData.user.id;
        const accessToken = authData.session.access_token;

        // Créer un client Supabase avec le token de l'utilisateur pour respecter RLS
        const supabaseUser = createClient(supabaseUrl, supabaseKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        });

        // Lire le rôle réel depuis users_meta (SÉCURITÉ : on ne fait jamais confiance au client)
        const { data: userMeta, error: selectError } = await supabaseUser
            .from('users_meta')
            .select('*')
            .eq('id', userId)
            .single();

        if (selectError) {
            // Si RLS bloque ou si la ligne n'existe pas, utiliser le service key
            if (selectError.code === 'PGRST116') {
                // La ligne n'existe pas (normalement créée par le trigger)
                // Utiliser le service key pour vérifier
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
                const { data: metaAdmin, error: selectErrorAdmin } = await supabaseAdmin
                    .from('users_meta')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (selectErrorAdmin) {
                    console.error('Erreur lecture users_meta (admin):', selectErrorAdmin);
                    return res.status(500).json({ 
                        error: "Erreur lors de la lecture du profil utilisateur",
                        details: "Le profil utilisateur n'existe pas. Veuillez contacter l'administrateur."
                    });
                }

                // Retourner les métadonnées trouvées avec le service key
                res.json({
                    message: "Connexion réussie",
                    user: authData.user,
                    session: authData.session,
                    userMeta: metaAdmin
                });
                return;
            } else {
                // Autre erreur, essayer avec le service key
                console.warn('Erreur lecture users_meta (RLS?), tentative avec service key:', selectError);
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
                const { data: metaAdmin, error: selectErrorAdmin } = await supabaseAdmin
                    .from('users_meta')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (selectErrorAdmin) {
                    console.error('Erreur lecture users_meta (admin):', selectErrorAdmin);
                    return res.status(500).json({ 
                        error: "Erreur lors de la lecture du profil utilisateur",
                        details: selectErrorAdmin.message 
                    });
                }

                res.json({
                    message: "Connexion réussie",
                    user: authData.user,
                    session: authData.session,
                    userMeta: metaAdmin
                });
                return;
            }
        }

        // Succès - retourner les données de l'utilisateur, le token et les métadonnées (rôle réel depuis la DB)
        res.json({
            message: "Connexion réussie",
            user: authData.user,
            session: authData.session,
            userMeta: userMeta
        });
    } catch (err) {
        console.error('Erreur serveur:', err);
        res.status(500).json({ 
            error: "Erreur serveur", 
            details: err.message 
        });
    }
});

// Route de vérification de session
router.get('/verify', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: "Token manquant" });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: "Token invalide" });
        }

        // Récupérer le rôle réel depuis users_meta
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
                console.error('Erreur lecture users_meta (verify):', metaErrorAdmin);
                // Retourner quand même l'utilisateur même si on ne peut pas lire le rôle
                return res.json({ user, userMeta: null });
            }

            return res.json({ user, userMeta: metaAdmin });
        }

        res.json({ user, userMeta });
    } catch (err) {
        console.error('Erreur vérification:', err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// Route de déconnexion
router.post('/logout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            return res.status(500).json({ error: "Erreur lors de la déconnexion" });
        }

        res.json({ message: "Déconnexion réussie" });
    } catch (err) {
        console.error('Erreur déconnexion:', err);
        res.status(500).json({ error: "Erreur serveur" });
    }
});

export default router;

