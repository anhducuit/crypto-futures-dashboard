
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/* --- CONSTANTS & CONFIG --- */
const SYMBOLS_TO_SCAN = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
const TF_CONFIG = [
    { interval: '1m', limit: 100 },
    { interval: '15m', limit: 100 },
    { interval: '1h', limit: 100 },
    { interval: '4h', limit: 300 } // Enough for SMA200
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

    // Default fallback if range is too small or invalid
    if (range === 0 || isNaN(range) || range / entryPrice < 0.001) {
        return {
            target: signal === 'LONG' ? entryPrice * 1.012 : entryPrice * 0.988, // 1.2% base
            stopLoss: signal === 'LONG' ? entryPrice * 0.994 : entryPrice * 1.006 // 0.6% risk
        }
    }

    let target, stopLoss;

    if (signal === 'LONG') {
        // Entry at current price, Target at Fib 0.618 of recent range above Entry
        // Stoploss at Fib 0.786 of the swing or 0.5% min
        target = entryPrice + (range * 0.618);
        stopLoss = entryPrice - (range * 0.382); // Stop at 38.2% retracement of range

        // Hard limits for safety and minimum R:R
        if (target / entryPrice < 1.005) target = entryPrice * 1.015;
        if (stopLoss / entryPrice > 0.995) stopLoss = entryPrice * 0.992;
    } else {
        target = entryPrice - (range * 0.618);
        stopLoss = entryPrice + (range * 0.382);

        if (target / entryPrice > 0.995) target = entryPrice * 0.985;
        if (stopLoss / entryPrice < 1.005) stopLoss = entryPrice * 1.008;
    }

    return { target, stopLoss };
}

async function sendTelegram(message: string, replyToId?: number, chatIds?: (string | number)[]) {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const ownerChatId = Deno.env.get('TELEGRAM_CHAT_ID');
    const targets = (chatIds && chatIds.length > 0) ? chatIds : (ownerChatId ? [ownerChatId] : []);
    if (targets.length === 0) return { ok: false, error: 'No recipients' };

    const promises = targets.map(async (chatId) => {
        try {
            const body: any = {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            };
            if (replyToId && String(chatId) === String(ownerChatId)) {
                body.reply_to_message_id = replyToId;
            }

            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            return await res.json();
        } catch (e) {
            console.error(`sendTelegram Error for ${chatId}:`, e.message);
            return { ok: false };
        }
    });

    const results = await Promise.all(promises);
    return results[0] || { ok: false };
}

