const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    console.log("Fetching a user...");
    const { data: users } = await supabase.from('users').select('id').limit(1);
    let userId = users?.[0]?.id;
    if (!userId) {
        const { data: docs } = await supabase.from('documents').select('user_id').limit(1);
        userId = docs?.[0]?.user_id;
    }
    console.log("Using User ID:", userId);

    if (!userId) {
        console.error("No user found!");
        return;
    }

    console.log("Setting 2 documents to 'a_saisir'...");
    const { data: docs } = await supabase.from('documents').select('id, original_name').limit(2);
    if (docs?.length) {
        await supabase.from('documents').update({ accounting_status: 'a_saisir' }).in('id', docs.map(d => d.id));
        console.log("Documents staging:", docs.map(d => d.original_name));
    }

    console.log("Calling /api/agent to process...");
    try {
        const res = await fetch('http://localhost:3000/api/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: "enregistre toutes les factures non comptabilisés",
                userId: userId,
                history: []
            })
        });

        console.log("Agent API STATUS:", res.status);
        const text = await res.text();
        console.log("Agent API RESPONSE:", text.substring(0, 500));

        const { data: finalDocs } = await supabase.from('documents').select('id, accounting_status').in('id', docs?.map(d => d.id) || []);
        console.log("Final doc status:", finalDocs);

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}
main();
