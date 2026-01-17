const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const SUPABASE_URL = 'https://tnmagcatofooeshzdhac.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function analyze() {
    const { data: failed, error } = await supabase
        .from('trading_history')
        .select('*')
        .eq('status', 'FAILED')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        fs.writeFileSync('analysis_result.json', JSON.stringify({ error: error.message }));
        return;
    }

    const stats = failed.reduce((acc, t) => {
        const tf = t.timeframe || 'unknown';
        acc.tf[tf] = (acc.tf[tf] || 0) + 1;

        const strat = t.strategy_name || 'unknown';
        acc.strat[strat] = (acc.strat[strat] || 0) + 1;

        return acc;
    }, { tf: {}, strat: {} });

    fs.writeFileSync('analysis_result.json', JSON.stringify({
        stats,
        sample: failed.slice(0, 10).map(t => ({
            symbol: t.symbol,
            tf: t.timeframe,
            strat: t.strategy_name,
            rsi: t.rsi,
            entry: t.price_at_signal,
            target: t.target_price,
            sl: t.stop_loss,
            created: t.created_at
        }))
    }, null, 2));
}

analyze();
