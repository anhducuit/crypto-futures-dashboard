
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/* --- CONSTANTS & CONFIG --- */
const SYMBOLS_TO_SCAN = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
// MODIFIED: Removed '1m', kept only high timeframes
const TF_CONFIG = [
    { interval: '15m', limit: 50 },
    { interval: '1h', limit: 50 },
    { interval: '4h', limit: 50 }
];

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* --- HELPER FUNCTIONS --- */

function calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    return data.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateRSI(closes: number[], period: number = 14): number {
    if (closes.length <= period) return 50;
    let gains = 0, losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
}

function calculateDynamicTPSL(
    entryPrice: number,
    signal: 'LONG' | 'SHORT',
    swingHigh: number,
    swingLow: number
) {
    const range = swingHigh - swingLow;
    if (range === 0 || range / entryPrice < 0.001) {
        return {
            target: signal === 'LONG' ? entryPrice * 1.005 : entryPrice * 0.995,
            stopLoss: signal === 'LONG' ? entryPrice * 0.997 : entryPrice * 1.003
        }
    }

    let target, stopLoss;

    // MODIFIED: Slightly tighter stops for 15m timeframe to reduce risk
    if (signal === 'LONG') {
        target = swingHigh + (range * 0.618);
        stopLoss = swingLow + (range * 0.236); // Below swing low

        if (target / entryPrice < 1.002) target = entryPrice * 1.005;
        if (stopLoss / entryPrice > 0.998) stopLoss = entryPrice * 0.997;
    } else {
        target = swingLow - (range * 0.618);
        stopLoss = swingHigh - (range * 0.236);

        if (target / entryPrice > 0.998) target = entryPrice * 0.995;
        if (stopLoss / entryPrice < 1.002) stopLoss = entryPrice * 1.003;
    }

    return { target, stopLoss };
}

async function sendTelegram(message: string) {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!token || !chatId) return;

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
    } catch (e) {
        console.error('Failed to send Telegram message:', e);
    }
}

