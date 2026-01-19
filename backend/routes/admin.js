import express from 'express';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { authMiddleware, requireRole, supabaseAdmin } from '../middleware/auth.js';

dotenv.config();

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole(['admin_examens']));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const supabase = supabaseAdmin || createClient(supabaseUrl, supabaseServiceRoleKey);

// ---------- Helpers ----------
const capacityForSalle = (salle) => salle?.capacite_examen ?? salle?.capacite ?? salle?.capacite_normale ?? 0;

const loadExpectedStudents = async (moduleIds) => {
  if (!moduleIds.length) return {};
  const { data, error } = await supabase.from('inscription').select('id_module');
  if (error) throw error;
  const counts = {};
  data.forEach((row) => {
    if (!moduleIds.includes(row.id_module)) return;
    counts[row.id_module] = (counts[row.id_module] || 0) + 1;
  });
  return counts;
};

/**
 * Charge la map des étudiants inscrits par module
 * Retourne: { module_id: [id_etudiant1, id_etudiant2, ...], ... }
 */
const loadModuleStudents = async (moduleIds) => {
  if (!moduleIds.length) return {};
  const { data, error } = await supabase
    .from('inscription')
    .select('id_module, id_etudiant')
    .in('id_module', moduleIds);
  if (error) throw error;
  
  const map = {};
  data.forEach((row) => {
    if (!map[row.id_module]) map[row.id_module] = [];
    map[row.id_module].push(row.id_etudiant);
  });
  return map;
};

/**
 * Vérifie si une date est un vendredi
 */
const isFriday = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.getDay() === 5; // 0=dimanche, 5=vendredi
};

/**
 * Calcule la différence en jours entre deux dates
 */
