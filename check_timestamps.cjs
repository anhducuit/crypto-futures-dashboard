const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tnmagcatofooeshzdhac.supabase.co';
const supabaseKey = 'sb_secret_AE9jk6pbcyFQRS-rSCFjzQ_DRJ5f4Xj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentSignals() {
    console.log('--- LATEST SIGNALS (Today) ---');

    for (const table of ['trading_history', 'market_anomalies', 'price_action_signals']) {
        console.log(`\nTable: ${table}`);
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) console.error(` - Error:`, error.message);
        else {
            data.forEach(d => {
                console.log(` - ${d.created_at} | ${d.symbol} | ${d.timeframe} | ${d.signal || d.anomaly_type || d.signal_type}`);
            });
        }
    }
}

checkRecentSignals();
