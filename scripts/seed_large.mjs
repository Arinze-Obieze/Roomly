import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load .env or .env.local
const envPath = fs.existsSync('.env.local') ? '.env.local' : '.env';
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NUM_USERS = 300;
const NUM_PROPERTIES = 1000;
const SEED_PASSWORD = 'SeedPassword123!';

// Helper to wait
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const PROPERTY_TYPES = ['house', 'apartment', 'flat', 'studio'];
const ROOM_TYPES = ['private', 'shared', 'entire'];
const BILLS_OPTIONS = ['all', 'some', 'none'];
const STATUSES = ['available', 'rented', 'unavailable'];

const IRISH_LOCATIONS = [
  { city: 'Dublin', state: 'County Dublin' },
  { city: 'Cork', state: 'County Cork' },
  { city: 'Galway', state: 'County Galway' },
  { city: 'Limerick', state: 'County Limerick' },
  { city: 'Waterford', state: 'County Waterford' },
  { city: 'Ennis', state: 'County Clare' },
  { city: 'Tralee', state: 'County Kerry' },
  { city: 'Sligo', state: 'County Sligo' },
];

async function clearOldData() {
  console.log('🧹 Clearing old seeded properties and users...');
  
  // We'll delete properties with a specific title suffix to avoid wiping real data entirely
  // Wait, the user said "clear out existing data before inserting". 
  // We will delete all properties (or truncate if we can). Since we can't easily truncate via API,
  // we'll delete properties and users created by this script.
  // We will add a metadata tag or just delete all records since it's a test environment.
  
  // Actually, we'll try to delete all properties, property_media, user_lifestyles, match_preferences
  const { error: p1 } = await supabaseAdmin.from('property_media').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: p2 } = await supabaseAdmin.from('properties').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: p3 } = await supabaseAdmin.from('property_interests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { error: p4 } = await supabaseAdmin.from('compatibility_scores').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Delete test users created by faker based on our seed email pattern
  const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (usersData && usersData.users) {
    for (const u of usersData.users) {
      if (u.email && u.email.endsWith('@roomly.test')) {
        await supabaseAdmin.auth.admin.deleteUser(u.id);
      }
    }
  }

  console.log('✅ Old data cleared.');
}

async function createUsers() {
  console.log(`👤 Creating ${NUM_USERS} users...`);
  const createdUsers = [];

  for (let i = 0; i < NUM_USERS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    // Predictable emails you can use to login
    const email = `seeduser_${i}@roomly.test`;
    const password = SEED_PASSWORD;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
        avatar_url: faker.image.avatar(),
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating user:', authError);
      continue;
    }

    const userId = authData.user.id;
    const isHost = i % 2 === 0;

    // Try to upsert into public.users to ensure the row exists and has the display avatar.
    // Handles cases where trigger might be missing or delayed.
    await supabaseAdmin.from('users').upsert({
      id: userId,
      full_name: `${firstName} ${lastName}`,
      profile_picture: faker.image.avatar(),
      email: email, // If the table requires email
    });

    // Insert user_lifestyles
    await supabaseAdmin.from('user_lifestyles').insert({
      user_id: userId,
      primary_role: isHost ? 'host' : 'seeker',
      cleanliness_level: faker.helpers.arrayElement(['clean', 'average', 'messy']),
      overnight_guests: faker.helpers.arrayElement(['rarely', 'sometimes', 'often']),
      occupation: faker.helpers.arrayElement(['student', 'professional', 'other']),
      smoking_status: faker.helpers.arrayElement(['non-smoker', 'smoker']),
    });

    // Insert match_preferences
    await supabaseAdmin.from('match_preferences').insert({
      user_id: userId,
      age_min: faker.number.int({ min: 18, max: 25 }),
      age_max: faker.number.int({ min: 26, max: 60 }),
      budget_min: faker.number.int({ min: 300, max: 800 }),
      budget_max: faker.number.int({ min: 800, max: 2000 }),
      location_areas: [faker.helpers.arrayElement(IRISH_LOCATIONS).city],
      stay_duration_min: faker.number.int({ min: 1, max: 6 }),
      stay_duration_max: faker.number.int({ min: 6, max: 24 }),
    });

    createdUsers.push({ id: userId, email, password, isHost });
  }

  // Save the user credentials to a file so you can easily reference them to log in
  fs.writeFileSync('seeded_users.json', JSON.stringify(createdUsers.map(u => ({
    email: u.email,
    password: u.password,
    role: u.isHost ? 'Host' : 'Seeker'
  })), null, 2));

  console.log('✅ Users created. Saved credentials to seeded_users.json');
  return createdUsers;
}

