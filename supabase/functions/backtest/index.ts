import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/* --- CONSTANTS & CONFIG --- */
const MAX_CONCURRENT_BACKTESTS = 3;
const CHUNK_SIZE = 1000; // Process 1000 candles at a time
const MAX_BACKTEST_DURATION_MS = 5 * 60 * 1000; // 5 minutes timeout

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/* --- HELPER FUNCTIONS (Reuse from check-trades) --- */

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

/* --- STRATEGY IMPLEMENTATIONS --- */

interface StrategySignal {
    type: 'LONG' | 'SHORT' | 'NONE';
    confidence: number;
    indicators: {
        rsi?: number;
        volumeRatio?: number;
        emaFast?: number;
        emaSlow?: number;
    };
}

function strategyEMACross(
    closes: number[],
    volumes: number[],
    highs: number[],
    lows: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26
): StrategySignal {
    if (closes.length < slowPeriod + 2) {
        return { type: 'NONE', confidence: 0, indicators: {} };
    }

    const emaFastArray = calculateEMAArray(closes, fastPeriod);
    const emaSlowArray = calculateEMAArray(closes, slowPeriod);

    const emaFastCurr = emaFastArray[emaFastArray.length - 1];
    const emaSlowCurr = emaSlowArray[emaSlowArray.length - 1];
    const emaFastPrev = emaFastArray[emaFastArray.length - 2];
    const emaSlowPrev = emaSlowArray[emaSlowArray.length - 2];

    const rsi = calculateRSI(closes);
    const avgVol = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVol = volumes[volumes.length - 1];
    const volRatio = avgVol > 0 ? currentVol / avgVol : 1;

    // Bullish cross
    if (emaFastPrev <= emaSlowPrev && emaFastCurr > emaSlowCurr) {
        if (volRatio > 1.2 && rsi > 45 && rsi < 75) {
            return {
                type: 'LONG',
                confidence: 0.8,
                indicators: { rsi, volumeRatio: volRatio, emaFast: emaFastCurr, emaSlow: emaSlowCurr }
            };
        }
    }

    // Bearish cross
    if (emaFastPrev >= emaSlowPrev && emaFastCurr < emaSlowCurr) {
        if (volRatio > 1.2 && rsi < 55 && rsi > 25) {
            return {
                type: 'SHORT',
                confidence: 0.8,
                indicators: { rsi, volumeRatio: volRatio, emaFast: emaFastCurr, emaSlow: emaSlowCurr }
            };
        }
    }

    return { type: 'NONE', confidence: 0, indicators: { rsi, volumeRatio: volRatio } };
}

/* --- BACKTESTING ENGINE --- */

interface BacktestConfig {
    strategy: string;
    timeframe: string;
    symbol: string;
    startDate: string;
    endDate: string;
    initialCapital: number;
    riskPercentage: number;
    leverage: number;
}

interface BacktestTrade {
    entryTime: string;
    exitTime: string | null;
    signal: 'LONG' | 'SHORT';
    entryPrice: number;
    exitPrice: number | null;
    quantity: number;
    pnl: number | null;
    pnlPercent: number | null;
    exitReason: string | null;
    rsi: number;
    volumeRatio: number;
    emaFast: number;
    emaSlow: number;
}

