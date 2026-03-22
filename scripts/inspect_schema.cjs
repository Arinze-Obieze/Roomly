const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key in .env / .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES_TO_CHECK = [
  'user_lifestyles',
  'match_preferences',
  'properties',
  'property_interests',
  'compatibility_scores',
  'conversations',
  'messages'
];

async function inspectSchema() {
  const lines = [];
  const log = (msg) => {
    console.log(msg);
    lines.push(msg);
  };

  log(`=== Roomly Schema Inspection: ${new Date().toISOString()} ===`);
  log(`URL: ${supabaseUrl}`);
  log(`Key type: ${(process.env.SUPABASE_SECRET_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'Service Role' : 'Anon'}\n`);

  // First, try dynamic discovery
  try {
    const { data, error } = await supabase
      .rpc('_postgrest_accessible_tables', {});
    if (!error && data) {
      log('Discoverable tables via RPC: ' + JSON.stringify(data));
    }
  } catch (e) { /* ignore */ }

  for (const table of TABLES_TO_CHECK) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(2);

      if (error) {
        if (error.code === '42P01') {
          log(`[MISSING]  ${table}`);
        } else {
          log(`[ERROR]    ${table}: ${error.message} (code: ${error.code})`);
        }
      } else {
        const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
        log(`[EXISTS]   ${table} | rows≈${count} | columns(${cols.length}): ${cols.join(', ')}`);
        if (data && data.length > 0) {
          log(`           sample: ${JSON.stringify(data[0]).substring(0, 300)}`);
        }
      }
    } catch (e) {
      log(`[EXCEPTION] ${table}: ${e.message}`);
    }
  }

  // Check storage buckets
  log('\n=== Storage Buckets ===');
  const { data: buckets, error: be } = await supabase.storage.listBuckets();
  if (!be && buckets) {
    buckets.forEach(b => log(`  - ${b.name} (public: ${b.public})`));
  } else {
    log(`  Error listing buckets: ${be?.message}`);
  }

  fs.writeFileSync('schema_report.txt', lines.join('\n'));
  console.log('\n✅ Schema report saved to schema_report.txt');
}

inspectSchema().catch(console.error);
