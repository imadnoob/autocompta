import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bpplnmuwizmkqomogron.supabase.co';
const supabaseKey = 'sb_publishable_i5m2N3Ld4SYufGNlx6oApg_JGieYU6j';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: entries, error: err1 } = await supabase
        .from('journal_entries')
        .select('doc_id')
        .not('lettre_code', 'is', null)
        .not('doc_id', 'is', null);

    if (err1) { console.error('Error fetching:', err1); return; }

    const docIds = entries.map(e => e.doc_id).filter(Boolean);
    const uniqueIds = [...new Set(docIds)];

    console.log(`Found ${uniqueIds.length} lettraged documents. Updating...`);

    if (uniqueIds.length > 0) {
        const { error: err2 } = await supabase
            .from('documents')
            .update({ accounting_status: 'lettre' })
            .in('id', uniqueIds);

        if (err2) {
            console.error('Error updating documents:', err2);
        } else {
            console.log('Successfully updated existing documents!');
        }
    } else {
        console.log('No documents to update.');
    }
}
main();
