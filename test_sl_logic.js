function calculateDynamicTPSL(
    entryPrice,
    signal,
    swingHigh,
    swingLow,
    atr = 0,
    timeframe = '15m'
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
        target = entryPrice + Math.max(range * 0.618, volatilityBuffer * 1.5);
        stopLoss = entryPrice - volatilityBuffer;

        const minRR = 1.5;
        const maxSL = 0.035;
        const minSL = timeframe === '4h' ? 0.02 : (timeframe === '1h' ? 0.015 : (timeframe === '15m' ? 0.012 : 0.012));

        const currentSLPercent = Math.abs(entryPrice - stopLoss) / entryPrice;
        console.log(`[DEBUG] TF: ${timeframe}, minSL: ${minSL}, currentSL%: ${currentSLPercent}`);
        
        if (currentSLPercent < minSL) {
            console.log(`[DEBUG] currentSL% < minSL, updating stopLoss from ${stopLoss} to ${entryPrice * (1 - minSL)}`);
            stopLoss = entryPrice * (1 - minSL);
        }
        if (currentSLPercent > maxSL) stopLoss = entryPrice * (1 - maxSL);

        const currentTPPercent = Math.abs(target - entryPrice) / entryPrice;
        const requiredTP = (Math.abs(entryPrice - stopLoss) / entryPrice) * minRR;
        if (currentTPPercent < requiredTP) target = entryPrice * (1 + requiredTP);
    } else {
        target = entryPrice - Math.max(range * 0.618, volatilityBuffer * 1.5);
        stopLoss = entryPrice + volatilityBuffer;

        const minRR = 1.5;
        const maxSL = 0.035;
        const minSL = timeframe === '4h' ? 0.02 : (timeframe === '1h' ? 0.015 : (timeframe === '15m' ? 0.012 : 0.012));

        const currentSLPercent = Math.abs(stopLoss - entryPrice) / entryPrice;
        if (currentSLPercent < minSL) stopLoss = entryPrice * (1 + minSL);
        if (currentSLPercent > maxSL) stopLoss = entryPrice * (1 + maxSL);

        const currentTPPercent = Math.abs(entryPrice - target) / entryPrice;
        const requiredTP = (Math.abs(stopLoss - entryPrice) / entryPrice) * minRR;
        if (currentTPPercent < requiredTP) target = entryPrice * (1 - requiredTP);
    }

    return { target, stopLoss };
}

// Test case for XAGUSDT 1h
const res = calculateDynamicTPSL(79.99, 'LONG', 80.5, 79.5, 0.05, '1h');
console.log('Result:', res);
