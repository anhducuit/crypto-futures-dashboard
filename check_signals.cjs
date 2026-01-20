const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentSignals() {
    console.log('--- LATEST TRADING HISTORY SIGNALS ---');
    const { data, error } = await supabase
        .from('trading_history')
        .select('id, created_at, symbol, trade_id, signal')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error.message);
    } else {
        data.forEach(s => {
            console.log(`[${s.created_at}] ${s.symbol} ${s.signal}: ID=${s.trade_id || 'EMPTY'}`);
        });
    }
}

checkRecentSignals();