async function fetchHistoricalData(
    symbol: string,
    interval: string,
    startTime: number,
    limit: number = 1000
): Promise<any[]> {
    const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&limit=${limit}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch data from Binance: ${response.statusText}`);
    }
    return await response.json();
}

async function runBacktest(
    runId: string,
    config: BacktestConfig,
    supabase: any
): Promise<void> {
    const startTime = Date.now();

    try {
        await supabase.from('backtest_runs').update({ status: 'RUNNING' }).eq('id', runId);

        const trades: BacktestTrade[] = [];
        let currentCapital = config.initialCapital;
        let activeTrade: BacktestTrade | null = null;

        const startTimestamp = new Date(config.startDate).getTime();
        const endTimestamp = new Date(config.endDate).getTime();

        let currentTimestamp = startTimestamp;
        let totalCandles = 0;

        // Process data in chunks
        while (currentTimestamp < endTimestamp) {
            // Check timeout
            if (Date.now() - startTime > MAX_BACKTEST_DURATION_MS) {
                throw new Error('Backtest timeout exceeded');
            }

            // Fetch chunk
            const candles = await fetchHistoricalData(
                config.symbol,
                config.timeframe,
                currentTimestamp,
                CHUNK_SIZE
            );

            if (!candles || candles.length === 0) break;

            totalCandles += candles.length;

            // Process each candle
            for (let i = 0; i < candles.length; i++) {
                const candle = candles[i];
                const openTime = parseInt(candle[0]);
                const open = parseFloat(candle[1]);
                const high = parseFloat(candle[2]);
                const low = parseFloat(candle[3]);
                const close = parseFloat(candle[4]);
                const volume = parseFloat(candle[5]);

                if (openTime > endTimestamp) break;

                // Build historical data for indicators (use last 100 candles)
                const historyStart = Math.max(0, i - 100);
                const historicalCloses = candles.slice(historyStart, i + 1).map((c: any) => parseFloat(c[4]));
                const historicalVolumes = candles.slice(historyStart, i + 1).map((c: any) => parseFloat(c[5]));
                const historicalHighs = candles.slice(historyStart, i + 1).map((c: any) => parseFloat(c[2]));
                const historicalLows = candles.slice(historyStart, i + 1).map((c: any) => parseFloat(c[3]));

                // Check exit conditions for active trade
                if (activeTrade) {
                    let shouldExit = false;
                    let exitReason = '';
                    let exitPrice = close;

                    if (activeTrade.signal === 'LONG') {
                        // Check if hit target or stop loss
                        const targetPrice = activeTrade.entryPrice * 1.015; // 1.5% target
                        const stopLossPrice = activeTrade.entryPrice * 0.99; // 1% stop loss

                        if (high >= targetPrice) {
                            shouldExit = true;
                            exitReason = 'TARGET_HIT';
                            exitPrice = targetPrice;
                        } else if (low <= stopLossPrice) {
                            shouldExit = true;
                            exitReason = 'STOP_LOSS';
                            exitPrice = stopLossPrice;
                        }
                    } else {
                        // SHORT
                        const targetPrice = activeTrade.entryPrice * 0.985;
                        const stopLossPrice = activeTrade.entryPrice * 1.01;

                        if (low <= targetPrice) {
                            shouldExit = true;
                            exitReason = 'TARGET_HIT';
                            exitPrice = targetPrice;
                        } else if (high >= stopLossPrice) {
                            shouldExit = true;
                            exitReason = 'STOP_LOSS';
                            exitPrice = stopLossPrice;
                        }
                    }

                    if (shouldExit) {
                        // Calculate PnL
                        const priceDiff = activeTrade.signal === 'LONG'
                            ? (exitPrice - activeTrade.entryPrice) / activeTrade.entryPrice
                            : (activeTrade.entryPrice - exitPrice) / activeTrade.entryPrice;

                        const pnl = priceDiff * activeTrade.quantity * activeTrade.entryPrice * config.leverage;
                        const pnlPercent = priceDiff * config.leverage * 100;

                        activeTrade.exitTime = new Date(openTime).toISOString();
                        activeTrade.exitPrice = exitPrice;
                        activeTrade.pnl = pnl;
                        activeTrade.pnlPercent = pnlPercent;
                        activeTrade.exitReason = exitReason;

                        currentCapital += pnl;
                        trades.push(activeTrade);
                        activeTrade = null;
                    }
                }

                // Check entry conditions (only if no active trade)
                if (!activeTrade && historicalCloses.length >= 50) {
                    let signal: StrategySignal = { type: 'NONE', confidence: 0, indicators: {} };

                    // Apply strategy
                    if (config.strategy === 'EMA_CROSS') {
                        signal = strategyEMACross(historicalCloses, historicalVolumes, historicalHighs, historicalLows);
                    }

                    if (signal.type !== 'NONE') {
                        // Calculate position size
                        const riskAmount = currentCapital * (config.riskPercentage / 100);
                        const slDistance = 0.01; // 1% SL
                        const notionalValue = riskAmount / slDistance;
                        const quantity = notionalValue / close;

                        activeTrade = {
                            entryTime: new Date(openTime).toISOString(),
                            exitTime: null,
                            signal: signal.type,
                            entryPrice: close,
                            exitPrice: null,
                            quantity,
                            pnl: null,
                            pnlPercent: null,
                            exitReason: null,
                            rsi: signal.indicators.rsi || 50,
                            volumeRatio: signal.indicators.volumeRatio || 1,
                            emaFast: signal.indicators.emaFast || 0,
                            emaSlow: signal.indicators.emaSlow || 0
                        };
                    }
                }
            }

            // Move to next chunk
            currentTimestamp = parseInt(candles[candles.length - 1][0]) + 1;
        }

        // Close any remaining active trade
        if (activeTrade) {
            activeTrade.exitTime = new Date(endTimestamp).toISOString();
            activeTrade.exitPrice = activeTrade.entryPrice; // Exit at entry price
            activeTrade.pnl = 0;
            activeTrade.pnlPercent = 0;
            activeTrade.exitReason = 'TIMEOUT';
            trades.push(activeTrade);
        }

        // Save trades to database
        if (trades.length > 0) {
            const tradesToInsert = trades.map(t => ({
                backtest_run_id: runId,
                entry_time: t.entryTime,
                exit_time: t.exitTime,
                signal: t.signal,
                entry_price: t.entryPrice,
                exit_price: t.exitPrice,
                quantity: t.quantity,
                pnl: t.pnl,
                pnl_percent: t.pnlPercent,
                exit_reason: t.exitReason,
                rsi: t.rsi,
                volume_ratio: t.volumeRatio,
                ema_fast: t.emaFast,
                ema_slow: t.emaSlow
            }));

            await supabase.from('backtest_trades').insert(tradesToInsert);
        }

        // Calculate metrics using database function
        await supabase.rpc('calculate_backtest_metrics', { run_id: runId });

        // Update status
        const executionTime = Date.now() - startTime;
        await supabase.from('backtest_runs').update({
            status: 'COMPLETED',
            execution_time_ms: executionTime,
            candles_processed: totalCandles
        }).eq('id', runId);

        console.log(`[BACKTEST COMPLETED] Run ${runId}: ${trades.length} trades, ${totalCandles} candles, ${executionTime}ms`);

    } catch (error: any) {
        console.error(`[BACKTEST FAILED] Run ${runId}:`, error.message);
        await supabase.from('backtest_runs').update({
            status: 'FAILED',
            error_message: error.message,
            execution_time_ms: Date.now() - startTime
        }).eq('id', runId);
    }
}

/* --- MAIN HANDLER --- */

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        const url = new URL(req.url);
        const action = url.searchParams.get('action');

        // GET: Check status of a backtest run
        if (req.method === 'GET') {
            const runId = url.searchParams.get('runId');
            if (!runId) {
                return new Response(JSON.stringify({ error: 'runId required' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            const { data, error } = await supabase
                .from('backtest_runs')
                .select('*, backtest_trades(*)')
                .eq('id', runId)
                .single();

            if (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 404,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // POST: Start a new backtest
        if (req.method === 'POST') {
            const config: BacktestConfig = await req.json();

            // Validate config
            if (!config.strategy || !config.timeframe || !config.symbol || !config.startDate || !config.endDate) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Check concurrent limit
            const { count } = await supabase
                .from('backtest_runs')
                .select('*', { count: 'exact', head: true })
                .in('status', ['PENDING', 'RUNNING']);

            if (count && count >= MAX_CONCURRENT_BACKTESTS) {
                return new Response(JSON.stringify({
                    error: `Too many backtests running (${count}/${MAX_CONCURRENT_BACKTESTS}). Please wait.`
                }), {
                    status: 429,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Create backtest run record
            const { data: run, error: insertError } = await supabase
                .from('backtest_runs')
                .insert({
                    strategy_name: config.strategy,
                    timeframe: config.timeframe,
                    symbol: config.symbol,
                    start_date: config.startDate,
                    end_date: config.endDate,
                    initial_capital: config.initialCapital || 10000,
                    risk_percentage: config.riskPercentage || 2,
                    leverage: config.leverage || 20,
                    status: 'PENDING'
                })
                .select()
                .single();

            if (insertError) {
                return new Response(JSON.stringify({ error: insertError.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Start backtest asynchronously (don't wait for completion)
            runBacktest(run.id, config, supabase);

            return new Response(JSON.stringify({
                runId: run.id,
                status: 'RUNNING',
                message: 'Backtest started. Check status with GET /backtest?runId=' + run.id
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error('Handler Error:', err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
