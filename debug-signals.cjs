
const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://tnmagcatofooeshzdhac.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function debug() {
    const { data: history } = await supabase
        .from('trading_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    console.log('--- LAST 50 SIGNALS ---');
    if (history && history.length > 0) {
        history.forEach(h => {
            console.log(`[${h.created_at}] ${h.symbol} ${h.timeframe} ${h.signal} - Status: ${h.status} - Tele: ${h.telegram_message_id} - RSI: ${h.rsi}`);
        });
    } else {
        console.log('No BTCUSDT signals found since 08:50 VN.');
    }
}
debug();