/* --- MAIN LOGIC --- */

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');
        console.log(`[${new Date().toISOString()}] BOT SCAN START - Action: ${action || 'none'} - Method: ${req.method}`);

        if (action === 'reset') {
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            const supabase = createClient(supabaseUrl, supabaseKey)

            const { error } = await supabase.from('trading_history').delete().neq('id', 0); // Delete all
            if (error) {
                return new Response(JSON.stringify({ success: false, error: error.message }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 500
                });
            }

            return new Response(JSON.stringify({ success: true, message: "All trading history has been cleared." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

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

            // Test Telegram directly
            const token = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
            const chatId = Deno.env.get('TELEGRAM_CHAT_ID') || '';
            const tokenDebug = token ? `${token.slice(0, 5)}...${token.slice(-5)}` : 'MISSING';
            const chatDebug = chatId ? `${chatId.slice(0, 3)}...` : 'MISSING';

            const testTele = await sendTelegram(`🔔 <b>BOT TEST</b>\nTime: ${new Date().toISOString()}\nStatus: Online`);

            return new Response(JSON.stringify({
                success: true,
                env: { token: tokenDebug, chat: chatDebug },
                telegramTest: testTele,
                results
            }), {
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

        if (action === 'fix-cron') {
            const sql = `
                SELECT cron.unschedule('check-trades-every-minute');
                SELECT cron.schedule(
                'check-trades-every-minute',
                '* * * * *',
                $$
                SELECT
                    net.http_post(
                    url := 'https://tnmagcatofooeshzdhac.supabase.co/functions/v1/check-trades',
                    headers := '{"Content-Type": "application/json"}'::jsonb,
                    body := '{}'::jsonb
                    )
                $$
                );
            `;
            // Note: We can only run this if we have an RPC like 'execute_sql'. 
            // If not, we will just return a manual instruction for the user.
            return new Response(JSON.stringify({
                instruction: "Please run the following SQL in your Supabase SQL Editor to fix the bot automation:",
                sql: sql.trim()
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // HEARTBEAT: Update last_scan_at to prove bot is active
        const { data: existingHeartbeat, error: fetchError } = await supabase.from('bot_settings').select('id').eq('key', 'last_scan_at').single();
        if (fetchError) console.error('Heartbeat fetch error:', fetchError);

        if (existingHeartbeat) {
            console.log('Updating heartbeat ID:', existingHeartbeat.id);
            const { error: updateError } = await supabase.from('bot_settings').update({ value: new Date().toISOString() }).eq('id', existingHeartbeat.id);
            if (updateError) console.error('Heartbeat update error:', updateError);
        } else {
            console.log('Inserting new heartbeat');
            const { error: insertError } = await supabase.from('bot_settings').insert({ key: 'last_scan_at', value: new Date().toISOString() });
            if (insertError) console.error('Heartbeat insert error:', insertError);
        }

        // Cleanup duplicates (just in case)
        await supabase.from('bot_settings').delete().eq('key', 'last_scan_at').neq('id', existingHeartbeat?.id || 0);

        /* =========================================
           PART -1: RETENTION POLICY CLEANUP
           ========================================= */
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
        const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString();

        // 1m: Delete older than 1 day (Keep only non-PENDING)
        await supabase.from('trading_history').delete()
            .eq('timeframe', '1m')
            .lt('created_at', oneDayAgo)
            .neq('status', 'PENDING');

        // 15m, 1h: Delete older than 7 days
        await supabase.from('trading_history').delete()
            .in('timeframe', ['15m', '1h'])
            .lt('created_at', sevenDaysAgo)
            .neq('status', 'PENDING');

        // 4h: Delete older than 30 days
        await supabase.from('trading_history').delete()
            .eq('timeframe', '4h')
            .lt('created_at', thirtyDaysAgo)
            .neq('status', 'PENDING');

        const logs: string[] = [];
        const updates: any[] = [];
        const newSignals: any[] = [];

        /* =========================================
           PART 0: FETCH BOT SETTINGS
           ========================================= */
        const { data: settingsData } = await supabase
            .from('bot_settings')
            .select('key, value')
            .in('key', ['allowed_timeframes', 'subscriber_ids']);

        const settingsMap = Object.fromEntries(settingsData?.map(s => [s.key, s.value]) || []);

        // Default allow all if not set
        const allowedTimeframes: string[] = settingsMap['allowed_timeframes'] || ['1m', '15m', '1h', '4h'];
        const subscriberIds: (string | number)[] = settingsMap['subscriber_ids'] || [];

        /* =========================================
           PART 1: AUDIT EXISTING TRADES
           ========================================= */
        const { data: pendingTrades } = await supabase
            .from('trading_history')
            .select('*')
            .eq('status', 'PENDING')
            .order('created_at', { ascending: false })
            .limit(100); // LIMIT to avoid timeouts

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

                        await sendTelegram(msg, trade.telegram_message_id, subscriberIds);
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

                const currentClose = closes[closes.length - 1];
                const currentVol = volumes[volumes.length - 1];
                const avgVol20 = calculateSMA(volumes, 20);
                const volRatio = avgVol20 > 0 ? (currentVol / avgVol20) : 1;
                const rsi = calculateRSI(closes);

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
                            close: currentClose,
                            swingHigh: Math.max(...highs),
                            swingLow: Math.min(...lows),
                            rsi, volRatio,
                            ma50: ma50_curr,
                            ma200: ma200_curr
                        };
                    }
                }

                // 1H Analysis
                if (cfg.interval === '1h') {
                    const ma20 = calculateSMA(closes, 20);
                    const ma50 = calculateSMA(closes, 50);
                    analyses['1h'] = {
                        trend: ma20 > ma50 ? 'BULLISH' : 'BEARISH',
                        ma20, ma50,
                        close: currentClose,
                        rsi, volRatio
                    }
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
                        close: currentClose,
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows),
                        rsi, volRatio
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
                        close: currentClose,
                        rsi, volRatio,
                        sma20: calculateSMA(closes, 20),
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows)
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
            if (tf4h && tf4h.cross === 'GOLDEN_CROSS' && tf4h.volRatio > 1.2) {
                signal = 'LONG'; activeTf = '4h';
            } else if (tf4h && tf4h.cross === 'DEATH_CROSS' && tf4h.volRatio > 1.2) {
                signal = 'SHORT'; activeTf = '4h';
            }

            // Strategy 2: 1H Trend + 15M Cross (Day Trading)
            if (!signal && tf1h && tf15m) {
                const volConfirm = tf15m.volRatio > 1.2;
                if (tf1h.trend === 'BULLISH' && tf15m.cross === 'BULLISH_CROSS' && volConfirm) {
                    if (tf15m.rsi > 50) { signal = 'LONG'; activeTf = '15m'; }
                } else if (tf1h.trend === 'BEARISH' && tf15m.cross === 'BEARISH_CROSS' && volConfirm) {
                    if (tf15m.rsi < 50) { signal = 'SHORT'; activeTf = '15m'; }
                }
            }

            // Fallback: 1m Scalp (Strict Technical Analysis: Volume + RSI)
            if (!signal && tf1m && tf1h) {
                const volConfirm = tf1m.volRatio > 1.2;
                if (tf1h.trend === 'BULLISH' && tf1m.cross === 'BULLISH_CROSS' && volConfirm) {
                    if (tf1m.rsi > 50 && tf1m.rsi < 80) {
                        signal = 'LONG'; activeTf = '1m';
                    }
                }
                else if (tf1h.trend === 'BEARISH' && tf1m.cross === 'BEARISH_CROSS' && volConfirm) {
                    if (tf1m.rsi < 50 && tf1m.rsi > 20) {
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
                        `Volume: <b>${refTf.volRatio.toFixed(2)}x</b>\n` +
                        `RSI: ${refTf.rsi.toFixed(1)}\n` +
                        `Time: ${timestampStr}`;

                    let msgId = null;
                    console.log(`Payload: sending telegram for ${symbol}...`);
                    const teleRes = await sendTelegram(msg, undefined, subscriberIds);
                    if (teleRes && teleRes.ok) {
                        msgId = teleRes.result.message_id;
                        console.log(`Status: SUCCESS_TELEGRAM id=${msgId}`);
                    } else {
                        console.error(`Status: FAILED_TELEGRAM error=${JSON.stringify(teleRes)}`);
                    }

                    // Insert into DB
                    const { error: insertError } = await supabase.from('trading_history').insert({
                        symbol, timeframe: activeTf, signal,
                        price_at_signal: refTf.close,
                        target_price: target, stop_loss: stopLoss,
                        status: 'PENDING',
                        telegram_message_id: msgId,
                        rsi: refTf.rsi, volume_ratio: refTf.volRatio,
                        // Note: If you add a column 'reason' to DB later, use it here.
                        // For now we use the existing columns.
                    });

                    if (insertError) {
                        console.error(`Status: FAILED_TO_INSERT_DB symbol=${symbol}`, insertError);
                    }

                    newSignals.push({ symbol, signal });
                }
            }
        }));

        return new Response(JSON.stringify({
            success: true,
            server_time: new Date().toISOString(),
            new_signals: newSignals
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Main Handler Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
