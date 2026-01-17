
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/* --- CONSTANTS & CONFIG --- */
const DEFAULT_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
const TF_CONFIG = [
    { interval: '1m', limit: 300 },
    { interval: '15m', limit: 100 },
    { interval: '1h', limit: 100 },
    { interval: '4h', limit: 300 }
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

function calculateEMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
    }
    return ema;
}

function calculateEMAArray(data: number[], period: number): number[] {
    if (data.length < period) return [];
    const k = 2 / (period + 1);
    const result = [data[0]];
    for (let i = 1; i < data.length; i++) {
        result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
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

function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
    if (closes.length <= period) return 0;
    const trs = [];
    for (let i = 1; i < closes.length; i++) {
        const tr = Math.max(
            highs[i] - lows[i],
            Math.abs(highs[i] - closes[i - 1]),
            Math.abs(lows[i] - closes[i - 1])
        );
        trs.push(tr);
    }
    return trs.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function calculateDynamicTPSL(
    entryPrice: number,
    signal: 'LONG' | 'SHORT',
    swingHigh: number,
    swingLow: number,
    atr: number = 0,
    timeframe: string = '15m'
) {
    const range = (swingHigh && swingLow) ? (swingHigh - swingLow) : 0;

    // Default fallback if range is too small or invalid
    if (range === 0 || isNaN(range) || range / entryPrice < 0.001) {
        const baseRisk = timeframe === '1m' ? 0.008 : 0.006; // 0.8% for 1m, 0.6% others
        const baseReward = baseRisk * 1.5;
        return {
            target: signal === 'LONG' ? entryPrice * (1 + baseReward) : entryPrice * (1 - baseReward),
            stopLoss: signal === 'LONG' ? entryPrice * (1 - baseRisk) : entryPrice * (1 + baseRisk)
        }
    }

    let target, stopLoss;
    // ATR Multiplier optimized by Timeframe
    const atrMultiplier = timeframe === '4h' ? 4.0 : (timeframe === '1h' ? 3.5 : 3.0);
    const volatilityBuffer = atr > 0 ? (atr * atrMultiplier) : (range * 0.5);

    if (signal === 'LONG') {
        // Target at Fib 0.618 of range or entry + buffer
        target = entryPrice + Math.max(range * 0.618, volatilityBuffer * 1.5);
        // Stoploss at entry - buffer (ATR based or 38.2% Fib)
        stopLoss = entryPrice - volatilityBuffer;

        // Hard limits for safety and minimum R:R
        const minRR = 1.3; // Increased from 1.2 for better quality
        const maxSL = 0.035; // Max 3.5%
        const minSL = timeframe === '4h' ? 0.02 : (timeframe === '1h' ? 0.015 : (timeframe === '15m' ? 0.012 : 0.01));

        const currentSLPercent = Math.abs(entryPrice - stopLoss) / entryPrice;
        if (currentSLPercent < minSL) stopLoss = entryPrice * (1 - minSL);
        if (currentSLPercent > maxSL) stopLoss = entryPrice * (1 - maxSL);

        const currentTPPercent = Math.abs(target - entryPrice) / entryPrice;
        const requiredTP = (Math.abs(entryPrice - stopLoss) / entryPrice) * minRR;
        if (currentTPPercent < requiredTP) target = entryPrice * (1 + requiredTP);
    } else {
        target = entryPrice - Math.max(range * 0.618, volatilityBuffer * 1.5);
        stopLoss = entryPrice + volatilityBuffer;

        const minRR = 1.3;
        const maxSL = 0.035;
        const minSL = timeframe === '4h' ? 0.02 : (timeframe === '1h' ? 0.015 : (timeframe === '15m' ? 0.012 : 0.01));

        const currentSLPercent = Math.abs(stopLoss - entryPrice) / entryPrice;
        if (currentSLPercent < minSL) stopLoss = entryPrice * (1 + minSL);
        if (currentSLPercent > maxSL) stopLoss = entryPrice * (1 + maxSL);

        const currentTPPercent = Math.abs(entryPrice - target) / entryPrice;
        const requiredTP = (Math.abs(stopLoss - entryPrice) / entryPrice) * minRR;
        if (currentTPPercent < requiredTP) target = entryPrice * (1 - requiredTP);
    }

    // ROUNDING FIX for floating point errors
    return {
        target: Math.round(target * 100) / 100,
        stopLoss: Math.round(stopLoss * 100) / 100
    };
}

async function sendTelegram(message: string, replyToId?: number, chatIds?: (string | number)[]) {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const ownerChatId = Deno.env.get('TELEGRAM_CHAT_ID');

    // Ensure we have a valid list of targets
    let targets = (chatIds && chatIds.length > 0) ? [...chatIds] : (ownerChatId ? [ownerChatId] : []);
    // Remove duplicates and ensure strings
    targets = Array.from(new Set(targets.map(id => String(id))));

    if (targets.length === 0) return { ok: false, error: 'No recipients' };

    const results = await Promise.all(targets.map(async (chatId) => {
        try {
            const body: any = {
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            };

            // Only apply reply_to_message_id for the ownerChatId 
            // because we only store ONE message_id in DB (the owner's)
            if (replyToId && String(chatId) === String(ownerChatId)) {
                body.reply_to_message_id = replyToId;
            }

            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();

            // FAIL-SAFE: If reply fails (usually "message not found"), retry as a new message
            if (!data.ok && data.description?.includes('message to be replied not found')) {
                console.warn(`Reply failed for ${chatId}, retrying without reply_to_message_id`);
                delete body.reply_to_message_id;
                const retryRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                return await retryRes.json();
            }

            return data;
        } catch (e) {
            console.error(`sendTelegram Error for ${chatId}:`, e.message);
            return { ok: false };
        }
    }));

    // Prioritize returning the owner's result so we save the correct message_id for future replies
    const ownerIndex = targets.findIndex(id => String(id) === String(ownerChatId));
    if (ownerIndex !== -1 && results[ownerIndex]?.ok) {
        return results[ownerIndex];
    }

    return results[0] || { ok: false };
}

/* --- MAIN LOGIC --- */

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const url = new URL(req.url);
        const action = url.searchParams.get('action');
        const now = new Date();
        console.log(`[${now.toISOString()}] BOT SCAN START - Action: ${action || 'none'} - Method: ${req.method}`);

        if (action === 'get-calendar') {
            try {
                const res = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json');
                const data = await res.json();
                return new Response(JSON.stringify(data), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ error: 'Failed to fetch calendar' }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

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
            const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            const supabase = createClient(supabaseUrl, supabaseKey)

            const { data: settings } = await supabase.from('bot_settings').select('value').eq('key', 'target_symbols').single();
            const SYMBOLS_TO_SCAN = settings?.value || DEFAULT_SYMBOLS;

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
                                const ema20 = calculateEMA(closes, 20);
                                const ema50 = calculateEMA(closes, 50);
                                analyses['1h'] = {
                                    ema20, ema50,
                                    trend: ema20 > ema50 ? 'BULLISH' : 'BEARISH'
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
           PART -1: GLOBAL RETENTION POLICY (90 DAYS)
           ========================================= */
        const nowMs = now.getTime();
        const ninetyDaysAgo = new Date(nowMs - (90 * 24 * 60 * 60 * 1000)).toISOString();

        // Keep all trades (except PENDING) for 90 days for balanced analytics
        await supabase.from('trading_history').delete()
            .lt('created_at', ninetyDaysAgo)
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
            .in('key', ['allowed_timeframes', 'subscriber_ids', 'target_symbols']);

        const settingsMap = Object.fromEntries(settingsData?.map(s => [s.key, s.value]) || []);

        const SYMBOLS_TO_SCAN: string[] = settingsMap['target_symbols'] || DEFAULT_SYMBOLS;

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
                        // Generate dynamic reason
                        let autoReason = '';
                        if (newStatus === 'SUCCESS') {
                            autoReason = `✅ Thắng lệnh do: ${trade.strategy_name}. RSI: ${trade.rsi?.toFixed(1) || 'N/A'}, Vol: ${trade.volume_ratio?.toFixed(2) || 'N/A'}x. Thị trường thuận xu hướng.`;
                        } else {
                            autoReason = `❌ Thua lệnh: Giá đi ngược dự đoán (Stoploss). RSI vào lệnh: ${trade.rsi?.toFixed(1) || 'N/A'}, Vol: ${trade.volume_ratio?.toFixed(2) || 'N/A'}x. Thị trường đảo chiều mạnh.`;
                        }

                        const updateData: any = { status: newStatus, pnl_reason: autoReason };
                        const { error: upErr } = await supabase.from('trading_history').update(updateData).eq('id', trade.id);

                        // Fallback if pnl_reason column still not added by user
                        if (upErr && upErr.message.includes('column') && upErr.message.includes('not exist')) {
                            await supabase.from('trading_history').update({ status: newStatus }).eq('id', trade.id);
                        }

                        updates.push({ id: trade.id, status: newStatus });

                        // REPLY TO OPEN MESSAGE IF EXISTS (Closed Trades)
                        const icon = newStatus === 'SUCCESS' ? '✅' : '❌';
                        const msg = `${icon} <b>TRADE CLOSED: ${trade.symbol}</b>\n` +
                            `Result: <b>${newStatus}</b>\n` +
                            `Type: ${trade.signal}\n` +
                            `Entry: $${trade.price_at_signal}\n` +
                            `Close Price: $${currentPrice}\n` +
                            `Lý do Robot: <i>${autoReason}</i>`;

                        await sendTelegram(msg, trade.telegram_message_id, subscriberIds);
                    }
                }
            }
        }

        /* =========================================
           PART 2: GENERATE NEW SIGNALS (MA CROSS)
           ========================================= */

        const results = await Promise.allSettled(SYMBOLS_TO_SCAN.map(async (symbol) => {
            const analyses: Record<string, any> = {};
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

                // 4H Analysis (EMA20/50 Cross - More active than MA50/200)
                if (cfg.interval === '4h') {
                    const ema20Arr = calculateEMAArray(closes, 20);
                    const ema50Arr = calculateEMAArray(closes, 50);

                    if (ema20Arr.length > 2 && ema50Arr.length > 2) {
                        const ema20_curr = ema20Arr[ema20Arr.length - 1];
                        const ema50_curr = ema50Arr[ema50Arr.length - 1];
                        const ema20_prev = ema20Arr[ema20Arr.length - 2];
                        const ema50_prev = ema50Arr[ema50Arr.length - 2];

                        let cross = 'NONE';
                        if (ema20_prev <= ema50_prev && ema20_curr > ema50_curr) cross = 'BULLISH_CROSS';
                        if (ema20_prev >= ema50_prev && ema20_curr < ema50_curr) cross = 'BEARISH_CROSS';

                        const atr = calculateATR(highs, lows, closes, 14);
                        const distFromEMA = Math.abs(currentClose - ema20_curr) / ema20_curr;

                        analyses['4h'] = {
                            cross,
                            close: currentClose,
                            swingHigh: Math.max(...highs),
                            swingLow: Math.min(...lows),
                            rsi, volRatio,
                            ema20: ema20_curr,
                            ema50: ema50_curr,
                            atr, distFromEMA
                        };
                    }
                }

                // 1H Analysis (EMA20/50)
                if (cfg.interval === '1h') {
                    const ema20Arr = calculateEMAArray(closes, 20);
                    const ema50Arr = calculateEMAArray(closes, 50);
                    const ema20_curr = ema20Arr[ema20Arr.length - 1];
                    const ema50_curr = ema50Arr[ema50Arr.length - 1];
                    const ema20_prev = ema20Arr[ema20Arr.length - 2];
                    const ema50_prev = ema50Arr[ema50Arr.length - 2];

                    let cross = 'NONE';
                    if (ema20_prev <= ema50_prev && ema20_curr > ema50_curr) cross = 'BULLISH_CROSS';
                    if (ema20_prev >= ema50_prev && ema20_curr < ema50_curr) cross = 'BEARISH_CROSS';

                    const atr = calculateATR(highs, lows, closes, 14);
                    const distFromEMA = Math.abs(currentClose - ema20_curr) / ema20_curr;

                    analyses['1h'] = {
                        trend: ema20_curr > ema50_curr ? 'BULLISH' : 'BEARISH',
                        cross,
                        ema20: ema20_curr,
                        ema50: ema50_curr,
                        close: currentClose,
                        rsi, volRatio, atr, distFromEMA,
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows)
                    }
                }

                // 15M Analysis
                if (cfg.interval === '15m') {
                    const ema12Array = calculateEMAArray(closes, 12);
                    const ema26Array = calculateEMAArray(closes, 26);

                    const ema12_curr = ema12Array[ema12Array.length - 1];
                    const ema26_curr = ema26Array[ema26Array.length - 1];
                    const ema12_prev = ema12Array[ema12Array.length - 2];
                    const ema26_prev = ema26Array[ema26Array.length - 2];

                    let cross = 'NONE';
                    if (ema12_prev <= ema26_prev && ema12_curr > ema26_curr) cross = 'BULLISH_CROSS';
                    if (ema12_prev >= ema26_prev && ema12_curr < ema26_curr) cross = 'BEARISH_CROSS';

                    const ema20 = calculateEMA(closes, 20);
                    const atr = calculateATR(highs, lows, closes, 14);
                    const currentRange = highs[highs.length - 1] - lows[lows.length - 1];
                    const isExtremeVol = atr > 0 && currentRange > (atr * 2.5);
                    const distFromEMA = Math.abs(currentClose - ema20) / ema20;

                    analyses['15m'] = {
                        cross: cross,
                        close: currentClose,
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows),
                        rsi, volRatio,
                        atr, isExtremeVol, distFromEMA, ema20
                    }
                }

                // 1m Scalp Analysis (Using EMA for speed)
                if (cfg.interval === '1m') {
                    // School 1: Scalping (EMA5/13)
                    const ema5Array = calculateEMAArray(closes, 5);
                    const ema13Array = calculateEMAArray(closes, 13);
                    const ema5_curr = ema5Array[ema5Array.length - 1];
                    const ema13_curr = ema13Array[ema13Array.length - 1];
                    const ema5_prev = ema5Array[ema5Array.length - 2];
                    const ema13_prev = ema13Array[ema13Array.length - 2];

                    let crossScalp = 'NONE';
                    if (ema5_prev <= ema13_prev && ema5_curr > ema13_curr) crossScalp = 'BULLISH_CROSS';
                    if (ema5_prev >= ema13_prev && ema5_curr < ema13_curr) crossScalp = 'BEARISH_CROSS';

                    // School 2: Safe Mode (EMA12/26)
                    const ema12Array = calculateEMAArray(closes, 12);
                    const ema26Array = calculateEMAArray(closes, 26);
                    const ema12_curr = ema12Array[ema12Array.length - 1];
                    const ema26_curr = ema26Array[ema26Array.length - 1];
                    const ema12_prev = ema12Array[ema12Array.length - 2];
                    const ema26_prev = ema26Array[ema26Array.length - 2];

                    let crossSafe = 'NONE';
                    if (ema12_prev <= ema26_prev && ema12_curr > ema26_curr) crossSafe = 'BULLISH_CROSS';
                    if (ema12_prev >= ema26_prev && ema12_curr < ema26_curr) crossSafe = 'BEARISH_CROSS';

                    const ema20 = calculateEMA(closes, 20);
                    const atr = calculateATR(highs, lows, closes, 14);
                    const currentRange = highs[highs.length - 1] - lows[lows.length - 1];
                    const isExtremeVol = atr > 0 && currentRange > (atr * 3.0);
                    const distFromEMA = Math.abs(currentClose - ema20) / ema20;

                    analyses['1m_scalp'] = {
                        cross: crossScalp,
                        close: currentClose,
                        rsi, volRatio, ema20, atr, isExtremeVol, distFromEMA,
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows)
                    };
                    analyses['1m_safe'] = {
                        cross: crossSafe,
                        close: currentClose,
                        rsi, volRatio, ema20, atr, isExtremeVol, distFromEMA,
                        swingHigh: Math.max(...highs),
                        swingLow: Math.min(...lows)
                    };
                }
            }

            if (failed || !analyses['1h'] || !analyses['15m']) {
                return;
            }

            const tf4h = analyses['4h'] as any;
            const tf1h = analyses['1h'] as any;
            const tf15m = analyses['15m'] as any;
            const tf1m_scalp = analyses['1m_scalp'] as any;
            const tf1m_safe = analyses['1m_safe'] as any;

            let signals_to_process: Array<{ type: 'LONG' | 'SHORT', tf: string, ref: any, name: string }> = [];

            // Strategy 1: 4H Major Trend (EMA20/50 Cross)
            if (tf4h) {
                const volConfirm = tf4h.volRatio > 1.2;
                const notOverextended = tf4h.distFromEMA < 0.02; // Stricter entry (2% limit)
                if (tf4h.cross === 'BULLISH_CROSS' && volConfirm && tf4h.rsi > 50 && notOverextended) {
                    signals_to_process.push({ type: 'LONG', tf: '4h', ref: tf4h, name: '4H EMA20/50 Trend' });
                } else if (tf4h.cross === 'BEARISH_CROSS' && volConfirm && tf4h.rsi < 50 && notOverextended) {
                    signals_to_process.push({ type: 'SHORT', tf: '4h', ref: tf4h, name: '4H EMA20/50 Trend' });
                }
            }

            // Strategy 2: 1H Trend Optimization
            if (tf1h) {
                const volConfirm = tf1h.volRatio > 1.2;
                const notOverextended = tf1h.distFromEMA < 0.015; // 1.5% limit
                if (tf1h.cross === 'BULLISH_CROSS' && volConfirm && tf1h.rsi > 50 && notOverextended) {
                    signals_to_process.push({ type: 'LONG', tf: '1h', ref: tf1h, name: '1H EMA20/50 Trend' });
                } else if (tf1h.cross === 'BEARISH_CROSS' && volConfirm && tf1h.rsi < 50 && notOverextended) {
                    signals_to_process.push({ type: 'SHORT', tf: '1h', ref: tf1h, name: '1H EMA20/50 Trend' });
                }
            }

            // Strategy 3: 1H Trend + 15M Cross
            if (tf1h && tf15m) {
                const volConfirm = tf15m.volRatio > 1.2;
                const notOverextended = tf15m.distFromEMA < 0.01; // Stricter (1% limit)
                if (tf1h.trend === 'BULLISH' && tf15m.cross === 'BULLISH_CROSS' && volConfirm && tf15m.rsi > 50 && tf15m.rsi < 70 && !tf15m.isExtremeVol && notOverextended) {
                    signals_to_process.push({ type: 'LONG', tf: '15m', ref: tf15m, name: '1H Trend + 15M Cross' });
                } else if (tf1h.trend === 'BEARISH' && tf15m.cross === 'BEARISH_CROSS' && volConfirm && tf15m.rsi < 50 && tf15m.rsi > 45 && !tf15m.isExtremeVol && notOverextended) {
                    signals_to_process.push({ type: 'SHORT', tf: '15m', ref: tf15m, name: '1H Trend + 15M Cross' });
                }
            }

            // Strategy 3: 1m Duo Schools (Must align with 15m trend + 1h trend)
            if (tf1h && tf15m && tf1m_scalp && tf1m_safe) {
                const tf15mTrend = tf15m.close > tf15m.sma20 ? 'BULLISH' : 'BEARISH';

                // School 1: Scalping (EMA5/13)
                const scalpVol = tf1m_scalp.volRatio > 1.5;
                const scalpDist = tf1m_scalp.distFromEMA < 0.005; // Even stricter (0.5% limit)

                if (tf1h.trend === 'BULLISH' && tf15mTrend === 'BULLISH' && tf1m_scalp.cross === 'BULLISH_CROSS' && scalpVol && tf1m_scalp.rsi > 50 && tf1m_scalp.rsi < 80 && !tf1m_scalp.isExtremeVol && scalpDist) {
                    signals_to_process.push({ type: 'LONG', tf: '1m', ref: tf1m_scalp, name: '1m SCALPING (MA5/13)' });
                } else if (tf1h.trend === 'BEARISH' && tf15mTrend === 'BEARISH' && tf1m_scalp.cross === 'BEARISH_CROSS' && scalpVol && tf1m_scalp.rsi < 50 && tf1m_scalp.rsi > 20 && !tf1m_scalp.isExtremeVol && scalpDist) {
                    signals_to_process.push({ type: 'SHORT', tf: '1m', ref: tf1m_scalp, name: '1m SCALPING (MA5/13)' });
                }

                // School 2: Safe Mode (EMA12/26)
                const safeVol = tf1m_safe.volRatio > 1.3;
                const safeDist = tf1m_safe.distFromEMA < 0.003; // Ultra strict for 1m safe (0.3% limit)
                if (tf1h.trend === 'BULLISH' && tf15mTrend === 'BULLISH' && tf1m_safe.cross === 'BULLISH_CROSS' && safeVol && tf1m_safe.rsi > 50 && tf1m_safe.rsi < 75 && !tf1m_safe.isExtremeVol && safeDist) {
                    signals_to_process.push({ type: 'LONG', tf: '1m', ref: tf1m_safe, name: '1m AN TOÀN (MA12/26)' });
                } else if (tf1h.trend === 'BEARISH' && tf15mTrend === 'BEARISH' && tf1m_safe.cross === 'BEARISH_CROSS' && safeVol && tf1m_safe.rsi < 50 && tf1m_safe.rsi > 25 && !tf1m_safe.isExtremeVol && safeDist) {
                    signals_to_process.push({ type: 'SHORT', tf: '1m', ref: tf1m_safe, name: '1m AN TOÀN (MA12/26)' });
                }
            }

            for (const sig of signals_to_process) {
                if (!allowedTimeframes.includes(sig.tf)) continue;

                const { data: active } = await supabase
                    .from('trading_history')
                    .select('id')
                    .eq('symbol', symbol)
                    .eq('status', 'PENDING')
                    .eq('timeframe', sig.tf)
                    .eq('strategy_name', sig.name) // Distinguish by name
                    .limit(1);

                if (!active || active.length === 0) {
                    const { target, stopLoss } = calculateDynamicTPSL(sig.ref.close, sig.type, sig.ref.swingHigh, sig.ref.swingLow, sig.ref.atr, sig.tf);
                    const icon = sig.type === 'LONG' ? '🟢' : '🔴';

                    const vnNow = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
                    const timestampStr = `${vnNow.getUTCHours().toString().padStart(2, '0')}:${vnNow.getUTCMinutes().toString().padStart(2, '0')} ${vnNow.getUTCDate().toString().padStart(2, '0')}/${(vnNow.getUTCMonth() + 1).toString().padStart(2, '0')}`;

                    const msg = `${icon} <b>NEW SIGNAL (${sig.tf}): ${symbol}</b>\n` +
                        `Trường phái: <b>${sig.name}</b>\n` +
                        `Type: <b>${sig.type}</b>\n` +
                        `Entry: $${sig.ref.close}\n` +
                        `Target: $${target.toFixed(2)}\n` +
                        `StopLoss: $${stopLoss.toFixed(2)}\n` +
                        `Volume: <b>${sig.ref.volRatio.toFixed(2)}x</b>\n` +
                        `RSI: ${sig.ref.rsi.toFixed(1)}\n` +
                        `Time: ${timestampStr}`;

                    let msgId = null;
                    const teleRes = await sendTelegram(msg, undefined, subscriberIds);
                    if (teleRes && teleRes.ok) msgId = teleRes.result.message_id;

                    const signalData: any = {
                        symbol, timeframe: sig.tf, signal: sig.type,
                        price_at_signal: sig.ref.close,
                        target_price: target, stop_loss: stopLoss,
                        status: 'PENDING',
                        telegram_message_id: msgId,
                        rsi: sig.ref.rsi, volume_ratio: sig.ref.volRatio,
                        strategy_name: sig.name
                    };

                    const { error: insertError } = await supabase.from('trading_history').insert(signalData);

                    // FALLBACK: If new columns (strategy_name) are missing, insert without them
                    if (insertError && insertError.message.includes('column') && insertError.message.includes('not exist')) {
                        console.warn('New columns missing in DB, falling back to basic insert');
                        delete signalData.strategy_name;
                        delete signalData.pnl_reason; // just in case
                        await supabase.from('trading_history').insert(signalData);
                    }

                    newSignals.push({ symbol, signal: sig.type });
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
