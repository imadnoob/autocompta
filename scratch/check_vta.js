const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
    const { data, error } = await supabase
        .from('journal_entries')
        .select('account, entry_date, debit, credit')
        .or('account.ilike.4455%,account.ilike.3455%')
        .order('entry_date');
    
    if (error) {
        console.error(error);
        return;
    }
    
    console.log(`Found ${data.length} VAT entries`);
    data.slice(0, 10).forEach(d => console.log(d));
    
    const marchApr = data.filter(d => d.entry_date && (d.entry_date.includes('-03-') || d.entry_date.includes('-04-')));
    console.log(`Found ${marchApr.length} entries for March/April`);
}

checkData();
