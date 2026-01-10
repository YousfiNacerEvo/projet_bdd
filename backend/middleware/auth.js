import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || supabaseKey;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: "Token d'authentification manquant" });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Token invalide ou expiré" });
    }

    const { data: meta, error: metaError } = await supabaseAdmin
      .from('users_meta')
      .select('id, role, dept_id, formation_id')
      .eq('id', user.id)
      .single();

    if (metaError) {
      console.error('Erreur lecture users_meta:', metaError);
      return res.status(403).json({ error: "Impossible de lire le profil utilisateur" });
    }

    req.user = {
      id: user.id,
      role: meta.role,
      dept_id: meta.dept_id,
      formation_id: meta.formation_id
    };
    next();
  } catch (err) {
    console.error('Erreur vérification token:', err);
    res.status(500).json({ error: "Erreur lors de la vérification du token" });
  }
};

export const requireRole = (roles = []) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Non authentifié' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé' });
  }
  next();
};

export { supabaseAdmin };

