
const { createClient } = require('@supabase/supabase-js');

// Use Service Role Key to bypass RLS
const SUPABASE_URL = 'https://tnmagcatofooeshzdhac.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is missing from environment');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function auditAnomalies() {
    console.log('--- AUDITING ANOMALIES (SERVICE ROLE) ---');

    // Check total count
    const { count, error: cErr } = await supabase.from('market_anomalies').select('*', { count: 'exact', head: true });
    console.log(`Total anomalies in table: ${count}`);

    // Check specific window: Jan 19 6AM-7AM VN = Jan 18 23:00-00:00 UTC
    const start = '2026-01-18T23:00:00Z';
    const end = '2026-01-19T00:00:00Z';

    const { data: anomalies, error: aErr } = await supabase
        .from('market_anomalies')
        .select('*')
        .gte('created_at', start)
        .lte('created_at', end);

    if (aErr) {
        console.error('Error:', aErr.message);
    } else {
        console.log(`Anomalies in VN 6AM-7AM window: ${anomalies.length}`);
        anomalies.forEach(a => {
            console.log(`- ${a.symbol} ${a.timeframe} ${a.anomaly_type} (${a.change_percent.toFixed(2)}%) @ ${a.created_at}`);
        });
    }

    // Check last 10 anomalies globally
    const { data: last10 } = await supabase.from('market_anomalies').select('*').order('created_at', { ascending: false }).limit(10);
    console.log('\nLast 10 Anomalies:');
    last10.forEach(a => {
        console.log(`- ${a.symbol} ${a.timeframe} ${a.anomaly_type} @ ${a.created_at}`);
    });
}

auditAnomalies();
