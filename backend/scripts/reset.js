import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * TODO: Vérifier les noms exacts des tables/colonnes avant utilisation.
 * Supprime les données dans l'ordre inverse des dépendances.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { SUPABASE_URL, SUPABASE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const deletePlan = [
  { table: 'planning_items', key: 'id' },
  { table: 'planning_runs', key: 'id' },
  { table: 'inscription', key: 'id_etudiant' },
  { table: 'etudiant', key: 'id_etudiant' },
  { table: 'professeur', key: 'id_prof' },
  { table: 'module', key: 'id_module' },
  { table: 'formation', key: 'id_formation' },
  { table: 'departement', key: 'id_dept' },
  { table: 'faculte', key: 'id_fac' },
  { table: 'universite', key: 'id_univ' },
  { table: 'salle', key: 'id_salle' },
  { table: 'creneau', key: 'id_creneau' }
];

async function deleteAll(table, key) {
  // Supprime tout en filtrant sur non-null pour éviter les contraintes (uuid/bigint)
  const { data, error } = await supabase.from(table).delete().not(key, 'is', null).select();
  if (error) {
    console.error(`Delete error on ${table}:`, error);
    throw error;
  }
  console.log(`Deleted ${data.length} rows from ${table}`);
  return data.length;
}

async function main() {
  console.log('Resetting database (academic tables)...');
  let total = 0;
  for (const step of deletePlan) {
    total += await deleteAll(step.table, step.key);
  }
  console.log(`Reset completed. Total rows deleted: ${total}`);
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});


