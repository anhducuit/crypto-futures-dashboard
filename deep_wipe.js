
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function forceReset() {
    console.log('--- FORCING DEEP WIPE ---');

    // 1. Check current count
    const { count: before } = await supabase
        .from('trading_history')
        .select('*', { count: 'exact', head: true });
    console.log('Records in trading_history before:', before);

    // 2. Delete with multiple filters to ensure bypass
    const { error: err1 } = await supabase.from('trading_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: err2 } = await supabase.from('market_anomalies').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (err1) console.error('Error trading_history:', err1);
    if (err2) console.error('Error market_anomalies:', err2);

    // 3. Final count
    const { count: after } = await supabase
        .from('trading_history')
        .select('*', { count: 'exact', head: true });
    console.log('Records in trading_history after:', after);

    if (after > 0) {
        console.log('Some records remain. This might be due to RLS or immediate background generation.');
        const { data } = await supabase.from('trading_history').select('strategy_name, created_at').limit(5);
        console.log('Remaining record samples:', data);
    }
}

forceReset();
