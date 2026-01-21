const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tnmagcatofooeshzdhac.supabase.co';
const supabaseKey = 'sb_secret_AE9jk6pbcyFQRS-rSCFjzQ_DRJ5f4Xj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBotActivity() {
    console.log('--- CHECKING BOT ACTIVITY (Last 48 Hours) ---');
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();
    console.log(`Checking since: ${twoDaysAgo}\n`);

    // 1. Check trading_history (Bot #1 & #2)
    const { count: signalCount, error: signalError, data: signals } = await supabase
        .from('trading_history')
        .select('*', { count: 'exact' })
        .gte('created_at', twoDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5);

    if (signalError) console.error('Error fetching signals:', signalError);
    else {
        console.log(`[Bot 1&2] Signals in last 48h: ${signalCount}`);
        if (signals && signals.length > 0) {
            console.log('Recent signals:');
            signals.forEach(s => console.log(` - ${s.symbol} ${s.timeframe} ${s.signal} (${s.created_at})`));
        }
    }

    // 2. Check market_anomalies (Anomaly Bot)
    const { count: anomalyCount, error: anomalyError, data: anomalies } = await supabase
        .from('market_anomalies')
        .select('*', { count: 'exact' })
        .gte('created_at', twoDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5);

    if (anomalyError) console.error('Error fetching anomalies:', anomalyError);
    else {
        console.log(`\n[Anomaly Bot] Anomalies in last 48h: ${anomalyCount}`);
        if (anomalies && anomalies.length > 0) {
            console.log('Recent anomalies:');
            anomalies.forEach(a => console.log(` - ${a.symbol} ${a.timeframe} ${a.anomaly_type} (${a.created_at})`));
        }
    }

    // 3. Check price_action_signals (Bot #3)
    const { count: paCount, error: paError, data: paSignals } = await supabase
        .from('price_action_signals')
        .select('*', { count: 'exact' })
        .gte('created_at', twoDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5);

    if (paError) console.error('Error fetching PA signals:', paError);
    else {
        console.log(`\n[Price Action Bot] Signals in last 48h: ${paCount}`);
        if (paSignals && paSignals.length > 0) {
            console.log('Recent PA signals:');
            paSignals.forEach(s => console.log(` - ${s.symbol} ${s.timeframe} ${s.signal_type} ${s.pattern_type} (${s.created_at})`));
        }
    }

    // 4. Check if cron jobs are running (by checking when functions were last called if we have a table for that, 
    // or by looking at the timestamps of the MOST RECENT entries regardless of 48h)
    console.log('\n--- GLOBAL LATEST ACTIVITY ---');
    const tables = ['trading_history', 'market_anomalies', 'price_action_signals'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('created_at').order('created_at', { ascending: false }).limit(1);
        if (error) console.error(`Error checking ${table}:`, error);
        else console.log(`Last entry in ${table}: ${data[0]?.created_at || 'NEVER'}`);
    }
}

checkBotActivity();
