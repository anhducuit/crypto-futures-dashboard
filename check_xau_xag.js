import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkCommodities() {
    const { data: trades } = await supabase
        .from('trading_history')
        .select('*')
        .in('symbol', ['XAUUSDT', 'XAGUSDT']);

    console.log(`Checking ${trades.length} commodity trades...`);
    
    const results = [];
    for (const t of trades) {
        const startTime = new Date(t.created_at).getTime();
        const endTime = startTime + (72 * 60 * 60 * 1000);
        const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${t.symbol}&interval=5m&startTime=${startTime}&endTime=${endTime}&limit=1000`;
        
        try {
            const res = await fetch(url);
            const candles = await res.json();
            
            let hitTP = false;
            let hitSL = false;
            let firstHit = null;

            for (const c of candles) {
                const high = parseFloat(c[2]);
                const low = parseFloat(c[3]);
                const time = c[0];

                if (t.signal === 'LONG') {
                    if (high >= t.target_price) { hitTP = true; firstHit = 'TP'; break; }
                    if (low <= t.stop_loss) { hitSL = true; firstHit = 'SL'; break; }
                } else {
                    if (low <= t.target_price) { hitTP = true; firstHit = 'TP'; break; }
                    if (high >= t.stop_loss) { hitSL = true; firstHit = 'SL'; break; }
                }
            }
            results.push({ 
                trade_id: t.trade_id, 
                symbol: t.symbol, 
                firstHit, 
                tp: t.target_price, 
                sl: t.stop_loss, 
                entry: t.price_at_signal,
                status: t.status 
            });
        } catch (e) {
            results.push({ trade_id: t.trade_id, error: e.message });
        }
    }
    console.log(JSON.stringify(results, null, 2));
}

checkCommodities();
