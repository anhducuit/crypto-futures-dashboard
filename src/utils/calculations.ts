// Fibonacci Retracement Calculator
export function calculateFibonacciLevels(swingHigh: number, swingLow: number, direction: 'long' | 'short') {
    const fibRatios = [0, 0.1, 0.382, 0.5, 0.559, 0.619, 0.667, 0.786, 0.882, 1];
    const range = swingHigh - swingLow;

    if (direction === 'long') {
        // For long positions, retracement from high to low
        return fibRatios.map(ratio => ({
            ratio,
            price: swingHigh - (range * ratio),
            isGoldenZone: ratio >= 0.559 && ratio <= 0.667
        }));
    } else {
        // For short positions, retracement from low to high
        return fibRatios.map(ratio => ({
            ratio,
            price: swingLow + (range * ratio),
            isGoldenZone: ratio >= 0.559 && ratio <= 0.667
        }));
    }
}

// Liquidation Price Calculator (Binance Cross Margin Style)
export function calculateLiquidationPrice(
    entryPrice: number,
    quantity: number,
    walletBalance: number,
    direction: 'long' | 'short',
    maintenanceMarginRate: number = 0.004 // 0.4% default for Binance
): number {
    if (quantity === 0) return 0;

    // Binance Cross Margin Liquidation Formula:
    // For Long: Liq = (Entry * Qty - WalletBalance) / (Qty * (1 - MMR))
    // For Short: Liq = (Entry * Qty + WalletBalance) / (Qty * (1 + MMR))

    if (direction === 'long') {
        const liq = (entryPrice * quantity - walletBalance) / (quantity * (1 - maintenanceMarginRate));
        return Math.max(0, liq);
    } else {
        const liq = (entryPrice * quantity + walletBalance) / (quantity * (1 + maintenanceMarginRate));
        return liq;
    }
}

// Position Size Calculator
export function calculatePositionSize(
    walletBalance: number,
    entryPrice: number,
    leverage: number,
    riskPercentage: number
): { positionSize: number; positionValue: number; quantity: number } {
    const riskAmount = walletBalance * (riskPercentage / 100);
    const positionValue = riskAmount * leverage;
    const quantity = positionValue / entryPrice;

    return {
        positionSize: riskAmount,
        positionValue,
        quantity
    };
}

// PnL Calculator
export function calculatePnL(
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    direction: 'long' | 'short',
    leverage: number
): { pnl: number; pnlPercentage: number; roi: number } {
    let pnl: number;

    if (direction === 'long') {
        pnl = (exitPrice - entryPrice) * quantity;
    } else {
        pnl = (entryPrice - exitPrice) * quantity;
    }

    const investment = (entryPrice * quantity) / leverage;
    const pnlPercentage = (pnl / investment) * 100;
    const roi = pnlPercentage;

    return { pnl, pnlPercentage, roi };
}

// Take Profit Calculator
export function calculateTPTargets(
    entryPrice: number,
    leverage: number,
    direction: 'long' | 'short'
): { target1: number; target2: number; target1Label: string; target2Label: string } {
    // Target 1: 100% ROI (x2 on investment)
    // For Long: TP1 = Entry * (1 + 1/Leverage)
    // For Short: TP1 = Entry * (1 - 1/Leverage)

    let target1: number;
    let target2: number;

    if (direction === 'long') {
        target1 = entryPrice * (1 + (1 / leverage));
        // Target 2: After withdrawing principal, 100% ROI on remaining 50%
        // This means price needs to move another 1/leverage from current position
        target2 = target1 * (1 + (2 / leverage));
    } else {
        target1 = entryPrice * (1 - (1 / leverage));
        target2 = target1 * (1 - (2 / leverage));
    }

    return {
        target1,
        target2,
        target1Label: 'Rút Vốn Gốc (100% ROI)',
        target2Label: 'Chốt 50% Lợi Nhuận'
    };
}

// Split Entry Calculator (for No-Stoploss Mode)
export function calculateSplitEntries(
    walletBalance: number,
    entryPrice: number,
    swingLow: number,
): { entry1: { price: number; amount: number }; entry2: { price: number; amount: number } } {
    // Entry 1: 5% of wallet at current price
    const entry1Amount = walletBalance * 0.05;

    // Entry 2: 15% of wallet at lower Fib level (around 0.786 level)
    const entry2Amount = walletBalance * 0.15;
    const fibLevel = 0.786;
    const range = entryPrice - swingLow;
    const entry2Price = entryPrice - (range * fibLevel);

    return {
        entry1: { price: entryPrice, amount: entry1Amount },
        entry2: { price: Math.max(entry2Price, swingLow), amount: entry2Amount }
    };
}

// Stoploss PnL Calculator
export function calculateStoplossPnL(
    entryPrice: number,
    stoplossPrice: number,
    positionSize: number,
    leverage: number,
    direction: 'long' | 'short'
): number {
    const quantity = (positionSize * leverage) / entryPrice;

    if (direction === 'long') {
        return (stoplossPrice - entryPrice) * quantity;
    } else {
        return (entryPrice - stoplossPrice) * quantity;
    }
}

// Format number with commas
export function formatNumber(num: number, decimals: number = 2): string {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Format currency
export function formatCurrency(num: number, decimals: number = 2): string {
    return '$' + formatNumber(num, decimals);
}

// Format percentage
export function formatPercentage(num: number, decimals: number = 2): string {
    return formatNumber(num, decimals) + '%';
}
