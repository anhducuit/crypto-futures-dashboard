/**
 * Backfill Price Action Signals
 * Scan historical data from 2026-01-15 to now
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tnmagcatofooeshzdhac.supabase.co';
const supabaseKey = 'sb_secret_AE9jk6pbcyFQRS-rSCFjzQ_DRJ5f4Xj';
const supabase = createClient(supabaseUrl, supabaseKey);

const BINANCE_API = 'https://api.binance.com/api/v3';

// Symbols to scan
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

// Timeframes (thêm 1m)
const TIMEFRAMES = ['1m', '15m', '1h', '4h'];

/**
 * Fetch historical klines from Binance
 */
async function fetchHistoricalKlines(symbol, interval, startTime, endTime) {
    const url = `${BINANCE_API}/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}&limit=1000`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        return data.map(k => ({
            time: new Date(k[0]),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
        }));
    } catch (error) {
        console.error(`Error fetching ${symbol} ${interval}:`, error.message);
        return [];
    }
}

/**
 * Simple market structure analysis (simplified for backfill)
 */
function analyzeMarketStructure(candles) {
    if (candles.length < 20) return { trend: 'SIDEWAYS' };

    const recent = candles.slice(-20);
    const highs = recent.map(c => c.high);
    const lows = recent.map(c => c.low);

    const avgHigh = highs.reduce((a, b) => a + b, 0) / highs.length;
    const avgLow = lows.reduce((a, b) => a + b, 0) / lows.length;

    const recentHigh = highs.slice(-5).reduce((a, b) => a + b, 0) / 5;
    const recentLow = lows.slice(-5).reduce((a, b) => a + b, 0) / 5;

    if (recentHigh > avgHigh && recentLow > avgLow) {
        return { trend: 'BULLISH' };
    } else if (recentHigh < avgHigh && recentLow < avgLow) {
        return { trend: 'BEARISH' };
    }

    return { trend: 'SIDEWAYS' };
}

/**
 * Detect simple demand/supply zones
 */
function detectZones(candles) {
    const zones = [];

    for (let i = 20; i < candles.length - 20; i++) {
        const before = candles.slice(i - 15, i);
        const base = candles.slice(i, i + 10);
        const after = candles.slice(i + 10, i + 25);

        const beforeChange = (before[before.length - 1].close - before[0].close) / before[0].close;
        const afterChange = (after[after.length - 1].close - after[0].close) / after[0].close;

        const baseHigh = Math.max(...base.map(c => c.high));
        const baseLow = Math.min(...base.map(c => c.low));
        const baseRange = (baseHigh - baseLow) / baseLow;

        // Demand zone: drop → base → rally (NỚI LỎNG: 1.5% thay vì 2%)
        if (beforeChange < -0.015 && afterChange > 0.015 && baseRange < 0.02) {
            zones.push({
                type: 'DEMAND',
                top: baseHigh,
                bottom: baseLow,
                index: i,
                strength: Math.abs(beforeChange) > 0.03 ? 'STRONG' : 'MEDIUM'
            });
        }

        // Supply zone: rally → base → drop (NỚI LỎNG: 1.5% thay vì 2%)
        if (beforeChange > 0.015 && afterChange < -0.015 && baseRange < 0.02) {
            zones.push({
                type: 'SUPPLY',
                top: baseHigh,
                bottom: baseLow,
                index: i,
                strength: Math.abs(afterChange) > 0.03 ? 'STRONG' : 'MEDIUM'
            });
        }
    }

    return zones;
}

/**
 * Generate signals from historical data
 */
