
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://tnmagcatofooeshzdhac.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
    const { data: history } = await supabase
        .from('trading_history')
        .select('*')
        .gte('created_at', '2026-01-07T08:52:00Z')
        .order('created_at', { ascending: false });

    console.log('--- NEW SIGNALS SINCE 08:52 UTC ---');
    if (history && history.length > 0) {
        history.forEach(h => {
            console.log(`[${h.created_at}] ${h.symbol} ${h.timeframe} ${h.signal} - Tele: ${h.telegram_message_id} - RSI: ${h.rsi}`);
        });
    } else {
        console.log('No signals found since manual trigger.');
    }
}
debug();