/* --- MAIN LOGIC --- */

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        const logs: string[] = [];
        const updates: any[] = [];
        const newionSignals: any[] = [];

        /* =========================================
           PART 1: AUDIT EXISTING TRADES
           ========================================= */
        const { data: pendingTrades } = await supabase
            .from('trading_history')
            .select('*')
            .eq('status', 'PENDING');

        if (pendingTrades && pendingTrades.length > 0) {
            const grouped = pendingTrades.reduce((acc, t) => {
                acc[t.symbol] = acc[t.symbol] || [];
                acc[t.symbol].push(t);
                return acc;
            }, {});

            for (const sym of Object.keys(grouped)) {
                // Check last 2 hours (120 min) roughly
                const klineRes = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=1m&limit=120`);
                const klineData = await klineRes.json();
                if (!Array.isArray(klineData)) continue;

                const candles = klineData.map((c: any) => ({
                    h: parseFloat(c[2]), l: parseFloat(c[3]), t: c[6]
                }));

                const tickerRes = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${sym}`);
                const tickerData = await tickerRes.json();
                const currentPrice = parseFloat(tickerData.price);

                for (const trade of grouped[sym]) {
                    let newStatus = 'PENDING';

                    // SKIP NEUTRAL AUDIT if user doesn't want them (or clean them up silently)
                    if (trade.signal === 'NEUTRAL') {
                        // Silent cleanup
                        await supabase.from('trading_history').update({ status: 'JobDone' }).eq('id', trade.id);
                        continue;
                    }

                    // Check Wicks
                    const tradeTime = new Date(trade.created_at).getTime();
                    const relevant = candles.filter((c: any) => c.t >= tradeTime);
                    for (const c of relevant) {
                        if (trade.signal === 'LONG') {
                            if (c.h >= trade.target_price) newStatus = 'SUCCESS';
                            else if (c.l <= trade.stop_loss) newStatus = 'FAILED';
                        } else {
                            if (c.l <= trade.target_price) newStatus = 'SUCCESS';
                            else if (c.h >= trade.stop_loss) newStatus = 'FAILED';
                        }
                        if (newStatus !== 'PENDING') break;
                    }

                    if (newStatus === 'PENDING') {
                        if (trade.signal === 'LONG') {
                            if (currentPrice >= trade.target_price) newStatus = 'SUCCESS';
                            else if (currentPrice <= trade.stop_loss) newStatus = 'FAILED';
                        } else {
                            if (currentPrice <= trade.target_price) newStatus = 'SUCCESS';
                            else if (currentPrice >= trade.stop_loss) newStatus = 'FAILED';
                        }
                    }

                    if (newStatus !== 'PENDING') {
                        await supabase.from('trading_history').update({ status: newStatus }).eq('id', trade.id);
                        updates.push({ id: trade.id, status: newStatus });

                        // NOTIFY TELEGRAM: CLOSE
                        const icon = newStatus === 'SUCCESS' ? '✅' : '❌';
                        // Add Timeframe info
                        const tfEmoji = trade.timeframe === '15m' ? '⏱️15m' : trade.timeframe === '1h' ? '⏱️1H' : '⏱️';

                        const msg = `${icon} <b>TRADE CLOSED: ${trade.symbol}</b>\n` +
                            `Result: <b>${newStatus}</b>\n` +
                            `Timeframe: ${tfEmoji}\n` +
                            `Type: ${trade.signal}\n` +
                            `Entry: $${trade.price_at_signal}\n` +
                            `Close Price: $${currentPrice}`;
                        await sendTelegram(msg);
                    }
                }
            }
        }

        /* =========================================
           PART 2: GENERATE NEW SIGNALS (Auto-Trade)
           ========================================= */

        for (const symbol of SYMBOLS_TO_SCAN) {
            const analyses = {};
            let failed = false;

            for (const cfg of TF_CONFIG) {
                const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${cfg.interval}&limit=${cfg.limit}`);
                const data = await res.json();
                if (!Array.isArray(data)) { failed = true; break; }

                const closes = data.map((x: any) => parseFloat(x[4]));
                const highs = data.map((x: any) => parseFloat(x[2]));
                const lows = data.map((x: any) => parseFloat(x[3]));
                const volumes = data.map((x: any) => parseFloat(x[5]));

                analyses[cfg.interval] = {
                    close: closes[closes.length - 1],
                    sma20: calculateSMA(closes, 20),
                    rsi: calculateRSI(closes),
                    volRatio: (volumes[volumes.length - 1] / calculateSMA(volumes, 20)) || 1,
                    swingHigh: Math.max(...highs),
                    swingLow: Math.min(...lows)
                };
            }

            if (failed) {
                logs.push(`Failed to fetch data for ${symbol}`);
                continue;
            }

            // MODIFIED: Use 15m, 1h, 4h
            const tf15m = analyses['15m'];
            const tf1h = analyses['1h'];
            const tf4h = analyses['4h'];

            // Major Trend (1H & 4H)
            const trend1h = tf1h.close > tf1h.sma20 ? 1 : -1;
            const trend4h = tf4h.close > tf4h.sma20 ? 1 : -1;
            const majorTrend = (trend1h + trend4h) >= 1 ? 'LONG' : (trend1h + trend4h) <= -1 ? 'SHORT' : 'NEUTRAL';

            // Momentum (Trigger on 15m)
            const mom15m = tf15m.close > tf15m.sma20 ? 1 : -1;
            const momTrend = tf15m.close > tf1h.sma20 ? 1 : -1; // Price vs 1H SMA

            // Stronger Momentum Condition: 15m aligned with 1H
            const momentum = (mom15m + momTrend) >= 1 ? 'BULLISH' : (mom15m + momTrend) <= -1 ? 'BEARISH' : 'NEUTRAL';

            let signal = null;

            // Signal Logic (Only LONG/SHORT, No Neutral)
            if (majorTrend === 'LONG' && momentum === 'BULLISH') {
                if (tf15m.rsi < 70 && tf15m.volRatio > 0.6) signal = 'LONG';
            } else if (majorTrend === 'SHORT' && momentum === 'BEARISH') {
                if (tf15m.rsi > 30 && tf15m.volRatio > 0.6) signal = 'SHORT';
            }

            if (signal) {
                // MODIFIED: One-Position-Per-Symbol Logic
                // We only enter if we don't have an active position for this coin
                const { data: active } = await supabase
                    .from('trading_history')
                    .select('id')
                    .eq('symbol', symbol)
                    .eq('status', 'PENDING')
                    .limit(1);

                const isBusy = active && active.length > 0;

                if (!isBusy) {
                    // Use 15m Swing Points for Risk
                    const { target, stopLoss } = calculateDynamicTPSL(tf15m.close, signal, tf15m.swingHigh, tf15m.swingLow);

                    const { error: insertErr } = await supabase.from('trading_history').insert({
                        symbol: symbol,
                        timeframe: '15m', // Mark as 15m trade
                        signal: signal,
                        price_at_signal: tf15m.close,
                        target_price: target,
                        stop_loss: stopLoss,
                        status: 'PENDING',
                        rsi: tf15m.rsi,
                        volume_ratio: tf15m.volRatio,
                        price_gap: ((tf15m.close - tf15m.sma20) / tf15m.sma20) * 100
                    });

                    if (!insertErr) {
                        newionSignals.push({ symbol, signal, price: tf15m.close });
                        logs.push(`Opened ${signal} for ${symbol} at ${tf15m.close}`);

                        // NOTIFY TELEGRAM: OPEN
                        const icon = signal === 'LONG' ? '🟢' : '🔴';
                        const msg = `${icon} <b>NEW SIGNAL (15m): ${symbol}</b>\n` +
                            `Type: <b>${signal}</b>\n` +
                            `Entry: $${tf15m.close}\n` +
                            `Target: $${target.toFixed(2)}\n` +
                            `StopLoss: $${stopLoss.toFixed(2)}`;
                        await sendTelegram(msg);
                    }
                } else {
                    logs.push(`Signal found for ${symbol} but cooldown active`);
                }
            }
        }

        return new Response(JSON.stringify({
            success: true,
            updates,
            new_signals: newionSignals,
            logs
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
