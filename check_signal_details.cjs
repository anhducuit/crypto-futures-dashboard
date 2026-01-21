// Check detailed signal info and bot settings
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails() {
    console.log('=== DETAILED BOT CHECK ===\n');

    // 1. Check last 10 signals with full details
    console.log('📊 Last 10 signals (all statuses):');
    const { data: signals } = await supabase
        .from('trading_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (signals) {
        signals.forEach((s, i) => {
            const timeAgo = Math.round((Date.now() - new Date(s.created_at).getTime()) / (1000 * 60));
            console.log(`\n${i + 1}. ${s.symbol} ${s.timeframe} ${s.signal}`);
            console.log(`   Strategy: ${s.strategy_name}`);
            console.log(`   Status: ${s.status}`);
            console.log(`   Price: ${s.price_at_signal}`);
            console.log(`   RSI: ${s.rsi_at_signal}`);
            console.log(`   Volume Ratio: ${s.volume_ratio}`);
            console.log(`   Time: ${timeAgo} mins ago`);
        });
    }

    // 2. Check bot settings
    console.log('\n\n📋 Current Bot Settings:');
    const { data: settings } = await supabase
        .from('bot_settings')
        .select('*')
        .order('key');

    if (settings) {
        settings.forEach(s => {
            console.log(`  ${s.key.padEnd(30)} = ${s.value}`);
        });
    }

    // 3. Count signals by status
    console.log('\n\n📈 Signal Statistics:');
    const { data: stats } = await supabase
        .from('trading_history')
        .select('status')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (stats) {
        const statusCount = stats.reduce((acc, s) => {
            acc[s.status] = (acc[s.status] || 0) + 1;
            return acc;
        }, {});

        console.log('  Last 7 days:');
        Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`    ${status}: ${count}`);
        });
    }

    console.log('\n=== CHECK COMPLETE ===');
}

checkDetails().catch(console.error);
