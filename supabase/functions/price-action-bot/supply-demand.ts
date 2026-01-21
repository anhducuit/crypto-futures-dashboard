/**
 * Supply & Demand Zone Detection
 * Detects Rally-Base-Drop (Supply) and Drop-Base-Rally (Demand) zones
 */

import { Candle } from './market-structure.ts';

export interface SupplyDemandZone {
    type: 'SUPPLY' | 'DEMAND';
    top: number;
    bottom: number;
    strength: 'WEAK' | 'MEDIUM' | 'STRONG' | 'EXTREME';

    // Formation details
    formationType: 'RALLY_BASE_DROP' | 'DROP_BASE_RALLY' | 'IMBALANCE';
    createdAt: Date;
    createdIndex: number;
    touchCount: number;

    // Confluence
    hasLiquidity: boolean;
    hasBOS: boolean;
    volumeConfirmed: boolean;
}

interface SharpMove {
    startIndex: number;
    endIndex: number;
    startPrice: number;
    endPrice: number;
    percentMove: number;
    avgVolume: number;
}

interface Consolidation {
    startIndex: number;
    endIndex: number;
    high: number;
    low: number;
    range: number;
}

/**
 * Detect sharp price move (rally or drop)
 */
function detectSharpMove(
    candles: Candle[],
    startIdx: number,
    endIdx: number,
    direction: 'UP' | 'DOWN',
    minPercent: number = 2.0
): SharpMove | null {
    if (startIdx < 0 || endIdx >= candles.length || startIdx >= endIdx) return null;

    const startPrice = candles[startIdx].close;
    const endPrice = candles[endIdx].close;
    const percentMove = Math.abs((endPrice - startPrice) / startPrice) * 100;

    // Check direction
    if (direction === 'UP' && endPrice <= startPrice) return null;
    if (direction === 'DOWN' && endPrice >= startPrice) return null;

    // Check if move is sharp enough
    if (percentMove < minPercent) return null;

    // Calculate average volume
    const volumes = candles.slice(startIdx, endIdx + 1).map(c => c.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    return {
        startIndex: startIdx,
        endIndex: endIdx,
        startPrice,
        endPrice,
        percentMove,
        avgVolume
    };
}

/**
 * Detect consolidation (base)
 */
function detectConsolidation(
    candles: Candle[],
    startIdx: number,
    endIdx: number,
    maxRangePercent: number = 1.5
): Consolidation | null {
    if (startIdx < 0 || endIdx >= candles.length || startIdx >= endIdx) return null;

    const slice = candles.slice(startIdx, endIdx + 1);
    const high = Math.max(...slice.map(c => c.high));
    const low = Math.min(...slice.map(c => c.low));
    const range = ((high - low) / low) * 100;

    // Check if range is tight enough
    if (range > maxRangePercent) return null;

    return {
        startIndex: startIdx,
        endIndex: endIdx,
        high,
        low,
        range
    };
}

/**
 * Find Drop-Base-Rally patterns (DEMAND zones)
 */
export function findDemandZones(candles: Candle[]): SupplyDemandZone[] {
    const zones: SupplyDemandZone[] = [];
    const minLookback = 20;
    const maxLookback = 50;

    for (let i = minLookback; i < candles.length - minLookback; i++) {
        // Look for: Sharp drop → Consolidation → Sharp rally

        // 1. Check for sharp drop before
        const drop = detectSharpMove(candles, i - 15, i, 'DOWN', 2.0);
        if (!drop) continue;

        // 2. Check for consolidation (base)
        const base = detectConsolidation(candles, i, i + 10, 1.5);
        if (!base) continue;

        // 3. Check for sharp rally after
        const rally = detectSharpMove(candles, i + 10, Math.min(i + 25, candles.length - 1), 'UP', 2.0);
        if (!rally) continue;

        // 4. Create demand zone
        zones.push({
            type: 'DEMAND',
            top: base.high,
            bottom: base.low,
            strength: 'MEDIUM',
            formationType: 'DROP_BASE_RALLY',
            createdAt: candles[i].time,
            createdIndex: i,
            touchCount: 0,
            hasLiquidity: false,
            hasBOS: false,
            volumeConfirmed: rally.avgVolume > drop.avgVolume * 1.2
        });
    }

    return zones;
}

/**
 * Find Rally-Base-Drop patterns (SUPPLY zones)
 */
export function findSupplyZones(candles: Candle[]): SupplyDemandZone[] {
    const zones: SupplyDemandZone[] = [];
    const minLookback = 20;

    for (let i = minLookback; i < candles.length - minLookback; i++) {
        // Look for: Sharp rally → Consolidation → Sharp drop

        // 1. Check for sharp rally before
        const rally = detectSharpMove(candles, i - 15, i, 'UP', 2.0);
        if (!rally) continue;

        // 2. Check for consolidation (base)
        const base = detectConsolidation(candles, i, i + 10, 1.5);
        if (!base) continue;

        // 3. Check for sharp drop after
        const drop = detectSharpMove(candles, i + 10, Math.min(i + 25, candles.length - 1), 'DOWN', 2.0);
        if (!drop) continue;

        // 4. Create supply zone
        zones.push({
            type: 'SUPPLY',
            top: base.high,
            bottom: base.low,
            strength: 'MEDIUM',
            formationType: 'RALLY_BASE_DROP',
            createdAt: candles[i].time,
            createdIndex: i,
            touchCount: 0,
            hasLiquidity: false,
            hasBOS: false,
            volumeConfirmed: drop.avgVolume > rally.avgVolume * 1.2
        });
    }

    return zones;
}

/**
 * Find Imbalance / Fair Value Gaps
 */
export function findImbalances(candles: Candle[]): SupplyDemandZone[] {
    const zones: SupplyDemandZone[] = [];

    for (let i = 1; i < candles.length - 1; i++) {
        const prev = candles[i - 1];
        const current = candles[i];
        const next = candles[i + 1];

        // Bullish imbalance (gap up)
        if (current.low > prev.high && next.low > prev.high) {
            zones.push({
                type: 'DEMAND',
                top: current.low,
                bottom: prev.high,
                strength: 'WEAK',
                formationType: 'IMBALANCE',
                createdAt: current.time,
                createdIndex: i,
                touchCount: 0,
                hasLiquidity: false,
                hasBOS: false,
                volumeConfirmed: false
            });
        }

        // Bearish imbalance (gap down)
        if (current.high < prev.low && next.high < prev.low) {
            zones.push({
                type: 'SUPPLY',
                top: prev.low,
                bottom: current.high,
                strength: 'WEAK',
                formationType: 'IMBALANCE',
                createdAt: current.time,
                createdIndex: i,
                touchCount: 0,
                hasLiquidity: false,
                hasBOS: false,
                volumeConfirmed: false
            });
        }
    }

    return zones;
}

/**
 * Calculate zone strength based on various factors
 */
export function calculateZoneStrength(zone: SupplyDemandZone, candles: Candle[]): 'WEAK' | 'MEDIUM' | 'STRONG' | 'EXTREME' {
    let score = 0;

    // Factor 1: Formation type
    if (zone.formationType === 'DROP_BASE_RALLY' || zone.formationType === 'RALLY_BASE_DROP') {
        score += 2;
    }

    // Factor 2: Volume confirmation
    if (zone.volumeConfirmed) {
        score += 2;
    }

    // Factor 3: Touch count (untouched zones are stronger)
    if (zone.touchCount === 0) {
        score += 3;
    } else if (zone.touchCount === 1) {
        score += 1;
    }

    // Factor 4: Has BOS
    if (zone.hasBOS) {
        score += 2;
    }

    // Factor 5: Has liquidity
    if (zone.hasLiquidity) {
        score += 1;
    }

    // Classify based on score
    if (score >= 8) return 'EXTREME';
    if (score >= 6) return 'STRONG';
    if (score >= 4) return 'MEDIUM';
    return 'WEAK';
}

/**
 * Main function to detect all S/D zones
 */
export function detectSupplyDemandZones(candles: Candle[]): SupplyDemandZone[] {
    const demandZones = findDemandZones(candles);
    const supplyZones = findSupplyZones(candles);
    const imbalances = findImbalances(candles);

    const allZones = [...demandZones, ...supplyZones, ...imbalances];

    // Calculate strength for each zone
    allZones.forEach(zone => {
        zone.strength = calculateZoneStrength(zone, candles);
    });

    // Sort by creation time (newest first)
    return allZones.sort((a, b) => b.createdIndex - a.createdIndex);
}

/**
 * Check if current price is near a zone
 */
export function isPriceNearZone(price: number, zone: SupplyDemandZone, tolerance: number = 0.005): boolean {
    const zoneMiddle = (zone.top + zone.bottom) / 2;
    const distance = Math.abs(price - zoneMiddle) / price;
    return distance <= tolerance;
}
