import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const { SUPABASE_URL } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const SLOTS = [
  { start: '08:00', end: '10:00' },
  { start: '10:30', end: '12:30' },
  { start: '14:00', end: '16:00' }
];

async function seedSlots({ startDate = '2026-01-01', days = 5 }) {
  const start = new Date(startDate);
  const rows = [];

  for (let d = 0; d < days; d += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const iso = date.toISOString().slice(0, 10);
    SLOTS.forEach((slot) => {
      rows.push({
        date: iso,
        heure_debut: slot.start,
        heure_fin: slot.end
      });
    });
  }

  const { data, error } = await supabase.from('creneau').insert(rows).select();

  if (error) throw error;
  console.log(`Inserted/updated ${data.length} creneaux`);
}

seedSlots({ startDate: process.argv[2] || '2026-01-01', days: Number(process.argv[3]) || 5 })
  .then(() => {
    console.log('Slots seed completed');
  })
  .catch((err) => {
    console.error('Seed slots failed:', err);
    process.exit(1);
  });

