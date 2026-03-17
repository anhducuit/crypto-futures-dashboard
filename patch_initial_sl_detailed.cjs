const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tnmagcatofooeshzdhac.supabase.co';
const supabaseAnonKey = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function patchInitialSL() {
    console.log('--- Detailed Database Patch Start ---');

    const { data: records, error } = await supabase
        .from('trading_history')
        .select('id, stop_loss, trade_id')
        .is('initial_stop_loss', null);

    if (error) {
        console.error('Fetch Error:', error);
        return;
    }

    console.log(`Found ${records?.length || 0} null records.`);

    for (const record of (records || [])) {
        console.log(`Patching ${record.trade_id || record.id} (SL: ${record.stop_loss})...`);
        const { error: updErr } = await supabase
            .from('trading_history')
            .update({ initial_stop_loss: record.stop_loss })
            .eq('id', record.id);

        if (updErr) {
            console.error(`Patch Failed for ${record.trade_id || record.id}:`, JSON.stringify(updErr));
        } else {
            console.log(`Patch Success for ${record.trade_id || record.id}`);
        }
    }
    console.log('--- Detailed Patch End ---');
}

patchInitialSL();
