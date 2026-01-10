import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * TODO: Vérifier la correspondance exacte des noms de tables/colonnes
 * (universite, faculte, departement, formation, module, salle,
 *  professeur, etudiant, inscription) avec le schéma Supabase.
 * Adapter les clés primaires/étrangères si nécessaire.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const { SUPABASE_URL } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

// Choose dataset size: 'small' or 'medium'
const DATASET_SIZE = 'small';

const SIZE_CONFIG = {
  small: {
    departments: 3,
    formationsPerDept: 2,
    modules: { min: 30, max: 40 },
    salles: { min: 12, max: 14 },
    profs: { min: 20, max: 25 },
    students: { min: 200, max: 250 },
    modulesPerStudent: { min: 6, max: 7 }
  },
  medium: {
    departments: 3,
    formationsPerDept: 2,
    modules: { min: 50, max: 60 },
    salles: { min: 15, max: 18 },
    profs: { min: 28, max: 35 },
    students: { min: 280, max: 350 },
    modulesPerStudent: { min: 7, max: 9 }
  }
};

const RNG_SEED = 42; // deterministic seed for reproducible data
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const stats = {};

// ---------- Helpers ----------
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(RNG_SEED);

function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick(list) {
  return list[randomInt(0, list.length - 1)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + random() * (end.getTime() - start.getTime()));
}

function chunkArray(arr, size) {
  const res = [];
  for (let i = 0; i < arr.length; i += size) {
    res.push(arr.slice(i, i + size));
  }
  return res;
}

const emailSeen = new Set();
function toSlug(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function uniqueEmail(baseName) {
  const base = toSlug(baseName).replace(/-+/g, '.');
  let candidate = `${base}@univ-demo.fr`;
  let counter = 1;
  while (emailSeen.has(candidate)) {
    counter += 1;
    candidate = `${base}${counter}@univ-demo.fr`;
  }
  emailSeen.add(candidate);
  return candidate;
}

function formatDateISO(d) {
  return d.toISOString().split('T')[0];
}

function getId(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return row.id;
}

async function insertRows(table, rows, chunkSize = 500) {
  if (!rows.length) return [];
  const results = [];
  for (const chunk of chunkArray(rows, chunkSize)) {
    const { data, error } = await supabase.from(table).insert(chunk).select();
    if (error) {
      console.error(`Insert error on ${table}:`, error);
      throw error;
    }
    results.push(...data);
  }
  stats[table] = (stats[table] || 0) + results.length;
  console.log(`Inserted ${results.length} rows into ${table}`);
  return results;
}

async function ensureEmpty(tables) {
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.error(`Unable to check table ${table}:`, error);
      throw error;
    }
    if (count && count > 0) {
      console.warn(`Table ${table} already contains data (${count} rows). Seed aborted to avoid duplicates.`);
      return false;
    }
  }
  return true;
}

// ---------- Data pools ----------
const departmentNames = [
  'Informatique',
  'Mathematiques',
  'Physique',
  'Electronique',
  'Gestion',
  'Chimie'
];

// Use 1-char codes to fit schemas with VARCHAR(1) on niveau (L/M/D)
const formationLevels = ['L', 'M', 'D'];

const moduleSubjects = [
  'Programmation',
  'Bases de donnees',
  'Reseaux',
  'Systemes',
  'Compilation',
  'Algebre',
  'Analyse',
  'Probabilites',
  'Statistiques',
  'Physique quantique',
  'Electronique analogique',
  'Electronique numerique',
  'Management',
  'Finance',
  'Comptabilite',
  'Marketing',
  'Developpement web',
  'DevOps',
  'Cloud',
  'IA',
  'Apprentissage automatique',
  'Vision par ordinateur',
  'Cyberscurite',
  'Cryptographie',
  'Structure de donnees',
  'Algorithmes avances',
  'IOT',
  'Robotique',
  'Simulation numerique',
  'Methode numerique'
];

const firstNames = [
  'Alex',
  'Marie',
  'Sofia',
  'Lucas',
  'Emma',
  'Noah',
  'Lina',
  'Adam',
  'Sarah',
  'Yanis',
  'Nora',
  'Elias',
  'Jade',
  'Hugo',
  'Lou',
  'Liam',
  'Manon',
  'Chloe',
  'Lea',
  'Nina',
  'Omar',
  'Rayan',
  'Maya',
  'Ilyes',
  'Luna'
];

