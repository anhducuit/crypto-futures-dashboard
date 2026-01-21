// Quick check: Query database for signals
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tnmagcatofooeshzdhac.supabase.co';
const supabaseKey = 'sb_secret_AE9jk6pbcyFQRS-rSCFjzQ_DRJ5f4Xj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSignals() {
    const { data, error } = await supabase
        .from('price_action_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\n📊 Total signals found: ${data.length}\n`);

    if (data.length === 0) {
        console.log('❌ No signals yet. Reasons:');
        console.log('   1. Market might be sideways (no clear trends)');
        console.log('   2. Detection parameters might be too strict');
        console.log('   3. Bot needs more time to scan');
        console.log('\n💡 Solution: Wait for cron job to run (every 5 min) or adjust parameters');
    } else {
        data.forEach((signal, i) => {
            console.log(`${i + 1}. ${signal.symbol} ${signal.timeframe} ${signal.signal_type}`);
            console.log(`   Pattern: ${signal.pattern_type}`);
            console.log(`   Confluence: ${signal.confluence_score}%`);
            console.log(`   Created: ${new Date(signal.created_at).toLocaleString()}`);
            console.log('');
        });
    }
}

checkSignals();
