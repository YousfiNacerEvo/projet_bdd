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

router.get('/published', async (req, res) => {
  try {
    const { data: run, error: runErr } = await supabase
      .from('planning_runs')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    if (runErr && runErr.code !== 'PGRST116') throw runErr;
    if (!run) return res.json({ run: null, items: [] });

    const { data: items, error: itemsErr } = await supabase
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
        module:module_id (
          nom,
          id_formation,
          formation:formation_id (nom, id_dept)
        )
      `
      )
      .eq('run_id', run.id)
      .order('date', { ascending: true, foreignTable: 'creneau' })
      .order('heure_debut', { ascending: true, foreignTable: 'creneau' });
    if (itemsErr) throw itemsErr;

    const formationId = req.user?.formation_id;
    const deptId = req.user?.dept_id;
    const role = req.user?.role;

    const filtered = (items || []).filter((it) => {
      const formation = it.module?.formation;
      if (role === 'etudiant') {
        if (!formationId) return false;
        return formation?.id_formation === formationId;
      }
      if (role === 'prof') {
        if (!deptId) return false;
        return formation?.id_dept === deptId;
      }
      // Admin/chef/doyen peuvent tout voir
      return true;
    });

    res.json({ run, items: filtered });
  } catch (err) {
    console.error('[planning/published] error', err);
    res.status(500).json({ error: err.message || 'Erreur lecture planning publié' });
  }
});

export default router;

