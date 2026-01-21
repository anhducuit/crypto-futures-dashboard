// Script to check recent bot signals and activity
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);


async function checkBotStatus() {
    console.log('=== CHECKING BOT SERVER STATUS ===\n');

    // 1. Check recent signals (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentSignals, error: signalsError } = await supabase
        .from('trading_history')
        .select('*')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(10);

    if (signalsError) {
        console.error('Error fetching signals:', signalsError);
    } else {
        console.log(`📊 Signals in last 24h: ${recentSignals?.length || 0}`);
        if (recentSignals && recentSignals.length > 0) {
            console.log('\nRecent signals:');
            recentSignals.forEach(s => {
                console.log(`  - ${s.symbol} ${s.timeframe} ${s.signal} @ ${s.price_at_signal} (${s.strategy_name}) - ${s.created_at}`);
            });
        } else {
            console.log('  ⚠️  NO SIGNALS in last 24 hours!');
        }
    }

    // 2. Check bot settings
    console.log('\n📋 Bot Settings:');
    const { data: settings } = await supabase
        .from('bot_settings')
        .select('*');

    if (settings) {
        settings.forEach(s => {
            console.log(`  ${s.key}: ${s.value}`);
        });
    }

    // 3. Check cron job status (pg_cron)
    console.log('\n⏰ Checking Cron Jobs:');
    const { data: cronJobs, error: cronError } = await supabase.rpc('get_cron_jobs');

    if (cronError) {
        console.log('  ⚠️  Cannot check cron jobs (may need custom function)');
    } else if (cronJobs) {
        console.log(cronJobs);
    }

    // 4. Check last 5 signals regardless of time
    console.log('\n📈 Last 5 signals (any time):');
    const { data: lastSignals } = await supabase
        .from('trading_history')
        .select('created_at, symbol, timeframe, signal, strategy_name, status')
        .order('created_at', { ascending: false })
        .limit(5);

    if (lastSignals && lastSignals.length > 0) {
        lastSignals.forEach(s => {
            const timeAgo = Math.round((Date.now() - new Date(s.created_at).getTime()) / (1000 * 60));
            console.log(`  - ${s.symbol} ${s.timeframe} ${s.signal} (${s.strategy_name}) - ${timeAgo} mins ago - Status: ${s.status}`);
        });
    }

    console.log('\n=== CHECK COMPLETE ===');
}

checkBotStatus().catch(console.error);
