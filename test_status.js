const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data } = await supabase.from('documents').select('*');
    console.log("Documents detailed:", data.map(d => ({ id: d.id, name: d.original_name, status: d.status, acc_status: d.accounting_status, deleted: d.deleted })));
}
check();
