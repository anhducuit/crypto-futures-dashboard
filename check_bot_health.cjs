
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tnmagcatofooeshzdhac.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkBotHealth() {
    console.log('--- BOT HEALTH CHECK ---');

    // Check Heartbeat
    const { data: heartbeat, error: hError } = await supabase.from('bot_settings').select('*').eq('key', 'last_scan_at').single();
    if (hError) console.error('Heartbeat Error:', hError.message);
    else console.log('Last Scan At (UTC):', heartbeat.value);

    // Check Recent Signals
    const { data: signals, error: sError } = await supabase.from('trading_history').select('symbol, timeframe, signal, created_at').order('created_at', { ascending: false }).limit(5);
    if (sError) console.error('Signals Error:', sError.message);
    else {
        console.log('Recent Signals:');
        signals.forEach(s => console.log(`- ${s.symbol} ${s.timeframe} ${s.signal} @ ${s.created_at}`));
    }

    // Check Recent Anomalies
    const { data: anomalies, error: aError } = await supabase.from('market_anomalies').select('symbol, timeframe, anomaly_type, change_percent, created_at').order('created_at', { ascending: false }).limit(5);
    if (aError) console.error('Anomalies Error:', aError.message);
    else {
        console.log('Recent Anomalies:');
        anomalies.forEach(a => console.log(`- ${a.symbol} ${a.timeframe} ${a.anomaly_type} (${a.change_percent}%) @ ${a.created_at}`));
    }
}

checkBotHealth();