const lastNames = [
  'Martin',
  'Bernard',
  'Thomas',
  'Petit',
  'Robert',
  'Richard',
  'Durand',
  'Dubois',
  'Moreau',
  'Laurent',
  'Simon',
  'Michel',
  'Garcia',
  'David',
  'Bertrand',
  'Roux',
  'Vincent',
  'Fournier',
  'Morel',
  'Girard',
  'Andre',
  'Lefebvre',
  'Mercier',
  'Dupont',
  'Lambert'
];

const grades = ['MCF', 'PR', 'ATER', 'Vacataire'];
const salleTypes = ['amphi', 'salle'];

// ---------- Generators ----------
function buildDepartments(idFac, count) {
  const chosen = departmentNames.slice(0, count);
  return chosen.map((nom, idx) => ({
    nom,
    lieu: `Batiment ${String.fromCharCode(65 + idx)}`,
    id_fac: idFac
  }));
}

function buildFormations(departments, formationsPerDept) {
  const formations = [];
  departments.forEach((dept, idx) => {
    for (let i = 0; i < formationsPerDept; i += 1) {
      const level = formationLevels[(idx + i) % formationLevels.length];
      formations.push({
        nom: `${level} ${dept.nom} ${i + 1}`,
        niveau: level,
        id_dept: getId(dept, ['id_dept'])
      });
    }
  });
  return formations;
}

function buildModules(formations, targetTotal) {
  const modules = [];

  // Ensure each formation gets at least 5 modules
  let remaining = targetTotal;
  formations.forEach((f) => {
    const baseCount = Math.max(5, Math.floor(targetTotal / formations.length));
    const count = Math.min(baseCount, remaining);
    remaining -= count;
    for (let i = 0; i < count; i += 1) {
      const subject = pick(moduleSubjects);
      const name = `${subject} ${i + 1}`;
      const module = {
        nom: name,
        credits: randomInt(2, 8),
        id_formation: f.id_formation || f.tempId || null
      };
      modules.push(module);
    }
  });

  // Distribute any remaining modules
  while (remaining > 0) {
    const formation = pick(formations);
    const module = {
      nom: `${pick(moduleSubjects)} ${randomInt(100, 999)}`,
      credits: randomInt(2, 8),
      id_formation: formation.id_formation || formation.tempId || null
    };
    modules.push(module);
    remaining -= 1;
  }

  return modules;
}

function buildSalles(count) {
  const salles = [];
  for (let i = 1; i <= count; i += 1) {
    const type = i % 3 === 0 ? 'amphi' : 'salle';
    const capacite = type === 'amphi' ? randomInt(120, 300) : randomInt(30, 80);
    salles.push({
      nom: `Salle-${i}`,
      capacite,
      type,
      batiment: `B${randomInt(1, 4)}`
    });
  }
  return salles;
}

function buildProfesseurs(departments, count) {
  const profs = [];
  for (let i = 0; i < count; i += 1) {
    const prenom = pick(firstNames);
    const nom = pick(lastNames);
    const dept = pick(departments);
    profs.push({
      nom,
      prenom,
      date_naissance: formatDateISO(randomDate(new Date(1965, 0, 1), new Date(1990, 11, 31))),
      email: uniqueEmail(`${prenom}.${nom}`),
      grade: pick(grades),
      id_dept: getId(dept, ['id_dept'])
    });
  }
  return profs;
}

function buildEtudiants(formations, count) {
  const etudiants = [];
  for (let i = 0; i < count; i += 1) {
    const prenom = pick(firstNames);
    const nom = pick(lastNames);
    const formation = pick(formations);
    etudiants.push({
      nom,
      prenom,
      date_naissance: formatDateISO(randomDate(new Date(1995, 0, 1), new Date(2006, 11, 31))),
      email: uniqueEmail(`${prenom}.${nom}.etd`),
      promo: randomInt(2024, 2027),
      id_formation: getId(formation, ['id_formation'])
    });
  }
  return etudiants;
}