async function backfillSignals() {
    console.log('🔄 Starting backfill from December 2025...\n');

    // Scan tháng 12/2025 (nhiều biến động hơn)
    const startDate = new Date('2025-12-01T00:00:00Z');
    const endDate = new Date('2025-12-31T23:59:59Z');
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    console.log(`📅 Period: ${startDate.toISOString()} → ${endDate.toISOString()}\n`);

    let totalSignals = 0;

    for (const symbol of SYMBOLS) {
        for (const tf of TIMEFRAMES) {
            console.log(`📊 Scanning ${symbol} ${tf}...`);

            try {
                // Fetch historical data
                const candles = await fetchHistoricalKlines(symbol, tf, startTime, endTime);

                if (candles.length < 50) {
                    console.log(`   ⚠️ Not enough data (${candles.length} candles)`);
                    continue;
                }

                console.log(`   ✅ Fetched ${candles.length} candles`);

                // Analyze structure
                const structure = analyzeMarketStructure(candles);

                // Detect zones
                const zones = detectZones(candles);
                console.log(`   🎯 Found ${zones.length} zones`);

                // Generate signals
                const signals = [];

                for (const zone of zones) {
                    const zoneCandle = candles[zone.index + 15]; // Candle tại thời điểm zone được tạo

                    if (zone.type === 'DEMAND' && structure.trend === 'BULLISH') {
                        signals.push({
                            symbol,
                            timeframe: tf,
                            signal_type: 'LONG',
                            pattern_category: 'STRATEGY',
                            pattern_type: 'DEMAND_ZONE_BOUNCE',
                            pattern_strength: zone.strength,
                            entry_price: zone.top,
                            stop_loss: zone.bottom * 0.995,
                            target_price: zone.top * 1.03,
                            risk_reward_ratio: 6.0,
                            market_trend: structure.trend,
                            sd_zone_type: 'DEMAND',
                            sd_zone_top: zone.top,
                            sd_zone_bottom: zone.bottom,
                            sd_zone_strength: zone.strength,
                            confluence_factors: ['SUPPLY_DEMAND_ZONE', 'MARKET_STRUCTURE'],
                            confluence_score: 44,
                            volume_confirmed: false,
                            volume_ratio: 1.0,
                            created_at: zoneCandle.time.toISOString(),
                            pattern_data: {
                                zone_formation: 'DROP_BASE_RALLY',
                                backfilled: true
                            }
                        });
                    }

                    if (zone.type === 'SUPPLY' && structure.trend === 'BEARISH') {
                        signals.push({
                            symbol,
                            timeframe: tf,
                            signal_type: 'SHORT',
                            pattern_category: 'STRATEGY',
                            pattern_type: 'SUPPLY_ZONE_REJECTION',
                            pattern_strength: zone.strength,
                            entry_price: zone.bottom,
                            stop_loss: zone.top * 1.005,
                            target_price: zone.bottom * 0.97,
                            risk_reward_ratio: 6.0,
                            market_trend: structure.trend,
                            sd_zone_type: 'SUPPLY',
                            sd_zone_top: zone.top,
                            sd_zone_bottom: zone.bottom,
                            sd_zone_strength: zone.strength,
                            confluence_factors: ['SUPPLY_DEMAND_ZONE', 'MARKET_STRUCTURE'],
                            confluence_score: 44,
                            volume_confirmed: false,
                            volume_ratio: 1.0,
                            created_at: zoneCandle.time.toISOString(),
                            pattern_data: {
                                zone_formation: 'RALLY_BASE_DROP',
                                backfilled: true
                            }
                        });
                    }
                }

                // Save to database
                if (signals.length > 0) {
                    const { error } = await supabase
                        .from('price_action_signals')
                        .insert(signals);

                    if (error) {
                        console.error(`   ❌ Error saving: ${error.message}`);
                    } else {
                        console.log(`   ✅ Saved ${signals.length} signals`);
                        totalSignals += signals.length;
                    }
                }

                // Rate limit
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
            }
        }
    }

    console.log(`\n✅ Backfill complete! Total signals: ${totalSignals}`);
    console.log('\n📊 Check signals:');
    console.log('SELECT symbol, timeframe, signal_type, pattern_type, created_at FROM price_action_signals ORDER BY created_at DESC LIMIT 20;');
}

// Run backfill
backfillSignals().catch(console.error);
