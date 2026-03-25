import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = fs.existsSync(path.resolve(process.cwd(), '.env.local')) ? '.env.local' : '.env';
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SECRET_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or service role key in .env.local / .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has('--write');
const shouldRewriteGeneric = args.has('--rewrite-generic');
const BATCH_SIZE = 500;

const SCHEDULE_TYPES = ['9-5', 'shift', 'remote', 'student'];
const MOVE_IN_URGENCIES = ['immediately', '1-month', '2-months', 'flexible'];
const DRINKING_HABITS = ['never', 'social', 'often'];
const DIETARY_PREFERENCES = ['omnivore', 'vegetarian', 'vegan', 'halal'];
const OVERNIGHT_GUESTS = ['rarely', 'occasionally', 'frequently'];
const INTEREST_POOL = [
  'Cooking', 'Fitness', 'Gaming', 'Music', 'Movies', 'Reading', 'Travel', 'Photography',
  'Yoga', 'Art', 'Tech', 'Outdoors', 'Nightlife', 'Board Games', 'Gardening', 'Fashion',
];
const PROPERTY_TYPE_FALLBACKS = ['apartment', 'house', 'studio'];

function hashUserId(userId) {
  return crypto.createHash('sha256').update(String(userId)).digest();
}

function byteAt(hash, index) {
  return hash[index % hash.length];
}

function pickOne(hash, index, options) {
  return options[byteAt(hash, index) % options.length];
}

function pickLevel(hash, index) {
  return (byteAt(hash, index) % 3) + 1;
}

function pickBool(hash, index, threshold = 128) {
  return byteAt(hash, index) < threshold;
}

function pickRange(hash, index, min, max) {
  return min + (byteAt(hash, index) % ((max - min) + 1));
}

function pickInterests(hash) {
  const count = 2 + (byteAt(hash, 0) % 4);
  const chosen = new Set();
  let cursor = 1;

  while (chosen.size < count) {
    chosen.add(INTEREST_POOL[byteAt(hash, cursor) % INTEREST_POOL.length]);
    cursor += 1;
  }

  return [...chosen];
}

function pickPreferredPropertyTypes(hash, property) {
  const candidates = new Set();
  if (property?.property_type) candidates.add(property.property_type);
  candidates.add(pickOne(hash, 9, PROPERTY_TYPE_FALLBACKS));
  if (pickBool(hash, 10, 80)) {
    candidates.add(pickOne(hash, 11, PROPERTY_TYPE_FALLBACKS));
  }
  return [...candidates].slice(0, 3);
}

async function fetchAll(table, select, queryBuilder = (query) => query) {
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + BATCH_SIZE - 1);
    query = queryBuilder(query);
    const { data, error } = await query;

    if (error) throw error;
    if (!data?.length) break;

    rows.push(...data);
    if (data.length < BATCH_SIZE) break;
    from += BATCH_SIZE;
  }

  return rows;
}

function isGenericLifestyleRow(row) {
  if (!row) return false;

  const preferredPropertyTypes = Array.isArray(row.preferred_property_types)
    ? row.preferred_property_types
    : [];
  const interests = Array.isArray(row.interests) ? row.interests : [];
  const pets = row.pets && typeof row.pets === 'object' ? row.pets : {};

  return (
    row.move_in_urgency === 'flexible' &&
    row.schedule_type === '9-5' &&
    row.smoking_status === 'no' &&
    row.drinking_habits === 'social' &&
    row.cannabis_friendly === false &&
    row.dietary_preference === 'omnivore' &&
    preferredPropertyTypes.length === 1 &&
    preferredPropertyTypes[0] === 'apartment' &&
    Number(row.cleanliness_level) === 2 &&
    Number(row.social_level) === 2 &&
    Number(row.noise_tolerance) === 2 &&
    row.overnight_guests === 'occasionally' &&
    interests.length === 0 &&
    Number(row.min_stay) === 6 &&
    Number(row.max_stay) === 12 &&
    pets.has_pets === false &&
    pets.accepts_pets === true &&
    (!pets.description || pets.description === '')
  );
}

