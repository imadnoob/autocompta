
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function run() {
    try {
        console.log("Fetching primary user...");
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        if (userError || !users || users.length === 0) {
            console.error("No users found:", userError);
            process.exit(1);
        }
        const userId = users[0].id;
        console.log(`Target User ID: ${userId}`);

        console.log("Triggering seeding via API...");
        const res = await fetch('http://localhost:3000/api/seed-knowledge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log("SUCCESS!");
        } else {
            console.log("FAILED - already seeded or error.");
        }
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

run();
