
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkFailedTrades() {
    const { data, error } = await supabase
        .from('trading_history')
        .select('symbol, signal, timeframe, status, pnl_reason, created_at, strategy_name')
        .eq('status', 'FAILED')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('--- FAILED TRADES ANALYSIS ---');
        data.forEach((t, i) => {
            console.log(`${i+1}. [${t.symbol}] ${t.signal} ${t.timeframe} - ${t.created_at}`);
            console.log(`   Strategy: ${t.strategy_name}`);
            console.log(`   Reason: ${t.pnl_reason || 'N/A'}`);
            console.log('------------------------------');
        });
    }
}

checkFailedTrades();
