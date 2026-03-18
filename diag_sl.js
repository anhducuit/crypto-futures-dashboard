import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase
        .from('trading_history')
        .select('*')
        .in('timeframe', ['1h', '4h'])
        .order('created_at', { ascending: false })
        .limit(30);

    if (error) {
        console.error(error);
        return;
    }

    console.log('--- SL DIAGNOSIS START ---');
    data.forEach(t => {
        const entry = t.price_at_signal;
        const sl = t.initial_stop_loss || t.stop_loss;
        const dist = Math.abs(entry - sl);
        const pct = (dist / entry) * 100;
        console.log(`${t.symbol} | TF: ${t.timeframe} | SL: ${pct.toFixed(2)}% | Entry: ${entry} | SL Price: ${sl}`);
    });
    console.log('--- SL DIAGNOSIS END ---');
    process.exit(0);
}

run();