function buildLifestyleRow(userId, propertyByUserId) {
  const property = propertyByUserId.get(userId) || null;
  const hash = hashUserId(userId);
  const hasPets = pickBool(hash, 2, 70);
  const minStay = pickRange(hash, 13, 3, 9);
  const maxStay = Math.max(minStay + pickRange(hash, 14, 3, 18), 12);

  return {
    user_id: userId,
    primary_role: property ? 'host' : 'seeker',
    current_city: property?.city || '',
    move_in_urgency: pickOne(hash, 1, MOVE_IN_URGENCIES),
    schedule_type: pickOne(hash, 3, SCHEDULE_TYPES),
    smoking_status: pickBool(hash, 4, 210) ? 'no' : 'outside',
    drinking_habits: pickOne(hash, 5, DRINKING_HABITS),
    cannabis_friendly: pickBool(hash, 6, 45),
    dietary_preference: pickOne(hash, 7, DIETARY_PREFERENCES),
    preferred_property_types: pickPreferredPropertyTypes(hash, property),
    cleanliness_level: pickLevel(hash, 8),
    social_level: pickLevel(hash, 12),
    noise_tolerance: pickLevel(hash, 15),
    overnight_guests: pickOne(hash, 16, OVERNIGHT_GUESTS),
    pets: {
      has_pets: hasPets,
      accepts_pets: hasPets ? true : pickBool(hash, 17, 180),
      description: hasPets ? pickOne(hash, 18, ['Cat', 'Dog', 'Small dog', 'Rescue cat', 'Fish', 'Mixed pets']) : '',
    },
    interests: pickInterests(hash),
    min_stay: minStay,
    max_stay: maxStay,
  };
}

async function main() {
  console.log(`Loading users from ${envPath}...`);

  const [users, lifestyles, properties] = await Promise.all([
    fetchAll('users', 'id'),
    fetchAll(
      'user_lifestyles',
      'user_id, primary_role, current_city, move_in_urgency, schedule_type, smoking_status, drinking_habits, cannabis_friendly, dietary_preference, preferred_property_types, cleanliness_level, social_level, noise_tolerance, overnight_guests, pets, interests, min_stay, max_stay'
    ),
    fetchAll('properties', 'listed_by_user_id, city, property_type, created_at', (query) =>
      query
        .not('listed_by_user_id', 'is', null)
        .order('created_at', { ascending: false })
    ),
  ]);

  const existingLifestyleIds = new Set((lifestyles || []).map((row) => row.user_id).filter(Boolean));
  const genericLifestyleIds = new Set(
    (lifestyles || [])
      .filter((row) => row?.user_id && isGenericLifestyleRow(row))
      .map((row) => row.user_id)
  );
  const propertyByUserId = new Map();

  for (const property of properties || []) {
    if (!property?.listed_by_user_id || propertyByUserId.has(property.listed_by_user_id)) continue;
    propertyByUserId.set(property.listed_by_user_id, property);
  }

  const missingUsers = (users || [])
    .map((user) => user.id)
    .filter((userId) => userId && !existingLifestyleIds.has(userId));
  const genericUsers = (users || [])
    .map((user) => user.id)
    .filter((userId) => userId && genericLifestyleIds.has(userId));

  const targetUserIds = shouldRewriteGeneric
    ? [...new Set([...missingUsers, ...genericUsers])]
    : missingUsers;

  if (targetUserIds.length === 0) {
    if (shouldRewriteGeneric) {
      console.log('No users are missing lifestyle rows, and no generic lifestyle rows were detected.');
    } else {
      console.log('No users are missing lifestyle rows.');
      console.log('If you want to diversify previously backfilled default rows, rerun with --rewrite-generic.');
    }
    return;
  }

  const rowsToInsert = targetUserIds.map((userId) => buildLifestyleRow(userId, propertyByUserId));

  console.log(`Found ${users.length} total users.`);
  console.log(`Found ${lifestyles.length} existing lifestyle rows.`);
  console.log(`Found ${missingUsers.length} users missing lifestyle rows.`);
  console.log(`Found ${genericUsers.length} generic lifestyle rows.`);
  console.log(`Will ${shouldRewriteGeneric ? 'backfill/rewrite' : 'backfill'} ${rowsToInsert.length} lifestyle rows.`);
  console.log('Preview of first 5 rows:');
  console.log(JSON.stringify(rowsToInsert.slice(0, 5), null, 2));

  if (!shouldWrite) {
    console.log('\nDry run only. Re-run with --write to apply changes.');
    if (!shouldRewriteGeneric && genericUsers.length > 0) {
      console.log('Tip: add --rewrite-generic to diversify older default-like lifestyle rows too.');
    }
    return;
  }

  for (let index = 0; index < rowsToInsert.length; index += BATCH_SIZE) {
    const batch = rowsToInsert.slice(index, index + BATCH_SIZE);
    const { error } = await supabase
      .from('user_lifestyles')
      .upsert(batch, { onConflict: 'user_id' });

    if (error) throw error;
    console.log(`Inserted batch ${Math.floor(index / BATCH_SIZE) + 1} (${batch.length} rows).`);
  }

  console.log(`\nUpdated ${rowsToInsert.length} lifestyle rows successfully.`);
  console.log('If you want fresh compatibility scores immediately, run your recompute flow after this.');
}

main().catch((error) => {
  console.error('Backfill failed:', error.message || error);
  process.exit(1);
});
