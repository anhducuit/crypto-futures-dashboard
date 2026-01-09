const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://tnmagcatofooeshzdhac.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function dump() {
    const { data, error } = await supabase
        .from('trading_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching history:', error);
        return;
    }

    console.log('--- RAW DUMP OF LAST 20 SIGNALS ---');
    data.forEach(h => {
        console.log(`ID: ${h.id.substring(0, 8)} | ${h.created_at} | ${h.symbol} | ${h.timeframe} | ${h.signal} | Tele: ${h.telegram_message_id} | Status: ${h.status}`);
    });

    const { data: settings } = await supabase.from('bot_settings').select('*');
    console.log('\n--- BOT SETTINGS ---');
    console.log(JSON.stringify(settings, null, 2));
}

dump();
