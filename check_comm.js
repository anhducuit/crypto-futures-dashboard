import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkFinal() {
    console.log('Fetching XAU/XAG statuses...');
    const { data, error } = await supabase
        .from('trading_history')
        .select('symbol, status')
        .in('symbol', ['XAUUSDT', 'XAGUSDT']);

    if (error) {
        console.error('Supabase Error:', error);
        return;
    }

    const stats = {};
    data.forEach(t => {
        const key = `${t.symbol} ${t.status}`;
        stats[key] = (stats[key] || 0) + 1;
    });

    console.log('Statistics for Commodities:', JSON.stringify(stats, null, 2));
    process.exit(0);
}

checkFinal();