const daysBetween = (date1Str, date2Str) => {
  const d1 = new Date(date1Str + 'T00:00:00');
  const d2 = new Date(date2Str + 'T00:00:00');
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Répartition round-robin sur tous les créneaux disponibles pour éviter
 * la concentration sur le premier jour. Avance le pointeur de créneau
 * après chaque examen pour balayer l'ensemble de la période.
 * 
 * CONTRAINTES AJOUTÉES :
 * 1. Aucun examen le vendredi
 * 2. Un étudiant ne peut pas avoir 2 examens le même jour
 * 3. Au moins 1 jour de repos entre les examens d'un étudiant
 */
const chooseRoomSlot = (modulesSorted, salles, creneaux, expectedMap, moduleStudentsMap = {}) => {
  // HARD guard: aucune collision salle+créneau
  const occupied = new Set(); // `${creneau_id}:${salle_id}`
  const items = [];
  const totalCapacityChosen = [];
  let slotIndex = 0;
  
  // Tracker des examens par étudiant: { id_etudiant: [date1, date2, ...] }
  const studentExamDates = {};

  for (const mod of modulesSorted) {
    const expected = expectedMap[mod.id_module] || 0;
    const studentsInModule = moduleStudentsMap[mod.id_module] || [];
    let best = null;
    let conflictNote = null;

    // on tente creneaux.length fois au max, en avançant cycliquement
    for (let attempt = 0; attempt < creneaux.length; attempt += 1) {
      const c = creneaux[(slotIndex + attempt) % creneaux.length];
      
      // CONTRAINTE 1: Exclure les vendredis
      if (isFriday(c.date)) {
        continue;
      }
      
      // CONTRAINTE 2 & 3: Vérifier les conflits étudiants
      let hasStudentConflict = false;
      for (const studentId of studentsInModule) {
        const examDates = studentExamDates[studentId] || [];
        
        // Vérifier si l'étudiant a déjà un examen ce jour
        if (examDates.includes(c.date)) {
          hasStudentConflict = true;
          break;
        }
        
        // Vérifier le jour de repos (au moins 1 jour entre examens)
        for (const existingDate of examDates) {
          const gap = daysBetween(c.date, existingDate);
          if (gap < 2) { // gap=0 même jour, gap=1 jours consécutifs => besoin gap>=2
            hasStudentConflict = true;
            break;
          }
        }
        
        if (hasStudentConflict) break;
      }
      
      if (hasStudentConflict) {
        continue; // Essayer le créneau suivant
      }
      
      const availableRooms = salles
        .filter((s) => {
          const key = `${c.id_creneau}:${s.id_salle}`;
          return !occupied.has(key);
        })
        .sort((a, b) => capacityForSalle(a) - capacityForSalle(b));

      for (const salle of availableRooms) {
        const cap = capacityForSalle(salle);
        if (cap >= expected) {
          best = { salle, creneau: c, note: null };
          break;
        }
      }
      if (best) {
        slotIndex = (slotIndex + attempt + 1) % creneaux.length;
        break;
      }
    }

    // fallback: prendre la plus grande salle libre du créneau courant (capacity_exceeded)
    // Mais toujours respecter les contraintes étudiants et vendredi
    if (!best) {
      for (let attempt = 0; attempt < creneaux.length; attempt += 1) {
        const c = creneaux[(slotIndex + attempt) % creneaux.length];
        
        // CONTRAINTE 1: Exclure les vendredis
        if (isFriday(c.date)) {
          continue;
        }
        
        // CONTRAINTE 2 & 3: Vérifier les conflits étudiants
        let hasStudentConflict = false;
        for (const studentId of studentsInModule) {
          const examDates = studentExamDates[studentId] || [];
          if (examDates.includes(c.date)) {
            hasStudentConflict = true;
            break;
          }
          for (const existingDate of examDates) {
            const gap = daysBetween(c.date, existingDate);
            if (gap < 2) {
              hasStudentConflict = true;
              break;
            }
          }
          if (hasStudentConflict) break;
        }
        
        if (hasStudentConflict) {
          continue;
        }
        
        const availableRooms = salles
          .filter((s) => {
            const key = `${c.id_creneau}:${s.id_salle}`;
            return !occupied.has(key);
          })
          .sort((a, b) => capacityForSalle(b) - capacityForSalle(a));
        if (availableRooms.length) {
          best = { salle: availableRooms[0], creneau: c, note: 'capacity_exceeded' };
          slotIndex = (slotIndex + attempt + 1) % creneaux.length;
          break;
        }
      }
    }

    if (!best) {
      // Aucun créneau/salle libre respectant les contraintes
      console.warn(`⚠️  Impossible de placer module ${mod.id_module} (${mod.nom || ''}) sans violer les contraintes`);
      conflictNote = 'impossible_to_schedule';
      continue;
    }

    occupied.add(`${best.creneau.id_creneau}:${best.salle.id_salle}`);
    totalCapacityChosen.push(capacityForSalle(best.salle));
    
    // Enregistrer cet examen pour tous les étudiants du module
    studentsInModule.forEach(studentId => {
      if (!studentExamDates[studentId]) studentExamDates[studentId] = [];
      studentExamDates[studentId].push(best.creneau.date);
    });

    items.push({
      module_id: mod.id_module,
      salle_id: best.salle.id_salle,
      creneau_id: best.creneau.id_creneau,
      expected_students: expected,
      notes: best.note || conflictNote
    });
  }

  const occupancy =
    totalCapacityChosen.length === 0
      ? 0
      : Math.min(
          1,
          items.reduce((acc, i) => acc + i.expected_students, 0) /
            totalCapacityChosen.reduce((a, b) => a + b, 0)
        );

  console.log(`✅ Planning généré: ${items.length} examens placés (${modulesSorted.length} modules)`);
  return { items, occupancy };
};

/**
 * Affecte des surveillants aux items en respectant une limite/jour.
 * maxPerDay: nb max d'examens surveillés par prof par jour
 * perExam: nb de surveillants souhaités par examen
 * La fonction calcule automatiquement le nombre de surveillants nécessaires
 * en fonction de la taille de la salle (1 surveillant par tranche de 40 élèves)
 */
const assignSurveillants = (items, profs, creneauMap, salleMap, { maxPerDay = 3, basePerExam = 1 } = {}) => {
  if (!profs?.length) {
    return items.map((it) => ({ ...it, surveillants: [] }));
  }

  const dailyCount = {}; // key: `${profId}:${date}` -> count
  const profPool = [...profs];

  return items.map((it) => {
    const date = creneauMap[it.creneau_id]?.date || 'no_date';
    
    // Calculer le nombre de surveillants nécessaires basé sur la capacité de la salle
    const salle = salleMap[it.salle_id];
    const salleCapacity = capacityForSalle(salle);
    // 1 surveillant par tranche de 40 élèves, minimum 1
    const requiredSurveillants = Math.max(1, Math.ceil(salleCapacity / 40));

    // Réordonne pour lisser la charge (plus disponible en premier)
    profPool.sort(
      (a, b) =>
        (dailyCount[`${a.id_prof}:${date}`] || 0) - (dailyCount[`${b.id_prof}:${date}`] || 0)
    );

    const chosen = [];
    for (const p of profPool) {
      const key = `${p.id_prof}:${date}`;
      const count = dailyCount[key] || 0;
      if (count >= maxPerDay) continue;
      chosen.push({ id_prof: p.id_prof, nom: p.nom, prenom: p.prenom });
      dailyCount[key] = count + 1;
      if (chosen.length >= requiredSurveillants) break;
    }

    const missing = chosen.length < requiredSurveillants;
    let notes = it.notes;
    if (missing) {
      const missingNote = `surveillant_manquant (${chosen.length}/${requiredSurveillants})`;
      notes = notes ? `${notes}; ${missingNote}` : missingNote;
    }
    return { ...it, surveillants: chosen, notes };
  });
};

// ---------- Ressources: Salles ----------
router.get('/salles', async (_req, res) => {
  const { data, error } = await supabase.from('salle').select('*').order('id_salle');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/salles', async (req, res) => {
  const payload = req.body || {};
  
  // Validation: capacité maximum de 40 élèves pour les salles normales, illimité pour les amphi
  const capacite = payload.capacite ?? payload.capacite_normale;
  const capaciteExamen = payload.capacite_examen ?? payload.capacite ?? payload.capacite_normale;
  const type = payload.type || 'salle';
  
  // Limite uniquement pour les salles normales, pas pour les amphithéâtres
  if (type === 'salle') {
    if (capacite && capacite > 40) {
      return res.status(400).json({ 
        error: 'La capacité d\'une salle ne peut pas dépasser 40 élèves (utilisez le type "amphi" pour une capacité supérieure)' 
      });
    }
    
    if (capaciteExamen && capaciteExamen > 40) {
      return res.status(400).json({ 
        error: 'La capacité d\'examen d\'une salle ne peut pas dépasser 40 élèves (utilisez le type "amphi" pour une capacité supérieure)' 
      });
    }
  }
  
  const row = {
    nom: payload.nom,
    batiment: payload.batiment,
    type: payload.type,
    capacite: capacite,
    capacite_normale: payload.capacite_normale ?? payload.capacite,
    capacite_examen: capaciteExamen
  };
  const { data, error } = await supabase.from('salle').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/salles/:id', async (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body || {};
  
  // Validation: capacité maximum de 40 élèves pour les salles normales, illimité pour les amphi
  const type = payload.type || 'salle';
  
  // Limite uniquement pour les salles normales, pas pour les amphithéâtres
  if (type === 'salle') {
    if (payload.capacite && payload.capacite > 40) {
      return res.status(400).json({ 
        error: 'La capacité d\'une salle ne peut pas dépasser 40 élèves (utilisez le type "amphi" pour une capacité supérieure)' 
      });
    }
    
    if (payload.capacite_normale && payload.capacite_normale > 40) {
      return res.status(400).json({ 
        error: 'La capacité normale d\'une salle ne peut pas dépasser 40 élèves (utilisez le type "amphi" pour une capacité supérieure)' 
      });
    }
    
    if (payload.capacite_examen && payload.capacite_examen > 40) {
      return res.status(400).json({ 
        error: 'La capacité d\'examen d\'une salle ne peut pas dépasser 40 élèves (utilisez le type "amphi" pour une capacité supérieure)' 
      });
    }
  }
  
  const updates = {
    nom: payload.nom,
    batiment: payload.batiment,
    type: payload.type,
    capacite: payload.capacite,
    capacite_normale: payload.capacite_normale,
    capacite_examen: payload.capacite_examen
  };
  const { data, error } = await supabase.from('salle').update(updates).eq('id_salle', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/salles/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { data, error } = await supabase.from('salle').delete().eq('id_salle', id).select();
    if (error) {
      console.error('[DELETE /admin/salles/:id] Supabase error', { id, code: error.code, message: error.message });
      if (error.code === '23503') {
        return res.status(409).json({
          error: "Salle utilisée dans un planning ou une autre ressource. Supprimez d’abord les éléments associés."
        });
      }
      return res.status(500).json({ error: error.message });
    }
    if (!data || !data.length) return res.status(404).json({ error: 'Salle introuvable' });
    res.json(data[0]);
  } catch (err) {
    console.error('[DELETE /admin/salles/:id] Unexpected error', { id, err });
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

// ---------- Ressources: Creneaux ----------
router.get('/creneaux', async (_req, res) => {
  const { data, error } = await supabase.from('creneau').select('*').order('id_creneau');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/creneaux', async (req, res) => {
  const payload = req.body || {};
  const row = {
    date: payload.date,
    heure_debut: payload.heure_debut,
    heure_fin: payload.heure_fin
  };
  const { data, error } = await supabase.from('creneau').insert(row).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/creneaux/:id', async (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body || {};
  const updates = {
    date: payload.date,
    heure_debut: payload.heure_debut,
    heure_fin: payload.heure_fin
  };
  const { data, error } = await supabase.from('creneau').update(updates).eq('id_creneau', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/creneaux/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { data, error } = await supabase.from('creneau').delete().eq('id_creneau', id).select();
    if (error) {
      // Gestion explicite des contraintes FK (par ex. planning_items -> creneau)
      console.error('[DELETE /admin/creneaux/:id] Supabase error', { id, code: error.code, message: error.message });
      if (error.code === '23503') {
        return res.status(409).json({
          error: 'Créneau utilisé dans un planning ou une autre ressource. Supprimez d’abord les éléments associés.'
        });
      }
      return res.status(500).json({ error: error.message });
    }
    if (!data || !data.length) return res.status(404).json({ error: 'Créneau introuvable' });
    res.json(data[0]);
  } catch (err) {
    console.error('[DELETE /admin/creneaux/:id] Unexpected error', { id, err });
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

// ---------- Formations (pour affichage planning) ----------
router.get('/formations', async (_req, res) => {
  const { data, error } = await supabase.from('formation').select('id_formation, nom');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ---------- Professeurs (pour édition planning) ----------
router.get('/professeurs', async (_req, res) => {
  const { data, error } = await supabase.from('professeur').select('id_prof, nom, prenom, id_dept').order('nom');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ---------- Planning runs ----------
router.post('/planning/run', async (req, res) => {
  const t0 = Date.now();
  try {
    const { scope = 'global', dept_id = null, formation_id = null, start_date = null, end_date = null } = req.body || {};

    const { data: run, error: runError } = await supabase
      .from('planning_runs')
      .insert({
        scope,
        dept_id,
        formation_id,
        status: 'running',
        started_at: new Date().toISOString(),
        created_by: req.user.id,
        metrics: {}
      })
      .select()
      .single();
    if (runError) throw runError;

    // Fetch formations (for scoping)
    let formationIds = [];
    if (scope === 'formation' && formation_id) {
      formationIds = [formation_id];
    } else if (scope === 'departement' && dept_id) {
      const { data: formations, error: fErr } = await supabase
        .from('formation')
        .select('id_formation')
        .eq('id_dept', dept_id);
      if (fErr) throw fErr;
      formationIds = formations.map((f) => f.id_formation);
    }

    // Modules
    let modulesQuery = supabase.from('module').select('id_module, nom, id_formation');
    if (formationIds.length) modulesQuery = modulesQuery.in('id_formation', formationIds);
    const { data: modules, error: modulesError } = await modulesQuery;
    if (modulesError) throw modulesError;
    const moduleIds = modules.map((m) => m.id_module);

    // Salles & creneaux
    const [
      { data: salles, error: salleErr },
      { data: allCreneaux, error: creneauErr },
      { data: profs, error: profErr }
    ] = await Promise.all([
      supabase.from('salle').select('*'),
      supabase.from('creneau').select('*'),
      supabase.from('professeur').select('id_prof, nom, prenom, id_dept')
    ]);
    if (salleErr) throw salleErr;
    if (creneauErr) throw creneauErr;
    if (profErr) throw profErr;
    if (!allCreneaux?.length || !salles?.length) {
      throw new Error('Aucune salle ou créneau disponible pour la génération');
    }

    const creneauMap = {};
    allCreneaux.forEach((c) => {
      creneauMap[c.id_creneau] = c;
    });

    // Filtrer les créneaux sur la période demandée; fallback sur la plage min..min+7j
    let minDate = allCreneaux.reduce((acc, c) => (acc && acc < c.date ? acc : c.date), null);
    let maxDate = allCreneaux.reduce((acc, c) => (acc && acc > c.date ? acc : c.date), null);
    let startDate = start_date || minDate;
    let endDate =
      end_date ||
      (startDate
        ? new Date(new Date(startDate).getTime() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
        : maxDate);
    // clamp endDate to maxDate if exists
    if (maxDate && endDate > maxDate) endDate = maxDate;

    const creneaux = allCreneaux
      .filter((c) => (!startDate || c.date >= startDate) && (!endDate || c.date <= endDate))
      .sort((a, b) => {
        if (a.date === b.date) return a.heure_debut.localeCompare(b.heure_debut);
        return a.date.localeCompare(b.date);
      });

    // Logs d'instrumentation
    const perDay = {};
    creneaux.forEach((c) => {
      perDay[c.date] = (perDay[c.date] || 0) + 1;
    });
    console.log('[planning/run] slots loaded:', {
      total: creneaux.length,
      minDate: startDate,
      maxDate: endDate,
      perDay,
      first5: creneaux.slice(0, 5)
    });

    if (!creneaux.length) {
      throw new Error('Aucun créneau disponible dans la période demandée');
    }

    const expectedMap = await loadExpectedStudents(moduleIds);
    const moduleStudentsMap = await loadModuleStudents(moduleIds);
    const modulesSorted = [...modules].sort(
      (a, b) => (expectedMap[b.id_module] || 0) - (expectedMap[a.id_module] || 0)
    );
    const { items, occupancy } = chooseRoomSlot(modulesSorted, salles, creneaux, expectedMap, moduleStudentsMap);

    // Create salle map for surveillant assignment
    const salleMap = {};
    salles.forEach((s) => {
      salleMap[s.id_salle] = s;
    });

    const itemsWithRun = items.map((i) => ({ ...i, run_id: run.id }));
    const itemsWithSurv = assignSurveillants(itemsWithRun, profs || [], creneauMap, salleMap, {
      maxPerDay: 3,
      basePerExam: 1
    });
    const pairSet = new Set();
    let duplicatePairs = 0;
    itemsWithSurv.forEach((i) => {
      const key = `${i.run_id}:${i.creneau_id}:${i.salle_id}`;
      if (pairSet.has(key)) duplicatePairs += 1;
      pairSet.add(key);
    });

    if (itemsWithSurv.length) {
      const { error: insertItemsError } = await supabase.from('planning_items').insert(itemsWithSurv);
      if (insertItemsError) throw insertItemsError;
    }

    const capacityExceed = itemsWithSurv.filter((i) => i.notes === 'capacity_exceeded').length;
    const surveillantsMissing = itemsWithSurv.filter((i) => !i.surveillants?.length).length;
    const durationMs = Date.now() - t0;
    const metrics = {
      exams_generated: itemsWithRun.length,
      room_collisions: 0,
      capacity_exceeded: capacityExceed,
      invigilators_missing: surveillantsMissing,
      avg_room_fill_rate: occupancy,
      duration_ms: durationMs
    };
    if (duplicatePairs > 0) {
      metrics.room_collisions = duplicatePairs;
    }

    const { error: updateRunError, data: updatedRun } = await supabase
      .from('planning_runs')
      .update({
        status: 'done',
        ended_at: new Date().toISOString(),
        metrics
      })
      .eq('id', run.id)
      .select()
      .single();
    if (updateRunError) throw updateRunError;

    res.json({ run: updatedRun, items: itemsWithSurv });
  } catch (err) {
    console.error('Run generation failed:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/planning/runs', async (_req, res) => {
  const { data, error } = await supabase.from('planning_runs').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/planning/run/:id', async (req, res) => {
  const { data, error } = await supabase.from('planning_runs').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Run introuvable' });
  res.json(data);
});

router.get('/planning/run/:id/items', async (req, res) => {
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
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/planning/items/:itemId', async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const payload = req.body || {};
    
    // Construire l'objet de mise à jour
    const updates = {};
    if (payload.salle_id !== undefined) updates.salle_id = payload.salle_id;
    if (payload.creneau_id !== undefined) updates.creneau_id = payload.creneau_id;
    if (payload.expected_students !== undefined) updates.expected_students = payload.expected_students;
    if (payload.surveillants !== undefined) updates.surveillants = payload.surveillants;
    if (payload.notes !== undefined) updates.notes = payload.notes;
    
    const { data, error } = await supabase
      .from('planning_items')
      .update(updates)
      .eq('id', itemId)
      .select(`
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
      `)
      .single();
    
    if (error) {
      console.error('[PATCH /planning/items/:itemId] error', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
  } catch (err) {
    console.error('[PATCH /planning/items/:itemId] unexpected error', err);
    res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
});

router.get('/planning/run/:id/conflicts', async (req, res) => {
  try {
    const runId = req.params.id;
    const [{ data: items, error: itemsErr }, { data: salles, error: salleErr }] = await Promise.all([
      supabase.from('planning_items').select('*').eq('run_id', runId),
      supabase.from('salle').select('*')
    ]);
    if (itemsErr) throw itemsErr;
    if (salleErr) throw salleErr;

    const salleMap = {};
    salles.forEach((s) => {
      salleMap[s.id_salle] = s;
    });

    const conflicts = [];
    let critical = 0;
    let high = 0;

    // ROOM_COLLISION
    const bySlot = {};
    items.forEach((it) => {
      const key = `${it.salle_id}-${it.creneau_id}`;
      bySlot[key] = bySlot[key] || [];
      bySlot[key].push(it);
    });
    Object.values(bySlot).forEach((list) => {
      if (list.length > 1) {
        conflicts.push({ type: 'ROOM_COLLISION', severity: 'critical', items: list });
        critical += 1;
      }
    });

    // CAPACITY_EXCEEDED
    items.forEach((it) => {
      const salle = salleMap[it.salle_id];
      const cap = capacityForSalle(salle);
      if (it.expected_students > cap) {
        conflicts.push({ type: 'CAPACITY_EXCEEDED', severity: 'high', items: [it] });
        high += 1;
      }
    });

    res.json({
      run_id: runId,
      conflicts,
      totals: { critical, high, medium: 0 }
    });
  } catch (err) {
    console.error('Conflicts error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/planning/run/:id/submit', async (req, res) => {
  const runId = req.params.id;
  try {
    const { data: run, error: runErr } = await supabase.from('planning_runs').select('*').eq('id', runId).single();
    if (runErr || !run) return res.status(404).json({ error: 'Run introuvable' });

    if (run.status !== 'done') {
      return res.status(400).json({ error: 'Le run doit être terminé avant soumission' });
    }
    if (run.status_admin === 'submitted' && run.status_doyen === 'pending') {
      return res.status(400).json({ error: 'Run déjà soumis au doyen' });
    }

    const now = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from('planning_runs')
      .update({
        status_admin: 'submitted',
        status_doyen: 'pending',
        submitted_at: now,
        // reset rejection when resubmitting
        rejected_at: null,
        rejected_by: null,
        rejection_reason: null
      })
      .eq('id', runId)
      .select()
      .single();
    if (updErr) throw updErr;

    console.log('[planning/submit] run', runId, 'by', req.user.id);
    res.json({ run: updated });
  } catch (err) {
    console.error('[planning/submit] error', err);
    res.status(500).json({ error: err.message || 'Erreur soumission' });
  }
});

router.post('/planning/run/:id/publish', async (req, res) => {
  const runId = req.params.id;
  try {
    const { data: run, error: runErr } = await supabase.from('planning_runs').select('*').eq('id', runId).single();
    if (runErr || !run) return res.status(404).json({ error: 'Run introuvable' });

    if (run.status_doyen !== 'approved') {
      return res.status(403).json({ error: 'Publication impossible sans validation du doyen' });
    }
    if (run.published) {
      return res.json({ ok: true, run });
    }

    const now = new Date().toISOString();
    const { data: updated, error: updErr } = await supabase
      .from('planning_runs')
      .update({ published: true, published_at: now, ended_at: run.ended_at || now, status: 'done' })
      .eq('id', runId)
      .select()
      .single();
    if (updErr) throw updErr;

    console.log('[planning/publish] run', runId, 'by', req.user.id);
    res.json({ ok: true, run: updated });
  } catch (err) {
    console.error('[planning/publish] error', err);
    res.status(500).json({ error: err.message || 'Erreur publication' });
  }
});

router.delete('/planning/run/:id', async (req, res) => {
  const runId = req.params.id;
  try {
    // Vérifier si le run existe
    const { data: run, error: runErr } = await supabase
      .from('planning_runs')
      .select('*')
      .eq('id', runId)
      .single();
    
    if (runErr || !run) {
      return res.status(404).json({ error: 'Run introuvable' });
    }

    // Empêcher la suppression d'un run publié
    if (run.published) {
      return res.status(403).json({ 
        error: 'Impossible de supprimer un run publié',
        details: 'Veuillez d\'abord dépublier le run avant de le supprimer'
      });
    }

    // Supprimer d'abord les planning_items associés
    const { error: itemsErr } = await supabase
      .from('planning_items')
      .delete()
      .eq('run_id', runId);
    
    if (itemsErr) {
      console.error('[DELETE /planning/run/:id] Error deleting items', itemsErr);
      throw itemsErr;
    }

    // Supprimer le run
    const { error: deleteErr } = await supabase
      .from('planning_runs')
      .delete()
      .eq('id', runId);
    
    if (deleteErr) {
      console.error('[DELETE /planning/run/:id] Error deleting run', deleteErr);
      throw deleteErr;
    }

    console.log('[planning/delete] run', runId, 'deleted by', req.user.id);
    res.json({ ok: true, message: 'Run supprimé avec succès' });
  } catch (err) {
    console.error('[planning/delete] error', err);
    res.status(500).json({ error: err.message || 'Erreur lors de la suppression' });
  }
});

export default router;

