import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { analyzeMarketStructure, MarketStructure, Candle } from './market-structure.ts';
import { detectSupplyDemandZones, SupplyDemandZone, isPriceNearZone } from './supply-demand.ts';

const BINANCE_API = 'https://api.binance.com/api/v3';

interface BinanceKline {
    0: number; // Open time
    1: string; // Open
    2: string; // High
    3: string; // Low
    4: string; // Close
    5: string; // Volume
    6: number; // Close time
}

/**
 * Fetch klines from Binance
 */
async function fetchKlines(symbol: string, interval: string, limit: number = 100): Promise<Candle[]> {
    const url = `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const response = await fetch(url);
    const data: BinanceKline[] = await response.json();

    return data.map(k => ({
        time: new Date(k[0]),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
    }));
}

/**
 * Calculate volume ratio
 */
function calculateVolumeRatio(candles: Candle[]): number {
    if (candles.length < 20) return 1.0;

    const recent = candles.slice(-10);
    const older = candles.slice(-30, -10);

    const recentAvg = recent.reduce((sum, c) => sum + c.volume, 0) / recent.length;
    const olderAvg = older.reduce((sum, c) => sum + c.volume, 0) / older.length;

    return recentAvg / olderAvg;
}

/**
 * Main scan function
 */
async function scanForPriceActionSignals(supabase: any) {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];
    const timeframes = ['15m', '1h', '4h'];

    const signals = [];

    for (const symbol of symbols) {
        for (const tf of timeframes) {
            try {
                // 1. Fetch candles
                const candles = await fetchKlines(symbol, tf, 100);
                const currentPrice = candles[candles.length - 1].close;

                // 2. Analyze market structure
                const structure = analyzeMarketStructure(candles);

                // 3. Detect S/D zones
                const zones = detectSupplyDemandZones(candles);

                // 4. Calculate volume
                const volumeRatio = calculateVolumeRatio(candles);

                // 5. Check for signals

                // Signal 1: Price near strong demand zone in bullish trend
                if (structure.trend === 'BULLISH') {
                    const strongDemandZones = zones.filter(z =>
                        z.type === 'DEMAND' &&
                        (z.strength === 'STRONG' || z.strength === 'EXTREME') &&
                        isPriceNearZone(currentPrice, z, 0.01)
                    );

                    for (const zone of strongDemandZones) {
                        const confluenceFactors = [];

                        if (structure.lastBOS?.type === 'BULLISH_BOS') confluenceFactors.push('MARKET_STRUCTURE');
                        confluenceFactors.push('SUPPLY_DEMAND_ZONE');
                        if (volumeRatio > 1.3) confluenceFactors.push('VOLUME_CONFIRMATION');
                        if (zone.hasBOS) confluenceFactors.push('BOS_CONFLUENCE');

                        const confluenceScore = (confluenceFactors.length / 9) * 100;

                        if (confluenceScore >= 40) { // Minimum 40% score
                            signals.push({
                                symbol,
                                timeframe: tf,
                                signal_type: 'LONG',
                                pattern_category: 'STRATEGY',
                                pattern_type: 'DEMAND_ZONE_BOUNCE',
                                pattern_strength: zone.strength,
                                entry_price: currentPrice,
                                stop_loss: zone.bottom * 0.995, // 0.5% below zone
                                target_price: currentPrice * 1.03, // 3% target
                                risk_reward_ratio: 3.0 / 0.5,
                                market_trend: structure.trend,
                                last_bos_type: structure.lastBOS?.type,
                                last_bos_price: structure.lastBOS?.price,
                                sd_zone_type: zone.type,
                                sd_zone_top: zone.top,
                                sd_zone_bottom: zone.bottom,
                                sd_zone_strength: zone.strength,
                                confluence_factors: confluenceFactors,
                                confluence_score: Math.round(confluenceScore),
                                volume_confirmed: volumeRatio > 1.3,
                                volume_ratio: volumeRatio,
                                pattern_data: {
                                    zone_formation: zone.formationType,
                                    zone_created_at: zone.createdAt,
                                    structure_points: {
                                        hh_count: structure.higherHighs.length,
                                        hl_count: structure.higherLows.length
                                    }
                                }
                            });
                        }
                    }
                }

                // Signal 2: Price near strong supply zone in bearish trend
                if (structure.trend === 'BEARISH') {
                    const strongSupplyZones = zones.filter(z =>
                        z.type === 'SUPPLY' &&
                        (z.strength === 'STRONG' || z.strength === 'EXTREME') &&
                        isPriceNearZone(currentPrice, z, 0.01)
                    );

                    for (const zone of strongSupplyZones) {
                        const confluenceFactors = [];

                        if (structure.lastBOS?.type === 'BEARISH_BOS') confluenceFactors.push('MARKET_STRUCTURE');
                        confluenceFactors.push('SUPPLY_DEMAND_ZONE');
                        if (volumeRatio > 1.3) confluenceFactors.push('VOLUME_CONFIRMATION');
                        if (zone.hasBOS) confluenceFactors.push('BOS_CONFLUENCE');

                        const confluenceScore = (confluenceFactors.length / 9) * 100;

                        if (confluenceScore >= 40) {
                            signals.push({
                                symbol,
                                timeframe: tf,
                                signal_type: 'SHORT',
                                pattern_category: 'STRATEGY',
                                pattern_type: 'SUPPLY_ZONE_REJECTION',
                                pattern_strength: zone.strength,
                                entry_price: currentPrice,
                                stop_loss: zone.top * 1.005, // 0.5% above zone
                                target_price: currentPrice * 0.97, // 3% target
                                risk_reward_ratio: 3.0 / 0.5,
                                market_trend: structure.trend,
                                last_bos_type: structure.lastBOS?.type,
                                last_bos_price: structure.lastBOS?.price,
                                sd_zone_type: zone.type,
                                sd_zone_top: zone.top,
                                sd_zone_bottom: zone.bottom,
                                sd_zone_strength: zone.strength,
                                confluence_factors: confluenceFactors,
                                confluence_score: Math.round(confluenceScore),
                                volume_confirmed: volumeRatio > 1.3,
                                volume_ratio: volumeRatio,
                                pattern_data: {
                                    zone_formation: zone.formationType,
                                    zone_created_at: zone.createdAt,
                                    structure_points: {
                                        lh_count: structure.lowerHighs.length,
                                        ll_count: structure.lowerLows.length
                                    }
                                }
                            });
                        }
                    }
                }

            } catch (error) {
                console.error(`Error scanning ${symbol} ${tf}:`, error);
            }
        }
    }

    return signals;
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
    try {
        // Use Supabase reserved environment variables
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('SUPABASE_DB_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log('[PRICE ACTION BOT] Starting scan...');

        // Scan for signals
        const signals = await scanForPriceActionSignals(supabase);

        console.log(`[PRICE ACTION BOT] Found ${signals.length} signals`);

        // Save signals to database
        if (signals.length > 0) {
            const { error } = await supabase
                .from('price_action_signals')
                .insert(signals);

            if (error) {
                console.error('[PRICE ACTION BOT] Error saving signals:', error);
            } else {
                console.log(`[PRICE ACTION BOT] Saved ${signals.length} signals`);
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                signalsFound: signals.length,
                signals: signals.map(s => ({
                    symbol: s.symbol,
                    timeframe: s.timeframe,
                    type: s.signal_type,
                    pattern: s.pattern_type,
                    confluenceScore: s.confluence_score
                }))
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('[PRICE ACTION BOT] Error:', error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
});
