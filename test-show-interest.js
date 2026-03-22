const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function test() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // get any user
  const { data: users, error: uErr } = await supabase.from('users').select('id, email').limit(2);
  if (uErr) { console.error('uErr', uErr); return; }
  
  console.log('Got user', users[0].id);
  
  // get any property
  const { data: props, error: pErr } = await supabase.from('properties').select('id, listed_by_user_id').neq('listed_by_user_id', users[0].id).eq('is_active', true).limit(1);
  if (pErr || !props.length) { console.error('pErr', pErr); return; }
  
  console.log('Got property', props[0].id);

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Let's get columns of notifications
  const { data: cols } = await admin.rpc('get_columns', { table_name: 'notifications' });
  if (cols) console.log('cols via rpc:', cols);
  else {
    // Try to get one row
    const { data: n } = await admin.from('notifications').select('*').limit(1);
    console.log('first notification:', n);
  }
}

test();
