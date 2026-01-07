
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/* --- CONSTANTS & CONFIG --- */
const SYMBOLS_TO_SCAN = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
const TF_CONFIG = [
    { interval: '1m', limit: 50 },
    { interval: '15m', limit: 50 },
    { interval: '1h', limit: 50 },
    { interval: '4h', limit: 200 }
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

function calculateSMAArray(data: number[], period: number): number[] {
    if (data.length < period) return [];
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
    }
    return result; // Aligned with end of data
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

    if (signal === 'LONG') {
        target = swingHigh + (range * 0.618);
        stopLoss = swingLow + (range * 0.236);

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

async function sendTelegram(message: string, replyToId?: number) {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!token || !chatId) return null;

    try {
        const url = `https://api.telegram.org/bot${token}/sendMessage`;
        const body: any = {
            chat_id: chatId,
            text: message,
            parse_mode: 'HTML'
        };

        if (replyToId) {
            body.reply_to_message_id = replyToId;
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        return await res.json();
    } catch (e) {
        console.error('Failed to send Telegram message:', e);
        return null;
    }
}

/* --- MAIN LOGIC --- */

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');

        if (action === 'test') {
            await sendTelegram("🤖 <b>SYSTEM CHECK</b>: New MA Strategy Deployed! Scanning...");
            return new Response(JSON.stringify({ success: true, message: "Test sent" }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

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
                const klineRes = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${sym}&interval=1m&limit=1000`);
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
                    if (trade.signal === 'NEUTRAL') {
                        await supabase.from('trading_history').update({ status: 'JobDone' }).eq('id', trade.id);
                        continue;
                    }

                    if (trade.signal === 'LONG') {
                        if (currentPrice >= trade.target_price) newStatus = 'SUCCESS';
                        else if (currentPrice <= trade.stop_loss) newStatus = 'FAILED';
                    } else {
                        if (currentPrice <= trade.target_price) newStatus = 'SUCCESS';
                        else if (currentPrice >= trade.stop_loss) newStatus = 'FAILED';
                    }

                    if (newStatus === 'PENDING') {
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
                    }

                    if (newStatus !== 'PENDING') {
                        await supabase.from('trading_history').update({ status: newStatus }).eq('id', trade.id);
                        updates.push({ id: trade.id, status: newStatus });

                        // REPLY TO OPEN MESSAGE IF EXISTS (Closed Trades)
                        // Reply even for 1m if message_id exists (meaning it was reported)
                        // If 1m was silent (id null), this won't reply, which is correct.
                        const icon = newStatus === 'SUCCESS' ? '✅' : '❌';
                        const msg = `${icon} <b>TRADE CLOSED: ${trade.symbol}</b>\n` +
                            `Result: <b>${newStatus}</b>\n` +
                            `Type: ${trade.signal}\n` +
                            `Entry: $${trade.price_at_signal}\n` +
                            `Close Price: $${currentPrice}`;

                        await sendTelegram(msg, trade.telegram_message_id);
                    }
                }
            }
        }

        /* =========================================
           PART 2: GENERATE NEW SIGNALS (MA CROSS)
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

                // 4H Analysis (MA50/MA200)
                if (cfg.interval === '4h') {
                    const ma50Arr = calculateSMAArray(closes, 50);
                    const ma200Arr = calculateSMAArray(closes, 200);

                    if (ma50Arr.length > 2 && ma200Arr.length > 2) {
                        const ma50_curr = ma50Arr[ma50Arr.length - 1];
                        const ma200_curr = ma200Arr[ma200Arr.length - 1];
                        const ma50_prev = ma50Arr[ma50Arr.length - 2];
                        const ma200_prev = ma200Arr[ma200Arr.length - 2];

                        let cross = 'NONE';
                        if (ma50_prev <= ma200_prev && ma50_curr > ma200_curr) cross = 'GOLDEN_CROSS';
                        if (ma50_prev >= ma200_prev && ma50_curr < ma200_curr) cross = 'DEATH_CROSS';

                        analyses['4h'] = {
                            cross,
                            close: closes[closes.length - 1],
                            swingHigh: Math.max(...highs),
                            swingLow: Math.min(...lows),
                            rsi: calculateRSI(closes),
                            ma50: ma50_curr,
                            ma200: ma200_curr
                        };
                    }
                }

                // Store raw data needed for specific TFs
                if (cfg.interval === '1h') {
                    analyses['1h'] = {
                        trend: 'NEUTRAL',
                        ma20: calculateSMA(closes, 20),
                        ma50: calculateSMA(closes, 50),
                        close: closes[closes.length - 1]
                    }
                    // Determine 1H Trend
                    if (analyses['1h'].ma20 > analyses['1h'].ma50) analyses['1h'].trend = 'BULLISH';
                    else if (analyses['1h'].ma20 < analyses['1h'].ma50) analyses['1h'].trend = 'BEARISH';
                }

                if (cfg.interval === '15m') {
                    // Need historical MA values to detect cross
                    const ma12Array = calculateSMAArray(closes, 12);
                    const ma26Array = calculateSMAArray(closes, 26);

                    // Current (Latest)
                    const ma12_curr = ma12Array[ma12Array.length - 1];
                    const ma26_curr = ma26Array[ma26Array.length - 1];

                    // Previous
                    const ma12_prev = ma12Array[ma12Array.length - 2];
                    const ma26_prev = ma26Array[ma26Array.length - 2];

                    let cross = 'NONE';
                    if (ma12_prev <= ma26_prev && ma12_curr > ma26_curr) cross = 'BULLISH_CROSS';
                    if (ma12_prev >= ma26_prev && ma12_curr < ma26_curr) cross = 'BEARISH_CROSS';

                    analyses['15m'] = {
                        cross: cross,
                        close: closes[closes.length - 1],
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows),
                        rsi: calculateRSI(closes),
                        volRatio: (volumes[volumes.length - 1] / calculateSMA(volumes, 20)) || 1
                    }
                }

                // Keep 1m data for fallback scalping
                if (cfg.interval === '1m') {
                    analyses['1m'] = {
                        close: closes[closes.length - 1],
                        rsi: calculateRSI(closes),
                        sma20: calculateSMA(closes, 20),
                        len: closes.length
                    }
                }
            }

            if (failed || !analyses['1h'] || !analyses['15m']) {
                logs.push(`Insufficient data for ${symbol}`);
                continue;
            }

            const tf4h = analyses['4h'];
            const tf1h = analyses['1h'];
            const tf15m = analyses['15m'];
            const tf1m = analyses['1m'];

            let signal = null;
            let activeTf = null;

            /* --- STRATEGY LOGIC --- */

            // Strategy 1: 4H Major Trend (MA50/MA200 Cross)
            if (tf4h && tf4h.cross === 'GOLDEN_CROSS') {
                signal = 'LONG'; activeTf = '4h';
            } else if (tf4h && tf4h.cross === 'DEATH_CROSS') {
                signal = 'SHORT'; activeTf = '4h';
            }

            // Case 1: High Confidence BUY
            if (tf1h.trend === 'BULLISH' && tf15m.cross === 'BULLISH_CROSS') {
                signal = 'LONG';
                activeTf = '15m'; // Or 1h, but 15m is the trigger
            }
            // Case 2: High Confidence SELL
            else if (tf1h.trend === 'BEARISH' && tf15m.cross === 'BEARISH_CROSS') {
                signal = 'SHORT';
                activeTf = '15m';
            }

            // Case 3 (Low Conf) -> Skipped for now, or we can use it for 1m context

            // Fallback: 1m Scalp (Silent) - IF NO MAIN SIGNAL
            // We align 1m scalp with 1H Trend for safety
            if (!signal && tf1m) {
                if (tf1h.trend === 'BULLISH' && tf1m.close > tf1m.sma20 && tf1m.rsi < 70) {
                    // signal = 'LONG'; activeTf = '1m'; 
                    // Commented out to strictly follow user's new strategy request? 
                    // User asked to "update MA", didn't say Stop 1m. 
                    // I will keep it but make sure it respects the new 1H MA Trend.
                    signal = 'LONG'; activeTf = '1m';
                } else if (tf1h.trend === 'BEARISH' && tf1m.close < tf1m.sma20 && tf1m.rsi > 30) {
                    signal = 'SHORT'; activeTf = '1m';
                }
            }

            if (signal && activeTf) {
                const { data: active } = await supabase
                    .from('trading_history')
                    .select('id')
                    .eq('symbol', symbol)
                    .eq('status', 'PENDING')
                    .limit(1);

                const isBusy = active && active.length > 0;

                if (!isBusy) {
                    const refTf = activeTf === '4h' ? tf4h : tf15m;
                    const { target, stopLoss } = calculateDynamicTPSL(refTf.close, signal as 'LONG' | 'SHORT', refTf.swingHigh, refTf.swingLow);

                    // NOTIFY (If not 1m)
                    if (activeTf !== '1m') {
                        const icon = signal === 'LONG' ? '🟢' : '🔴';
                        const strategyName = activeTf === '4h' ? 'MA50/200 Cross' : 'MA Cross 15m';

                        const msg = `${icon} <b>NEW SIGNAL (${activeTf}): ${symbol}</b>\n` +
                            `Strategy: ${strategyName}\n` +
                            `Type: <b>${signal}</b>\n` +
                            `Entry: $${refTf.close}\n` +
                            `Target: $${target.toFixed(2)}\n` +
                            `StopLoss: $${stopLoss.toFixed(2)}`;

                        const teleRes = await sendTelegram(msg);
                        const msgId = teleRes && teleRes.ok ? teleRes.result.message_id : null;

                        await supabase.from('trading_history').insert({
                            symbol, timeframe: activeTf, signal,
                            price_at_signal: refTf.close,
                            target_price: target, stop_loss: stopLoss,
                            status: 'PENDING',
                            telegram_message_id: msgId,
                            rsi: refTf.rsi, volume_ratio: 1
                        });
                        newionSignals.push({ symbol, signal });
                    } else {
                        // 1m Silent
                        await supabase.from('trading_history').insert({
                            symbol, timeframe: activeTf, signal,
                            price_at_signal: tf1m.close, // Use 1m close price
                            target_price: target, stop_loss: stopLoss,
                            status: 'PENDING',
                            telegram_message_id: null,
                            rsi: tf1m.rsi, volume_ratio: 1
                        });
                    }
                }
            }
        }

        return new Response(JSON.stringify({ success: true, new_signals: newionSignals }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
