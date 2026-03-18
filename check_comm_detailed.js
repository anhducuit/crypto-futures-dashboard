import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDetailed() {
    const { data, error } = await supabase
        .from('trading_history')
        .select('id, trade_id, symbol, status, pnl_reason')
        .eq('symbol', 'XAUUSDT');

    if (error) {
        console.error(error);
        return;
    }

    console.log('--- XAU DETAILED LIST ---');
    data.forEach(t => {
        console.log(`${t.trade_id || t.id}: ${t.status} | Reason: ${t.pnl_reason?.substring(0, 50)}...`);
    });
    
    const stats = data.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
    }, {});
    console.log('Summary:', stats);
    process.exit(0);
}

checkDetailed();
