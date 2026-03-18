import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase
        .from('trading_history')
        .select('symbol, timeframe, signal, price_at_signal, initial_stop_loss, stop_loss, strategy_name, created_at')
        .order('created_at', { ascending: false })
        .limit(30);

    if (error) {
        console.error(error);
        return;
    }

    console.log('--- SL DIAGNOSIS (Last 30) ---');
    data.forEach(t => {
        const sl = t.initial_stop_loss || t.stop_loss;
        const pct = (Math.abs(t.price_at_signal - sl) / t.price_at_signal) * 100;
        console.log(`${t.symbol} | TF: ${t.timeframe} | SL: ${pct.toFixed(2)}% | Entry: ${t.price_at_signal} | SL: ${sl} | Strategy: ${t.strategy_name}`);
    });
    process.exit(0);
}

run();
