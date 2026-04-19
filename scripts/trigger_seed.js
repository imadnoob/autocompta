
const { createClient } = require('@supabase/supabase-js');

// Load config from .env.local manually for this standalone run
// Use environment variables or pass as argument. DO NOT COMMIT SECRET KEYS
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function trigger() {
  try {
    console.log("1. Finding user...");
    const { data: { users }, error: uErr } = await supabase.auth.admin.listUsers();
    if (uErr || !users || users.length === 0) throw new Error("No users found");
    const userId = users[0].id;
    console.log(`   Target User: ${userId}`);

    console.log("2. Clearing old entries to force refresh...");
    await supabase.from('accounting_knowledge_base').delete().eq('user_id', userId);

    console.log("3. Triggering seeding API...");
    const res = await fetch('http://localhost:3000/api/seed-knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });

    const data = await res.json();
    console.log("   API Response:", data);
    console.log("DONE.");
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}

trigger();
