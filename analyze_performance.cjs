const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function analyze() {
    console.log("Analyzing Bot 1 performance from 2026-01-21 18:00 VN to 2026-01-22 06:00 VN...");

    // UTC range: 21/01 11:00 to 21/01 23:00
    const start = '2026-01-21T11:00:00Z';
    const end = '2026-01-22T00:00:00Z';

    const { data, error } = await supabase
        .from('trading_history')
        .select('strategy_name, status, symbol, timeframe, price_at_signal, target_price, stop_loss')
        .gte('created_at', start)
        .lte('created_at', end);

    if (error) {
        console.error("Error fetching data:", error);
        return;
    }

    const stats = {};
    data.forEach(t => {
        const n = t.strategy_name || 'Other';
        if (!stats[n]) stats[n] = { win: 0, loss: 0, pending: 0, total: 0 };
        stats[n].total++;
        if (t.status === 'SUCCESS') stats[n].win++;
        else if (t.status === 'FAILED') stats[n].loss++;
        else stats[n].pending++;
    });

    console.log("\n--- STRATEGY PERFORMANCE SUMMARY ---");
    Object.keys(stats).sort((a, b) => stats[b].total - stats[a].total).forEach(k => {
        const s = stats[k];
        const wr = s.total > 0 ? (s.win / (s.win + s.loss) * 100).toFixed(1) : 0;
        console.log(`${k.padEnd(30)} | Total: ${s.total} | Win: ${s.win} | Loss: ${s.loss} | WR: ${wr}%`);
    });

    console.log("\n--- SAMPLE LOSSES (First 5) ---");
    data.filter(t => t.status === 'FAILED').slice(0, 5).forEach(t => {
        console.log(`${t.symbol} (${t.timeframe}) - ${t.strategy_name}: Entry: ${t.price_at_signal}, SL: ${t.stop_loss}, TP: ${t.target_price}`);
    });
}

analyze();
