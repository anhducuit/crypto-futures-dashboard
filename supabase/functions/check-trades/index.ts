
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
    const range = (swingHigh && swingLow) ? (swingHigh - swingLow) : 0;
    if (range === 0 || isNaN(range) || range / entryPrice < 0.001) {
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

    if (!token || !chatId) return { ok: false, error: 'Missing tokens' };

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

        const result = await res.json();
        return result;
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

/* --- MAIN LOGIC --- */

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');

        if (action === 'test') {
            const results: any[] = [];
            for (const symbol of SYMBOLS_TO_SCAN) {
                const analyses: any = {};
                try {
                    for (const cfg of TF_CONFIG) {
                        const res = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${cfg.interval}&limit=${cfg.limit}`);
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            const closes = data.map((x: any) => parseFloat(x[4]));
                            const highs = data.map((x: any) => parseFloat(x[2]));
                            const lows = data.map((x: any) => parseFloat(x[3]));

                            if (cfg.interval === '1m') {
                                const ma7Array = calculateSMAArray(closes, 7);
                                const ma25Array = calculateSMAArray(closes, 25);
                                const ma7_curr = ma7Array[ma7Array.length - 1];
                                const ma25_curr = ma25Array[ma25Array.length - 1];
                                const ma7_prev = ma7Array[ma7Array.length - 2];
                                const ma25_prev = ma25Array[ma25Array.length - 2];

                                let cross = 'NONE';
                                if (ma7_prev <= ma25_prev && ma7_curr > ma25_curr) cross = 'BULLISH_CROSS';
                                if (ma7_prev >= ma25_prev && ma7_curr < ma25_curr) cross = 'BEARISH_CROSS';

                                analyses['1m'] = {
                                    close: closes[closes.length - 1],
                                    rsi: calculateRSI(closes),
                                    sma20: calculateSMA(closes, 20),
                                    swingHigh: Math.max(...highs),
                                    swingLow: Math.min(...lows),
                                    cross
                                };
                            } else if (cfg.interval === '1h') {
                                const ma20 = calculateSMA(closes, 20);
                                const ma50 = calculateSMA(closes, 50);
                                analyses['1h'] = {
                                    ma20, ma50,
                                    trend: ma20 > ma50 ? 'BULLISH' : 'BEARISH'
                                };
                            }
                        }
                    }

                    let signal = null;
                    let reason = "NO_SIGNAL";

                    if (analyses['1h'] && analyses['1m']) {
                        const h1 = analyses['1h'];
                        const m1 = analyses['1m'];

                        // Simulation of Strategy Logic (MA7/MA25 Cross)
                        if (h1.trend === 'BULLISH') {
                            if (m1.cross === 'BULLISH_CROSS') {
                                if (m1.rsi < 85) signal = 'LONG';
                                else reason = `RSI_TOO_HIGH (${m1.rsi.toFixed(1)})`;
                            } else reason = `NO_MA_CROSS (Last: ${m1.cross})`;
                        } else if (h1.trend === 'BEARISH') {
                            if (m1.cross === 'BEARISH_CROSS') {
                                if (m1.rsi > 15) signal = 'SHORT';
                                else reason = `RSI_TOO_LOW (${m1.rsi.toFixed(1)})`;
                            } else reason = `NO_MA_CROSS (Last: ${m1.cross})`;
                        }
                    }

                    results.push({ symbol, signal, reason, analyses });
                } catch (e) {
                    results.push({ symbol, error: e.message });
                }
            }

            return new Response(JSON.stringify({ success: true, results }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (action === 'simulate') {
            const icon = '🔴';
            const activeTf = '1m';
            const symbol = 'BTCUSDT';
            const strategyName = 'Scalp 1m';
            const signal = 'SHORT';
            const close = 92700.3;
            const target = 92650.00;
            const stopLoss = 92400.00;

            const msg = `${icon} <b>NEW SIGNAL (${activeTf}): ${symbol}</b>\n` +
                `Strategy: ${strategyName}\n` +
                `Type: <b>${signal}</b>\n` +
                `Entry: $${close}\n` +
                `Target: $${target.toFixed(2)}\n` +
                `StopLoss: $${stopLoss.toFixed(2)}`;

            const teleRes = await sendTelegram(msg);
            return new Response(JSON.stringify({ success: true, message: "Simulation executed", telegramResponse: teleRes }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // HEARTBEAT: Update last_scan_at to prove bot is active
        const { data: existingHeartbeat } = await supabase.from('bot_settings').select('id').eq('key', 'last_scan_at').single();
        if (existingHeartbeat) {
            await supabase.from('bot_settings').update({ value: new Date().toISOString() }).eq('id', existingHeartbeat.id);
        } else {
            await supabase.from('bot_settings').insert({ key: 'last_scan_at', value: new Date().toISOString() });
        }

        // Cleanup duplicates (just in case)
        await supabase.from('bot_settings').delete().eq('key', 'last_scan_at').neq('id', existingHeartbeat?.id || 0);

        const logs: string[] = [];
        const updates: any[] = [];
        const newionSignals: any[] = [];

        /* =========================================
           PART 0: FETCH BOT SETTINGS
           ========================================= */
        const { data: settingsData } = await supabase
            .from('bot_settings')
            .select('value')
            .eq('key', 'allowed_timeframes')
            .single();

        // Default allow all if not set
        const allowedTimeframes: string[] = settingsData?.value || ['1m', '15m', '1h', '4h'];

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

        const results = await Promise.allSettled(SYMBOLS_TO_SCAN.map(async (symbol) => {
            const analyses = {};
            let failed = false;

            // Fetch TFs in parallel for speed
            const fetches = TF_CONFIG.map(cfg =>
                fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${cfg.interval}&limit=${cfg.limit}`)
                    .then(r => r.json())
                    .then(data => ({ cfg, data }))
                    .catch(() => ({ cfg, data: null }))
            );

            const responses = await Promise.all(fetches);

            for (const { cfg, data } of responses) {
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

                // 1H Analysis
                if (cfg.interval === '1h') {
                    analyses['1h'] = {
                        trend: 'NEUTRAL',
                        ma20: calculateSMA(closes, 20),
                        ma50: calculateSMA(closes, 50),
                        close: closes[closes.length - 1]
                    }
                    if (analyses['1h'].ma20 > analyses['1h'].ma50) analyses['1h'].trend = 'BULLISH';
                    else if (analyses['1h'].ma20 < analyses['1h'].ma50) analyses['1h'].trend = 'BEARISH';
                }

                // 15M Analysis
                if (cfg.interval === '15m') {
                    const ma12Array = calculateSMAArray(closes, 12);
                    const ma26Array = calculateSMAArray(closes, 26);

                    const ma12_curr = ma12Array[ma12Array.length - 1];
                    const ma26_curr = ma26Array[ma26Array.length - 1];
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

                // 1m Scalp
                if (cfg.interval === '1m') {
                    const ma7Array = calculateSMAArray(closes, 7);
                    const ma25Array = calculateSMAArray(closes, 25);

                    const ma7_curr = ma7Array[ma7Array.length - 1];
                    const ma25_curr = ma25Array[ma25Array.length - 1];
                    const ma7_prev = ma7Array[ma7Array.length - 2];
                    const ma25_prev = ma25Array[ma25Array.length - 2];

                    let cross = 'NONE';
                    if (ma7_prev <= ma25_prev && ma7_curr > ma25_curr) cross = 'BULLISH_CROSS';
                    if (ma7_prev >= ma25_prev && ma7_curr < ma25_curr) cross = 'BEARISH_CROSS';

                    analyses['1m'] = {
                        cross: cross,
                        close: closes[closes.length - 1],
                        rsi: calculateRSI(closes),
                        sma20: calculateSMA(closes, 20),
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows),
                        len: closes.length
                    }
                }
            }

            if (failed || !analyses['1h'] || !analyses['15m']) {
                return; // Changed to return for map callback
            }

            const tf4h = analyses['4h'];
            const tf1h = analyses['1h'];
            const tf15m = analyses['15m'];
            const tf1m = analyses['1m'];

            let signal = null;
            let activeTf = null;

            /* --- STRATEGY LOGIC --- */

            // Strategy 1: 4H Major Trend (MA50/200 Cross)
            if (tf4h && tf4h.cross === 'GOLDEN_CROSS') {
                signal = 'LONG'; activeTf = '4h';
            } else if (tf4h && tf4h.cross === 'DEATH_CROSS') {
                signal = 'SHORT'; activeTf = '4h';
            }

            // Strategy 2: 1H Trend + 15M Cross (Day Trading)
            if (!signal) {
                if (tf1h.trend === 'BULLISH' && tf15m.cross === 'BULLISH_CROSS') {
                    signal = 'LONG'; activeTf = '15m'; // Or 1h, 15m trigger
                } else if (tf1h.trend === 'BEARISH' && tf15m.cross === 'BEARISH_CROSS') {
                    signal = 'SHORT'; activeTf = '15m';
                }
            }

            // Fallback: 1m Scalp (Strict Technical Analysis: MA7/MA25 Cross)
            if (!signal && tf1m) {
                // We scalp in direction of 1H Major Trend
                // Long: MA7 crosses above MA25 + Bullish 1H Trend
                if (tf1h.trend === 'BULLISH' && tf1m.cross === 'BULLISH_CROSS') {
                    if (tf1m.rsi < 85) { // Protect from extreme overbought
                        signal = 'LONG'; activeTf = '1m';
                    }
                }
                // Short: MA7 crosses below MA25 + Bearish 1H Trend
                else if (tf1h.trend === 'BEARISH' && tf1m.cross === 'BEARISH_CROSS') {
                    if (tf1m.rsi > 15) { // Protect from extreme oversold
                        signal = 'SHORT'; activeTf = '1m';
                    }
                }
            }

            // FILTER: Check if this timeframe is allowed by user settings manually
            if (activeTf && !allowedTimeframes.includes(activeTf)) {
                // If 1m and not allowed, ignore. If 15m and not allowed, ignore.
                // console.log(`Signal ${activeTf} ignored by settings.`);
                activeTf = null;
                signal = null;
            }

            if (signal && activeTf) {
                const { data: active } = await supabase
                    .from('trading_history')
                    .select('id')
                    .eq('symbol', symbol)
                    .eq('status', 'PENDING')
                    .eq('timeframe', activeTf) // SEPARATE POSITIONS BY TIMEFRAME
                    .limit(1);

                const isBusy = active && active.length > 0;

                if (!isBusy) {
                    let refTf;
                    let strategyName;

                    if (activeTf === '4h') {
                        refTf = tf4h;
                        strategyName = 'MA50/200 Cross';
                    } else if (activeTf === '1h') { // Just in case
                        refTf = tf1h;
                        strategyName = 'Trend Follow';
                    } else if (activeTf === '15m') {
                        refTf = tf15m;
                        strategyName = 'MA Cross 15m';
                    } else { // 1m
                        refTf = tf1m;
                        strategyName = 'Scalp 1m';
                    }

                    const { target, stopLoss } = calculateDynamicTPSL(refTf.close, signal as 'LONG' | 'SHORT', refTf.swingHigh, refTf.swingLow);

                    // NOTIFY ALL (Filtered by allowedTimeframes previously)
                    const icon = signal === 'LONG' ? '🟢' : '🔴';

                    // Vietnam Time (UTC+7)
                    const vnNow = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
                    const hours = vnNow.getUTCHours().toString().padStart(2, '0');
                    const minutes = vnNow.getUTCMinutes().toString().padStart(2, '0');
                    const day = vnNow.getUTCDate().toString().padStart(2, '0');
                    const month = (vnNow.getUTCMonth() + 1).toString().padStart(2, '0');
                    const year = vnNow.getUTCFullYear();
                    const timestampStr = `${hours}:${minutes} ${day}/${month}/${year}`;

                    const msg = `${icon} <b>NEW SIGNAL (${activeTf}): ${symbol}</b>\n` +
                        `Strategy: ${strategyName}\n` +
                        `Type: <b>${signal}</b>\n` +
                        `Entry: $${refTf.close}\n` +
                        `Target: $${target.toFixed(2)}\n` +
                        `StopLoss: $${stopLoss.toFixed(2)}\n` +
                        `Time: ${timestampStr}`;

                    let msgId = null;
                    // Send to Telegram
                    const teleRes = await sendTelegram(msg);
                    if (teleRes && teleRes.ok) {
                        msgId = teleRes.result.message_id;
                    }

                    // Insert into DB
                    await supabase.from('trading_history').insert({
                        symbol, timeframe: activeTf, signal,
                        price_at_signal: refTf.close,
                        target_price: target, stop_loss: stopLoss,
                        status: 'PENDING',
                        telegram_message_id: msgId,
                        rsi: refTf.rsi, volume_ratio: 1
                    });
                    newionSignals.push({ symbol, signal });
                }
            }
        }));

        return new Response(JSON.stringify({ success: true, new_signals: newionSignals }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
