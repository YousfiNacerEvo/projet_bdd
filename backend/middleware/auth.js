import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware pour vérifier l'authentification
export const authenticateToken = async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: "Token d'authentification manquant" });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: "Token invalide ou expiré" });
        }

        // Ajouter l'utilisateur à la requête pour l'utiliser dans les routes
        req.user = user;
        next();
    } catch (err) {
        console.error('Erreur vérification token:', err);
        res.status(500).json({ error: "Erreur lors de la vérification du token" });
    }
};

