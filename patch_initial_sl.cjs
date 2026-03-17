const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tnmagcatofooeshzdhac.supabase.co';
const supabaseAnonKey = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g'; // Using the one from .env

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function patchInitialSL() {
    console.log('--- Database Patch: initial_stop_loss ---');

    // 1. Fetch records where initial_stop_loss is NULL
    const { data: records, error } = await supabase
        .from('trading_history')
        .select('id, stop_loss, status, symbol')
        .is('initial_stop_loss', null);

    if (error) {
        console.error('Error fetching records:', error);
        return;
    }

    if (!records || records.length === 0) {
        console.log('No records need patching.');
        return;
    }

    console.log(`Found ${records.length} records to patch.`);

    let patchedCount = 0;
    for (const record of records) {
        // For non-protected trades, or even protected ones as a baseline, 
        // we set initial_stop_loss = stop_loss if it's currently null.
        // For PROTECTED trades, the original SL is technically lost if not logged,
        // but setting it to the entry price (current stop_loss) at least avoids the null check failing.
        
        const { error: updateError } = await supabase
            .from('trading_history')
            .update({ initial_stop_loss: record.stop_loss })
            .eq('id', record.id);

        if (updateError) {
            console.error(`Failed to patch record ${record.id}:`, updateError.message);
        } else {
            patchedCount++;
        }
    }

    console.log(`Successfully patched ${patchedCount} records.`);
    console.log('Done.');
}

patchInitialSL();
