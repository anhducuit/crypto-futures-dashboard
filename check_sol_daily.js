
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSOL() {
    console.log('Fetching all SOLUSDT wins...');
    const { data, error } = await supabase
        .from('trading_history')
        .select('created_at, status')
        .eq('symbol', 'SOLUSDT')
        .eq('status', 'SUCCESS')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    const dailyGroups = {};
    data.forEach(t => {
        const day = t.created_at.split('T')[0];
        dailyGroups[day] = (dailyGroups[day] || 0) + 1;
    });

    console.log('SOL Wins by day:', dailyGroups);
    console.log('Total SOL Wins:', data.length);
}

checkSOL();
