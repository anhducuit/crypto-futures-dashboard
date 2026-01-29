
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkTrade() {
    const { data, error } = await supabase
        .from('trading_history')
        .select('*')
        .eq('trade_id', 'BTC-KTQX')
        .order('created_at', { ascending: false });

    if (error) {
        fs.writeFileSync('trade_error.txt', error.message);
        return;
    }

    fs.writeFileSync('trade_data.json', JSON.stringify(data, null, 2));
}

checkTrade();
