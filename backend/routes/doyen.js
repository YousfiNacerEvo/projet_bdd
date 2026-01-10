import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, requireRole, supabaseAdmin } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole(['doyen']));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = supabaseAdmin || createClient(supabaseUrl, supabaseServiceRoleKey);

const baseRunSelect = () =>
  supabase
    .from('planning_runs')
    .select('*')
    .order('created_at', { ascending: false });

router.get('/planning/runs', async (req, res) => {
  try {
    const status = req.query.status;
    let query = baseRunSelect();

    if (status === 'submitted') {
      query = query.eq('status_admin', 'submitted').eq('status_doyen', 'pending');
    } else if (status === 'pending') {
      query = query.eq('status_doyen', 'pending');
    } else if (status === 'approved' || status === 'rejected') {
      query = query.eq('status_doyen', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('[doyen][list runs]', err);
    res.status(500).json({ error: err.message || 'Erreur chargement runs' });
  }
});

router.get('/planning/run/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('planning_runs').select('*').eq('id', req.params.id).single();
    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Run introuvable' });
      throw error;
    }
    res.json(data);
  } catch (err) {
    console.error('[doyen][run]', err);
    res.status(500).json({ error: err.message || 'Erreur run' });
  }
});

router.get('/planning/run/:id/items', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('planning_items')
      .select(
        `
        id,
        module_id,
        salle_id,
        creneau_id,
        expected_students,
        notes,
        creneau:creneau_id (date, heure_debut, heure_fin),
        salle:salle_id (nom, capacite_examen, capacite),
        module:module_id (nom, id_formation),
        surveillants
      `
      )
      .eq('run_id', req.params.id)
      .order('date', { ascending: true, foreignTable: 'creneau' })
      .order('heure_debut', { ascending: true, foreignTable: 'creneau' });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('[doyen][items]', err);
    res.status(500).json({ error: err.message || 'Erreur items' });
  }
});

router.post('/planning/run/:id/approve', async (req, res) => {
  const runId = req.params.id;
  try {
    const { data: run, error: runErr } = await supabase.from('planning_runs').select('*').eq('id', runId).single();
    if (runErr || !run) return res.status(404).json({ error: 'Run introuvable' });

    if (run.status_admin !== 'submitted' || run.status_doyen !== 'pending') {
      return res.status(403).json({ error: 'Run non soumis ou déjà traité' });
    }

    const now = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from('planning_runs')
      .update({
        status_doyen: 'approved',
        approved_at: now,
        approved_by: req.user.id,
        rejected_at: null,
        rejected_by: null,
        rejection_reason: null
      })
      .eq('id', runId)
      .select()
      .single();
    if (updErr) throw updErr;

    console.log('[doyen][approve]', runId, 'by', req.user.id);
    res.json({ run: updated });
  } catch (err) {
    console.error('[doyen][approve] error', err);
    res.status(500).json({ error: err.message || 'Erreur approbation' });
  }
});

router.post('/planning/run/:id/reject', async (req, res) => {
  const runId = req.params.id;
  const reason = (req.body?.reason || '').trim();
  try {
    if (!reason) return res.status(400).json({ error: 'Raison de rejet requise' });

    const { data: run, error: runErr } = await supabase.from('planning_runs').select('*').eq('id', runId).single();
    if (runErr || !run) return res.status(404).json({ error: 'Run introuvable' });

    if (run.status_admin !== 'submitted' || run.status_doyen !== 'pending') {
      return res.status(403).json({ error: 'Run non soumis ou déjà traité' });
    }

    const now = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from('planning_runs')
      .update({
        status_doyen: 'rejected',
        rejected_at: now,
        rejected_by: req.user.id,
        rejection_reason: reason
      })
      .eq('id', runId)
      .select()
      .single();
    if (updErr) throw updErr;

    console.log('[doyen][reject]', runId, 'by', req.user.id);
    res.json({ run: updated });
  } catch (err) {
    console.error('[doyen][reject] error', err);
    res.status(500).json({ error: err.message || 'Erreur rejet' });
  }
});

export default router;