function buildInscriptions(etudiants, modulesByFormation, minMax) {
  const inscriptions = [];
  const comboSeen = new Set();
  etudiants.forEach((etd) => {
    const formationId = etd.id_formation;
    const availableModules = modulesByFormation[formationId] || [];
    if (!availableModules.length) return;
    const desired = Math.min(randomInt(minMax.min, minMax.max), availableModules.length);
    const shuffled = [...availableModules].sort(() => random() - 0.5);
    for (let i = 0; i < desired; i += 1) {
      const moduleId = getId(shuffled[i], ['id_module']);
      const key = `${etd.id_etudiant || etd.id}-${moduleId}`;
      if (comboSeen.has(key)) continue;
      comboSeen.add(key);
      inscriptions.push({
        id_etudiant: etd.id_etudiant || etd.id,
        id_module: moduleId
      });
    }
  });
  return inscriptions;
}

// ---------- Main ----------
async function main() {
  console.log(`Seeding database (${DATASET_SIZE})...`);
  const size = SIZE_CONFIG[DATASET_SIZE];
  if (!size) {
    console.error(`Unknown DATASET_SIZE "${DATASET_SIZE}". Use "small" or "medium".`);
    process.exit(1);
  }

  const tablesToCheck = ['inscription', 'etudiant', 'professeur', 'module', 'formation', 'departement', 'faculte', 'universite', 'salle'];
  const canSeed = await ensureEmpty(tablesToCheck);
  if (!canSeed) return;

  // Université
  const univRows = await insertRows('universite', [{ nom: 'Universite Demo', ville: 'Paris' }], 1);
  const univId = getId(univRows[0], ['id_univ']);

  // Faculté
  const facRows = await insertRows('faculte', [{ nom: 'Faculte des Sciences', id_univ: univId }], 1);
  const facId = getId(facRows[0], ['id_fac']);

  // Départements
  const departments = buildDepartments(facId, size.departments);
  const deptRows = await insertRows('departement', departments, 100);

  // Formations
  const formationsDraft = buildFormations(deptRows, size.formationsPerDept);
  const formationRows = await insertRows('formation', formationsDraft, 200);

  // Modules
  const totalModules = randomInt(size.modules.min, size.modules.max);
  // We set temp ids to map modules per formation before DB ids are known
  formationRows.forEach((f, idx) => {
    f.tempId = f.id_formation || f.id || `tmp-${idx}`;
  });
  const modulesDraft = buildModules(formationRows, totalModules);
  const moduleRows = await insertRows('module', modulesDraft, 300);

  // Map modules by formation id
  const modulesByFormation = {};
  moduleRows.forEach((m) => {
    const fid = m.id_formation;
    if (!modulesByFormation[fid]) modulesByFormation[fid] = [];
    modulesByFormation[fid].push(m);
  });

// Salles
  const salleCount = randomInt(size.salles.min, size.salles.max);
  const salleRows = buildSalles(salleCount);
  await insertRows('salle', salleRows, 200);

  // Créneaux (slots) - 3 slots par jour pendant 5 jours
  const slotDefs = [
    { start: '08:00', end: '10:00' },
    { start: '10:30', end: '12:30' },
    { start: '14:00', end: '16:00' }
  ];
  const startDate = new Date();
  const creneaux = [];
  for (let d = 0; d < 5; d += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + d);
    const iso = formatDateISO(date);
    slotDefs.forEach((s) => {
      creneaux.push({
        date: iso,
        heure_debut: s.start,
        heure_fin: s.end
      });
    });
  }
  await insertRows('creneau', creneaux, 200);

  // Professeurs
  const profCount = randomInt(size.profs.min, size.profs.max);
  const profs = buildProfesseurs(deptRows, profCount);
  await insertRows('professeur', profs, 200);

  // Etudiants
  const studentCount = randomInt(size.students.min, size.students.max);
  const etudiants = buildEtudiants(formationRows, studentCount);
  const etudiantRows = await insertRows('etudiant', etudiants, 400);

  // Inscriptions
  const minMaxModules = size.modulesPerStudent;
  const inscriptions = buildInscriptions(etudiantRows, modulesByFormation, minMaxModules);
  await insertRows('inscription', inscriptions, 500);

  console.log('--- Seed summary ---');
  Object.entries(stats).forEach(([table, count]) => {
    console.log(`${table}: ${count} lignes inserees`);
  });
  console.log('Seed completed successfully.');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});


