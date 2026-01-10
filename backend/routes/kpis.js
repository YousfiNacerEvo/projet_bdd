import express from 'express';
import { authMiddleware, supabaseAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

const runMeta = (run) =>
  run
    ? {
        id: run.id,
        scope: run.scope,
        status: run.status,
        published: run.published,
        started_at: run.started_at,
        ended_at: run.ended_at,
        metrics: run.metrics || {}
      }
    : null;

const resolveRun = async (runId) => {
  if (runId) {
    const { data, error } = await supabaseAdmin.from('planning_runs').select('*').eq('id', runId).single();
    if (error || !data) throw new Error("Run introuvable");
    return data;
  }

  // Dernier run publié
  const { data: published, error: pubErr } = await supabaseAdmin
    .from('planning_runs')
    .select('*')
    .eq('published', true)
    .order('ended_at', { ascending: false })
    .limit(1)
    .single();

  if (published) return published;
  if (pubErr && pubErr.code !== 'PGRST116') throw pubErr; // PGRST116 = no rows

  // Fallback sur dernier run "done"
  const { data: lastDone, error: lastErr } = await supabaseAdmin
    .from('planning_runs')
    .select('*')
    .eq('status', 'done')
    .order('ended_at', { ascending: false })
    .limit(1)
    .single();

  if (lastErr) throw lastErr;
  if (!lastDone) throw new Error("Aucun run disponible");
  return lastDone;
};

const loadItems = async (runId) => {
  const { data, error } = await supabaseAdmin
    .from('planning_items')
    .select(
      `
      id,
      run_id,
      module_id,
      salle_id,
      creneau_id,
      expected_students,
      notes,
      surveillants,
      creneau:creneau_id (id_creneau, date, heure_debut, heure_fin),
      salle:salle_id (id_salle, nom, capacite_examen, capacite),
      module:module_id (id_module, nom, id_formation)
      `
    )
    .eq('run_id', runId);

  if (error) throw error;
  return data || [];
};

const loadDepartements = async () => {
  const { data, error } = await supabaseAdmin.from('departement').select('id_dept, nom');
  if (error) throw error;
  const map = {};
  (data || []).forEach((d) => {
    map[d.id_dept] = d.nom;
  });
  return map;
};

const loadFormations = async () => {
  const { data, error } = await supabaseAdmin.from('formation').select('id_formation, nom, id_dept');
  if (error) throw error;
  const map = {};
  (data || []).forEach((f) => {
    map[f.id_formation] = f;
  });
  return map;
};

const loadRoomsCount = async () => {
  const { count, error } = await supabaseAdmin.from('salle').select('id_salle', { count: 'exact', head: true });
  if (error) throw error;
  return count || 0;
};

const dateKey = (c) => c?.date || 'unknown';
const slotLabel = (c) => {
  if (!c) return '-';
  return `${(c.heure_debut || '').slice(0, 5)}–${(c.heure_fin || '').slice(0, 5)}`;
};

const computeBase = (items, totalRooms = 0) => {
  const slots = new Set();
  const rooms = new Set();
  const days = new Set();
  const fillRates = [];
  let capacityExceeded = 0;
  const examsPerDay = {};
  const occupancyPerDay = {};
  const collisionCounter = {};

  items.forEach((it) => {
    const c = it.creneau;
    const s = it.salle;
    const cap = s?.capacite_examen ?? s?.capacite ?? 0;
    const fill = cap > 0 ? (it.expected_students || 0) / cap : null;

    if (c?.id_creneau) slots.add(c.id_creneau);
    if (s?.id_salle) rooms.add(s.id_salle);
    if (c?.date) days.add(c.date);

    if (cap > 0 && fill !== null && !Number.isNaN(fill)) {
      fillRates.push(fill);
      occupancyPerDay[c?.date] = occupancyPerDay[c?.date] || [];
      occupancyPerDay[c.date].push(fill);
    }

    if (cap > 0 && (it.expected_students || 0) > cap) capacityExceeded += 1;

    const dKey = dateKey(c);
    examsPerDay[dKey] = (examsPerDay[dKey] || 0) + 1;

    const colKey = `${it.salle_id || s?.id_salle}:${it.creneau_id || c?.id_creneau}`;
    collisionCounter[colKey] = (collisionCounter[colKey] || 0) + 1;
  });

  const roomCollisionCount = Object.values(collisionCounter).reduce((acc, v) => (v > 1 ? acc + (v - 1) : acc), 0);
  const avgFill = fillRates.length ? fillRates.reduce((a, b) => a + b, 0) / fillRates.length : 0;

  const examsPerDayArr = Object.entries(examsPerDay).map(([date, count]) => ({ date, count }));
  examsPerDayArr.sort((a, b) => a.date.localeCompare(b.date));

  const occupancyPerDayArr = Object.entries(occupancyPerDay).map(([date, fills]) => ({
    date,
    fill_rate: fills.reduce((a, b) => a + b, 0) / fills.length
  }));
  occupancyPerDayArr.sort((a, b) => a.date.localeCompare(b.date));

  const topOver = items
    .map((it) => {
      const s = it.salle;
      const cap = s?.capacite_examen ?? s?.capacite ?? 0;
      const diff = cap > 0 ? (it.expected_students || 0) - cap : -Infinity;
      return { ...it, cap, diff };
    })
    .filter((it) => it.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 5)
    .map((it) => ({
      module: it.module?.nom || `M${it.module_id}`,
      formation: it.module?.formation?.nom || '-',
      salle: it.salle?.nom || `S${it.salle_id}`,
      date: it.creneau?.date || '-',
      slot: slotLabel(it.creneau),
      expected: it.expected_students,
      capacite: it.cap,
      diff: it.diff
    }));

  const topUnderused = items
    .map((it) => {
      const s = it.salle;
      const cap = s?.capacite_examen ?? s?.capacite ?? 0;
      const fill = cap > 0 ? (it.expected_students || 0) / cap : null;
      return { ...it, fill, cap };
    })
    .filter((it) => it.fill !== null)
    .sort((a, b) => a.fill - b.fill)
    .slice(0, 5)
    .map((it) => ({
      module: it.module?.nom || `M${it.module_id}`,
      formation: it.module?.formation?.nom || '-',
      salle: it.salle?.nom || `S${it.salle_id}`,
      date: it.creneau?.date || '-',
      slot: slotLabel(it.creneau),
      fill_rate: it.fill
    }));

  return {
    exams_count: items.length,
    days_covered: days.size,
    slots_used: slots.size,
    rooms_used: rooms.size,
    avg_room_fill_rate: avgFill,
    capacity_exceeded_count: capacityExceeded,
    room_collision_count: roomCollisionCount,
    exams_per_day: examsPerDayArr,
    occupancy_per_day: occupancyPerDayArr,
    top_over_capacity: topOver,
    top_underused_rooms: topUnderused,
    rooms_used_ratio: totalRooms ? rooms.size / totalRooms : null
  };
};

const groupByDept = (items, deptNames) => {
  const byDept = {};
  items.forEach((it) => {
    const deptId = it.module?.formation?.id_dept;
    if (!deptId) return;
    const s = it.salle;
    const cap = s?.capacite_examen ?? s?.capacite ?? 0;
    const fill = cap > 0 ? (it.expected_students || 0) / cap : null;
    if (!byDept[deptId]) {
      byDept[deptId] = { exams: 0, fills: [], exceeded: 0 };
    }
    byDept[deptId].exams += 1;
    if (fill !== null) byDept[deptId].fills.push(fill);
    if (cap > 0 && (it.expected_students || 0) > cap) byDept[deptId].exceeded += 1;
  });

  return Object.entries(byDept).map(([deptId, v]) => ({
    dept_id: Number(deptId),
    dept_name: deptNames[deptId] || `Dept ${deptId}`,
    exams_count: v.exams,
    capacity_exceeded_count: v.exceeded,
    avg_room_fill_rate: v.fills.length ? v.fills.reduce((a, b) => a + b, 0) / v.fills.length : 0
  }));
};

const formationMostLoaded = (items) => {
  const map = {};
  items.forEach((it) => {
    const fid = it.module?.formation?.id_formation;
    const fname = it.module?.formation?.nom || `F${fid}`;
    if (!fid) return;
    map[fid] = map[fid] || { id_formation: fid, nom: fname, count: 0 };
    map[fid].count += 1;
  });
  return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
};

const upcomingFromItems = (items, formationId) => {
  const now = new Date();
  return items
    .filter((it) => {
      if (formationId && it.module?.formation?.id_formation !== formationId) return false;
      const d = it.creneau?.date ? new Date(it.creneau.date) : null;
      if (!d) return false;
      return d >= new Date(now.toISOString().slice(0, 10));
    })
    .sort((a, b) => (a.creneau?.date || '').localeCompare(b.creneau?.date || ''))
    .slice(0, 5)
    .map((it) => ({
      module: it.module?.nom || `M${it.module_id}`,
      formation: it.module?.formation?.nom || '-',
      date: it.creneau?.date || '-',
      slot: slotLabel(it.creneau),
      salle: it.salle?.nom || `S${it.salle_id}`
    }));
};

router.get('/', async (req, res) => {
  try {
    const runId = req.query.run_id || null;
    const run = await resolveRun(runId);
    const [itemsRaw, deptNames, totalRooms, formationsMap] = await Promise.all([
      loadItems(run.id),
      loadDepartements(),
      loadRoomsCount(),
      loadFormations()
    ]);

    // Hydrate formation on module to éviter la relation manquante côté Supabase
    const items = itemsRaw.map((it) => {
      if (it.module?.id_formation && formationsMap[it.module.id_formation]) {
        it.module.formation = formationsMap[it.module.id_formation];
      }
      return it;
    });

    const durationMs =
      run.metrics?.duration_ms ||
      (run.started_at && run.ended_at ? new Date(run.ended_at).getTime() - new Date(run.started_at).getTime() : null);

    const user = req.user;
    const role = user?.role;
    const base = computeBase(items, totalRooms);

    let payload = { ...base, generation_duration_ms: durationMs };

    if (role === 'admin_examens') {
      payload = { ...payload };
    } else if (role === 'doyen') {
      const byDept = groupByDept(items, deptNames);
      payload = {
        exams_count: base.exams_count,
        avg_room_fill_rate: base.avg_room_fill_rate,
        capacity_exceeded_count: base.capacity_exceeded_count,
        room_collision_count: base.room_collision_count,
        rooms_used_ratio: base.rooms_used_ratio,
        occupancy_by_dept: byDept,
        conflicts_by_dept: byDept.map((d) => ({
          dept_id: d.dept_id,
          dept_name: d.dept_name,
          capacity_exceeded_count: d.capacity_exceeded_count
        })),
        generation_duration_ms: durationMs
      };
    } else if (role === 'chef_dept') {
      const scoped = items.filter((it) => it.module?.formation?.id_dept === user.dept_id);
      const scopedBase = computeBase(scoped, totalRooms);
      payload = {
        ...scopedBase,
        generation_duration_ms: durationMs,
        formation_most_loaded: formationMostLoaded(scoped)
      };
    } else if (role === 'prof') {
      payload = {
        surveillances_count: 0,
        upcoming_exams: [],
        todo: 'Surveillance à implémenter (v1 placeholder)'
      };
    } else if (role === 'etudiant') {
      const upcoming = upcomingFromItems(items, user.formation_id);
      payload = {
        exams_count: upcoming.length,
        upcoming_exams: upcoming,
        exams_per_day: base.exams_per_day
      };
    } else {
      payload = { message: 'Role non géré' };
    }

    res.json({ run: runMeta(run), role, kpis: payload });
  } catch (err) {
    console.error('[GET /api/kpis] error', err);
    res.status(500).json({ error: err.message || 'Erreur KPI' });
  }
});

export default router;

