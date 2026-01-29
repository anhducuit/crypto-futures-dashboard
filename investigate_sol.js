
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function investigate() {
    let log = '--- SOLUSDT INVESTIGATION ---\n';

    const { count: winCount } = await supabase
        .from('trading_history')
        .select('*', { count: 'exact', head: true })
        .eq('symbol', 'SOLUSDT')
        .eq('status', 'SUCCESS');

    const { count: lossCount } = await supabase
        .from('trading_history')
        .select('*', { count: 'exact', head: true })
        .eq('symbol', 'SOLUSDT')
        .eq('status', 'FAILED');

    const { data: latest } = await supabase
        .from('trading_history')
        .select('created_at, status')
        .eq('symbol', 'SOLUSDT')
        .order('created_at', { ascending: false })
        .limit(1);

    const { data: oldest } = await supabase
        .from('trading_history')
        .select('created_at, status')
        .eq('symbol', 'SOLUSDT')
        .order('created_at', { ascending: true })
        .limit(1);

    log += `SOL Wins: ${winCount}\n`;
    log += `SOL Losses: ${lossCount}\n`;
    log += `Latest SOL: ${latest[0]?.created_at}\n`;
    log += `Oldest SOL: ${oldest[0]?.created_at}\n`;

    const { count: totalRows } = await supabase
        .from('trading_history')
        .select('*', { count: 'exact', head: true });
    log += `Total rows in database: ${totalRows}\n`;

    fs.writeFileSync('investigate_results.txt', log);
    console.log('Results written to investigate_results.txt');
}

investigate();
