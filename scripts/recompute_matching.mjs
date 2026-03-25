import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {
  MATCHING_RECOMPUTE_SCOPES,
  runBulkMatchingRecompute,
} from '../core/services/matching/bulk-recompute.service.js';

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

function getArgValue(flag, fallback = null) {
  const arg = process.argv.slice(2).find((entry) => entry.startsWith(`${flag}=`));
  return arg ? arg.slice(flag.length + 1) : fallback;
}

async function main() {
  const scope = getArgValue('--scope', MATCHING_RECOMPUTE_SCOPES.approved_properties);
  const concurrency = Number(getArgValue('--concurrency', '10'));
  const limit = Number(getArgValue('--limit', '0')) || null;

  if (!Object.values(MATCHING_RECOMPUTE_SCOPES).includes(scope)) {
    console.error(`Invalid --scope value. Use one of: ${Object.values(MATCHING_RECOMPUTE_SCOPES).join(', ')}`);
    process.exit(1);
  }

  console.log(`Running bulk matching recompute from ${envPath}...`);
  console.log(`Scope: ${scope}`);
  console.log(`Concurrency: ${concurrency}`);
  if (limit) console.log(`Limit: ${limit}`);

  const results = await runBulkMatchingRecompute(supabase, {
    scope,
    concurrency,
    limit,
    onProgress: (event) => {
      if (event.stage === 'targets_loaded') {
        console.log(`Loaded ${event.total} targets. Processing in batches of ${event.concurrency}...`);
        return;
      }

      if (event.stage === 'batch_complete') {
        console.log(
          `Processed ${event.processed}/${event.total} | succeeded=${event.succeeded} failed=${event.failed} updatedScores=${event.updatedScores}`
        );
      }
    },
  });

  console.log('\nBulk recompute complete.');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error('Bulk recompute failed:', error.message || error);
  process.exit(1);
});
