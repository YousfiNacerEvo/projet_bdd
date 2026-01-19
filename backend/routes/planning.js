import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, requireRole, supabaseAdmin } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole(['etudiant', 'prof', 'admin_examens', 'chef_dept', 'doyen']));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = supabaseAdmin || createClient(supabaseUrl, supabaseServiceRoleKey);

// Helper pour charger le planning publié
const loadPublishedPlanning = async () => {
    const { data: run, error: runErr } = await supabase
      .from('planning_runs')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    if (runErr && runErr.code !== 'PGRST116') throw runErr;
  if (!run) return { run: null, items: [] };

    // Charger les formations pour hydratation
    const { data: formationsData, error: formErr } = await supabase
      .from('formation')
      .select('*');
    if (formErr) console.error('[planning/published] formations error', formErr);
    
    const formationsMap = {};
    (formationsData || []).forEach((f) => {
      formationsMap[f.id_formation] = f;
    });

    const { data: itemsRaw, error: itemsErr } = await supabase
      .from('planning_items')
      .select(
        `
        id,
        module_id,
        salle_id,
        creneau_id,
        expected_students,
        notes,
        surveillants,
        creneau:creneau_id (date, heure_debut, heure_fin),
        salle:salle_id (nom, capacite_examen, capacite),
        module:module_id (nom, id_formation)
      `
      )
      .eq('run_id', run.id)
      .order('date', { ascending: true, foreignTable: 'creneau' })
      .order('heure_debut', { ascending: true, foreignTable: 'creneau' });
    if (itemsErr) {
      console.error('[planning/published] items error', {
        code: itemsErr.code,
        message: itemsErr.message,
        details: itemsErr.details
      });
      throw itemsErr;
    }

  // Hydrater les formations manuellement
    const items = (itemsRaw || []).map((it) => {
      if (it.module?.id_formation && formationsMap[it.module.id_formation]) {
        it.module.formation = formationsMap[it.module.id_formation];
      }
      return it;
    });

  return { run, items };
};

// GET /api/planning/published/me - Endpoint dédié pour étudiant/prof (filtrage strict)
router.get('/published/me', async (req, res) => {
  try {
    const user = req.user;
    const role = user?.role;
    
    // Validation : uniquement pour étudiant et prof
    if (role !== 'etudiant' && role !== 'prof') {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Cet endpoint est réservé aux étudiants et professeurs'
      });
    }

    const { run, items } = await loadPublishedPlanning();
    
    if (!run) {
      return res.json({
        run: null,
        items: [],
        message: 'Aucun planning publié'
      });
    }

    // Validation formation_id pour étudiant
    if (role === 'etudiant' && !user.formation_id) {
      return res.status(400).json({
        error: 'formation_id manquant dans users_meta',
        message: 'Votre profil étudiant n\'est pas configuré correctement. Contactez l\'administrateur.',
        run: { id: run.id, published_at: run.published_at }
      });
    }

    const formationId = user.formation_id;
    const deptId = user.dept_id;
    const idProf = user.id_prof;

    console.log('[planning/published/me] User info:', {
      role,
      formationId,
      deptId,
      idProf,
      totalItems: items?.length
    });

    // Filtrage strict par formation/département
    const filtered = items.filter((it) => {
      const formation = it.module?.formation;
      const moduleFormationId = it.module?.id_formation;
      
      if (role === 'etudiant') {
        // MVP: filtrer par formation_id
        const fid = formation?.id_formation || moduleFormationId;
        const match = fid === formationId;
        
        if (!match) {
          console.log('[planning/published/me] Étudiant - item exclu:', {
            itemFormationId: fid,
            userFormationId: formationId,
            module: it.module?.nom
          });
        }
        
        return match;
      }
      
      if (role === 'prof') {
        // Filtrer par surveillant ou département
        if (idProf) {
          const surv = Array.isArray(it.surveillants) ? it.surveillants : [];
          const hasMatch = surv.some((s) => Number(s.id_prof) === Number(idProf));
          if (hasMatch) return true;
        }
        // fallback département
        if (deptId) {
          return formation?.id_dept === deptId;
        }
        return false;
      }
      
      return false;
    });

    console.log('[planning/published/me] Filtered items:', {
      role,
      count: filtered.length,
      sampleModuleIds: filtered.slice(0, 3).map(it => it.module_id)
    });

    res.json({
      run: {
        id: run.id,
        published: run.published,
        published_at: run.published_at,
        scope: run.scope
      },
      items: filtered
    });
  } catch (err) {
    console.error('[planning/published/me] error', err);
    res.status(500).json({ error: err.message || 'Erreur lecture planning publié' });
  }
});

// GET /api/planning/published - Legacy endpoint (compatible avec admin/chef/doyen)
router.get('/published', async (req, res) => {
  try {
    const { run, items } = await loadPublishedPlanning();
    
    if (!run) {
      return res.json({ run: null, items: [] });
    }

    const formationId = req.user?.formation_id;
    const deptId = req.user?.dept_id;
    const role = req.user?.role;
    const idProf = req.user?.id_prof;

    console.log('[planning/published] User info:', {
      role,
      formationId,
      deptId,
      idProf,
      totalItems: items?.length
    });

    const filtered = items.filter((it) => {
      const formation = it.module?.formation;
      const moduleFormationId = it.module?.id_formation;
      
      if (role === 'etudiant') {
        const fid = formation?.id_formation || moduleFormationId;
        return formationId && fid === formationId;
      }
      if (role === 'prof') {
        if (idProf) {
          const surv = Array.isArray(it.surveillants) ? it.surveillants : [];
          const hasMatch = surv.some((s) => Number(s.id_prof) === Number(idProf));
          if (hasMatch) return true;
        }
        if (deptId) {
          return formation?.id_dept === deptId;
        }
        return false;
      }
      // Admin/chef/doyen peuvent tout voir
      return true;
    });

    console.log('[planning/published] Filtered items:', {
      count: filtered.length,
      sampleModuleIds: filtered.slice(0, 3).map(it => it.module_id)
    });

    res.json({ run, items: filtered });
  } catch (err) {
    console.error('[planning/published] error', err);
    res.status(500).json({ error: err.message || 'Erreur lecture planning publié' });
  }
});

export default router;

