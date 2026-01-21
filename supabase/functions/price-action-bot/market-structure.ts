/**
 * Price Action Bot - Market Structure Detection
 * Detects HH/HL/LH/LL, BOS, and market trend
 */

export interface PricePoint {
    price: number;
    time: Date;
    index: number;
}

export interface SwingPoint extends PricePoint {
    type: 'SWING_HIGH' | 'SWING_LOW';
}

export interface StructurePoint extends SwingPoint {
    structureType: 'HH' | 'HL' | 'LH' | 'LL';
}

export interface BreakOfStructure {
    type: 'BULLISH_BOS' | 'BEARISH_BOS';
    price: number;
    time: Date;
    previousStructure: 'HH' | 'HL' | 'LH' | 'LL';
}

export interface MarketStructure {
    trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
    higherHighs: StructurePoint[];
    higherLows: StructurePoint[];
    lowerHighs: StructurePoint[];
    lowerLows: StructurePoint[];
    lastBOS: BreakOfStructure | null;
}

export interface Candle {
    time: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

/**
 * Find swing highs and lows using simple pivot detection
 */
export function findSwingPoints(candles: Candle[], leftBars: number = 5, rightBars: number = 5): SwingPoint[] {
    const swings: SwingPoint[] = [];

    for (let i = leftBars; i < candles.length - rightBars; i++) {
        const current = candles[i];

        // Check for swing high
        let isSwingHigh = true;
        for (let j = i - leftBars; j <= i + rightBars; j++) {
            if (j === i) continue;
            if (candles[j].high >= current.high) {
                isSwingHigh = false;
                break;
            }
        }

        if (isSwingHigh) {
            swings.push({
                price: current.high,
                time: current.time,
                index: i,
                type: 'SWING_HIGH'
            });
        }

        // Check for swing low
        let isSwingLow = true;
        for (let j = i - leftBars; j <= i + rightBars; j++) {
            if (j === i) continue;
            if (candles[j].low <= current.low) {
                isSwingLow = false;
                break;
            }
        }

        if (isSwingLow) {
            swings.push({
                price: current.low,
                time: current.time,
                index: i,
                type: 'SWING_LOW'
            });
        }
    }

    return swings.sort((a, b) => a.index - b.index);
}

/**
 * Classify swing points as HH/HL/LH/LL
 */
export function classifyStructure(swings: SwingPoint[]): StructurePoint[] {
    const classified: StructurePoint[] = [];

    const highs = swings.filter(s => s.type === 'SWING_HIGH');
    const lows = swings.filter(s => s.type === 'SWING_LOW');

    // Classify highs
    for (let i = 1; i < highs.length; i++) {
        const current = highs[i];
        const previous = highs[i - 1];

        classified.push({
            ...current,
            structureType: current.price > previous.price ? 'HH' : 'LH'
        });
    }

    // Classify lows
    for (let i = 1; i < lows.length; i++) {
        const current = lows[i];
        const previous = lows[i - 1];

        classified.push({
            ...current,
            structureType: current.price > previous.price ? 'HL' : 'LL'
        });
    }

    return classified.sort((a, b) => a.index - b.index);
}

/**
 * Detect Break of Structure
 */
export function detectBOS(candles: Candle[], structure: StructurePoint[]): BreakOfStructure | null {
    if (structure.length < 2) return null;

    const recentStructure = structure.slice(-10); // Last 10 structure points
    const currentCandle = candles[candles.length - 1];

    // Check for bullish BOS (price breaks above recent LH)
    const recentLH = recentStructure.filter(s => s.structureType === 'LH').slice(-1)[0];
    if (recentLH && currentCandle.close > recentLH.price) {
        return {
            type: 'BULLISH_BOS',
            price: recentLH.price,
            time: currentCandle.time,
            previousStructure: 'LH'
        };
    }

    // Check for bearish BOS (price breaks below recent HL)
    const recentHL = recentStructure.filter(s => s.structureType === 'HL').slice(-1)[0];
    if (recentHL && currentCandle.close < recentHL.price) {
        return {
            type: 'BEARISH_BOS',
            price: recentHL.price,
            time: currentCandle.time,
            previousStructure: 'HL'
        };
    }

    return null;
}

/**
 * Determine market trend based on structure
 */
export function determineTrend(structure: StructurePoint[]): 'BULLISH' | 'BEARISH' | 'SIDEWAYS' {
    if (structure.length < 4) return 'SIDEWAYS';

    const recent = structure.slice(-6); // Last 6 structure points

    const hhCount = recent.filter(s => s.structureType === 'HH').length;
    const hlCount = recent.filter(s => s.structureType === 'HL').length;
    const lhCount = recent.filter(s => s.structureType === 'LH').length;
    const llCount = recent.filter(s => s.structureType === 'LL').length;

    // Bullish: More HH and HL
    if (hhCount + hlCount > lhCount + llCount && hhCount >= 1 && hlCount >= 1) {
        return 'BULLISH';
    }

    // Bearish: More LH and LL
    if (lhCount + llCount > hhCount + hlCount && lhCount >= 1 && llCount >= 1) {
        return 'BEARISH';
    }

    return 'SIDEWAYS';
}

/**
 * Main function to analyze market structure
 */
export function analyzeMarketStructure(candles: Candle[]): MarketStructure {
    // 1. Find swing points
    const swings = findSwingPoints(candles);

    // 2. Classify structure
    const classified = classifyStructure(swings);

    // 3. Separate by type
    const higherHighs = classified.filter(s => s.structureType === 'HH');
    const higherLows = classified.filter(s => s.structureType === 'HL');
    const lowerHighs = classified.filter(s => s.structureType === 'LH');
    const lowerLows = classified.filter(s => s.structureType === 'LL');

    // 4. Determine trend
    const trend = determineTrend(classified);

    // 5. Detect BOS
    const lastBOS = detectBOS(candles, classified);

    return {
        trend,
        higherHighs,
        higherLows,
        lowerHighs,
        lowerLows,
        lastBOS
    };
}