async function createProperties(users) {
  console.log(`🏠 Creating ${NUM_PROPERTIES} properties...`);
  const hosts = users.filter((u) => u.isHost);

  if (hosts.length === 0) {
    console.warn('No hosts available to create properties.');
    return;
  }

  for (let i = 0; i < NUM_PROPERTIES; i++) {
    const host = faker.helpers.arrayElement(hosts);
    const location = faker.helpers.arrayElement(IRISH_LOCATIONS);
    
    // Generate realistic Property Data
    const propertyData = {
      title: `${faker.helpers.arrayElement(['Beautiful', 'Cozy', 'Spacious', 'Modern', 'Charming'])} ${faker.helpers.arrayElement(['Room', 'Studio', 'House', 'Apartment'])} in ${location.city}`,
      description: faker.lorem.paragraphs(2),
      property_type: faker.helpers.arrayElement(PROPERTY_TYPES),
      room_type: faker.helpers.arrayElement(ROOM_TYPES),
      price_per_month: faker.number.int({ min: 400, max: 2500 }),
      state: location.state,
      city: location.city,
      street: faker.location.streetAddress(),
      bedrooms: faker.number.int({ min: 1, max: 5 }),
      bathrooms: faker.number.int({ min: 1, max: 3 }),
      square_meters: faker.number.int({ min: 20, max: 200 }),
      available_from: faker.date.future({ years: 0.5 }).toISOString().split('T')[0],
      amenities: faker.helpers.arrayElements(['WiFi', 'Washing Machine', 'Dryer', 'Parking', 'Balcony', 'Garden', 'Dishwasher'], { min: 2, max: 6 }),
      listed_by_user_id: host.id,
      is_active: faker.datatype.boolean({ probability: 0.95 }), // 95% active to ensure we see plenty of them
      status: faker.helpers.arrayElement(STATUSES),
      approval_status: 'approved',
      privacy_setting: faker.datatype.boolean({ probability: 0.85 }) ? 'public' : 'private',
      rental_type: faker.helpers.arrayElement(['monthly', 'weekly', 'yearly']),
      offering_type: faker.helpers.arrayElement(['private_room', 'entire_place', 'shared_room']),
      deposit: faker.number.int({ min: 200, max: 2500 }),
      bills_option: faker.helpers.arrayElement(BILLS_OPTIONS),
      couples_allowed: faker.datatype.boolean(),
      occupation_preference: faker.helpers.arrayElement(['any', 'student', 'professional', 'any', 'any']),
      gender_preference: faker.helpers.arrayElement(['any', 'male', 'female', 'any', 'any']),
      age_min: faker.datatype.boolean({ probability: 0.7 }) ? faker.number.int({ min: 18, max: 25 }) : null,
      age_max: faker.datatype.boolean({ probability: 0.7 }) ? faker.number.int({ min: 30, max: 60 }) : null,
      min_stay_months: faker.number.int({ min: 1, max: 12 }),
      accept_viewings: faker.datatype.boolean(),
      house_rules: faker.helpers.arrayElements(['no_smoking', 'pets_allowed', 'couples_welcome', 'students_welcome'], { min: 0, max: 4 }),
    };

    const { data: property, error: pErr } = await supabaseAdmin
      .from('properties')
      .insert(propertyData)
      .select()
      .single();

    if (pErr || !property) {
      console.error('Error creating property:', pErr);
      continue;
    }

    // Generate property media
    const mediaRecords = [];
    const numPhotos = faker.number.int({ min: 2, max: 5 });
    
    for (let pIdx = 0; pIdx < numPhotos; pIdx++) {
      // Use loremflickr for beautiful, relevant random images based on keywords
      const imageUrl = `https://loremflickr.com/800/600/${faker.helpers.arrayElement(['bedroom', 'livingroom', 'kitchen', 'house', 'apartment'])}?random=${faker.number.int(1000)}`;
      mediaRecords.push({
        property_id: property.id,
        url: imageUrl,
        media_type: 'image',
        is_primary: pIdx === 0,
        display_order: pIdx + 1,
      });
    }

    await supabaseAdmin.from('property_media').insert(mediaRecords);
  }

  console.log('✅ Properties created.');
}

async function main() {
  console.log('🌱 Starting database seed script...');
  await clearOldData();
  const users = await createUsers();
  await createProperties(users);
  console.log('🎉 Seed complete! Massive data initialized.');
}

main().catch(console.error);
