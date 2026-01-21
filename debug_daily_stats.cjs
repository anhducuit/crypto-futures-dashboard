const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tnmagcatofooeshzdhac.supabase.co';
const supabaseKey = 'sb_secret_AE9jk6pbcyFQRS-rSCFjzQ_DRJ5f4Xj';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBotActivity() {
    console.log('--- DETAILED DAILY ACTIVITY ---');

    async function getStatsForTable(table) {
        console.log(`\nTable: ${table}`);
        const days = 3;
        for (let i = 0; i < days; i++) {
            const start = new Date();
            start.setUTCHours(0, 0, 0, 0);
            start.setUTCDate(start.getUTCDate() - i);

            const end = new Date(start);
            end.setUTCDate(end.getUTCDate() + 1);

            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
                .gte('created_at', start.toISOString())
                .lt('created_at', end.toISOString());

            if (error) console.error(` - Error for ${start.toISOString().split('T')[0]}:`, error.message);
            else console.log(` - ${start.toISOString().split('T')[0]}: ${count} entries`);
        }
    }

    await getStatsForTable('trading_history');
    await getStatsForTable('market_anomalies');
    await getStatsForTable('price_action_signals');
}

checkBotActivity();
