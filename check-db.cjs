
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tnmagcatofooeshzdhac.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g'; // Using Anon Key is enough for Select if RLS allows, otherwise might need Service Role but user only has Anon visible. 
// Wait, usually Anon key has RLS policies. The user inserts from Edge Function (Service Role). 
// Reading might be allowed public or auth. 
// Let's try. If it returns empty/error, we assumption is we can't see unless we have Service Role.
// But the UI shows history, so Anon Key SHOULD work for select.

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSymbols() {
    console.log('Checking database...');

    const { data, error } = await supabase
        .from('trading_history')
        .select('symbol, timeframe, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error:', error);
        return;
    }

    const counts = {};
    data.forEach(row => {
        counts[row.symbol] = (counts[row.symbol] || 0) + 1;
    });

    console.log('Recent records count (last 100):', counts);

    // Check specific symbols
    const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'];
    for (const sym of symbols) {
        const { count, error: countErr } = await supabase
            .from('trading_history')
            .select('*', { count: 'exact', head: true })
            .eq('symbol', sym);

        if (countErr) console.error(`Error counting ${sym}:`, countErr.message);
        else console.log(`Total ${sym} records: ${count}`);
    }
}

checkSymbols();
