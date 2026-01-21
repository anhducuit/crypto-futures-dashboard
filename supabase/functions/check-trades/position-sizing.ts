/**
 * Position Sizing Module for Futures Trading
 * Tính toán khối lượng giao dịch an toàn dựa trên risk management
 */

export interface PositionSizeParams {
    accountBalance: number;      // Tổng vốn ($)
    riskPercentage: number;      // % vốn rủi ro (1-2%)
    entryPrice: number;          // Giá vào lệnh
    stopLossPrice: number;       // Giá stop loss
    leverage: number;            // Đòn bẩy (1-125x)
}

export interface PositionSizeResult {
    quantity: number;            // Số lượng coin
    notionalValue: number;       // Giá trị danh nghĩa ($)
    margin: number;              // Margin cần thiết ($)
    maxLoss: number;             // Lỗ tối đa ($)
    maxLossPercent: number;      // Lỗ tối đa (% vốn)
}

/**
 * Tính toán position size dựa trên risk management cho Futures Trading
 * 
 * Công thức:
 * 1. Risk Amount = Account Balance × Risk %
 * 2. SL Distance % = |Entry - SL| / Entry
 * 3. Notional Value = Risk Amount / SL Distance %
 * 4. Quantity = Notional Value / Entry Price
 * 5. Margin Required = Notional Value / Leverage
 * 
 * @param params - Position sizing parameters
 * @returns Position sizing result
 * @throws Error if inputs are invalid
 */
export function calculatePositionSize(
    params: PositionSizeParams
): PositionSizeResult {
    const {
        accountBalance,
        riskPercentage,
        entryPrice,
        stopLossPrice,
        leverage
    } = params;

    // Validate inputs
    if (accountBalance <= 0) {
        throw new Error('Account balance must be positive');
    }
    if (riskPercentage <= 0 || riskPercentage > 100) {
        throw new Error('Risk percentage must be between 0 and 100');
    }
    if (entryPrice <= 0 || stopLossPrice <= 0) {
        throw new Error('Prices must be positive');
    }
    if (leverage < 1 || leverage > 125) {
        throw new Error('Leverage must be between 1 and 125');
    }
    if (entryPrice === stopLossPrice) {
        throw new Error('Stop loss cannot equal entry price');
    }

    // 1. Tính khoảng cách SL (%)
    const slDistance = Math.abs(entryPrice - stopLossPrice) / entryPrice;

    // 2. Tính số tiền rủi ro tối đa
    const maxRiskAmount = accountBalance * (riskPercentage / 100);

    // 3. Tính notional value (giá trị danh nghĩa)
    // Công thức: maxRiskAmount = notionalValue × slDistance
    // => notionalValue = maxRiskAmount / slDistance
    const notionalValue = maxRiskAmount / slDistance;

    // 4. Tính số lượng coin
    const quantity = notionalValue / entryPrice;

    // 5. Tính margin cần thiết (cho Futures)
    const margin = notionalValue / leverage;

    // 6. Validate: Margin không được vượt quá account balance
    if (margin > accountBalance) {
        throw new Error(
            `Insufficient balance. Required margin: $${margin.toFixed(2)}, Available: $${accountBalance.toFixed(2)}`
        );
    }

    // 7. Validate: Notional value không quá lớn (safety check)
    const maxNotional = accountBalance * leverage;
    if (notionalValue > maxNotional) {
        throw new Error(
            `Position size too large. Max notional with ${leverage}x leverage: $${maxNotional.toFixed(2)}`
        );
    }

    return {
        quantity: parseFloat(quantity.toFixed(8)),
        notionalValue: parseFloat(notionalValue.toFixed(2)),
        margin: parseFloat(margin.toFixed(2)),
        maxLoss: parseFloat(maxRiskAmount.toFixed(2)),
        maxLossPercent: riskPercentage
    };
}

/**
 * Tính Risk:Reward ratio
 * 
 * @param entryPrice - Giá vào lệnh
 * @param stopLossPrice - Giá stop loss
 * @param targetPrice - Giá target
 * @param signal - LONG hoặc SHORT
 * @returns R:R ratio
 */
export function calculateRiskReward(
    entryPrice: number,
    stopLossPrice: number,
    targetPrice: number,
    signal: 'LONG' | 'SHORT'
): number {
    const slDistance = Math.abs(entryPrice - stopLossPrice);

    const targetDistance = signal === 'LONG'
        ? targetPrice - entryPrice
        : entryPrice - targetPrice;

    if (slDistance === 0) return 0;

    return parseFloat((targetDistance / slDistance).toFixed(2));
}
