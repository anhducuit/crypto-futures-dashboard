// Test Position Sizing Module
// Run: node test_position_sizing.cjs

const { calculatePositionSize, calculateRiskReward } = require('./supabase/functions/check-trades/position-sizing.ts');

console.log('=== TESTING POSITION SIZING MODULE ===\n');

// Test Case 1: Normal scenario
console.log('Test 1: Normal Futures Position');
try {
    const result = calculatePositionSize({
        accountBalance: 10000,
        riskPercentage: 2,
        entryPrice: 100,
        stopLossPrice: 99,
        leverage: 20
    });

    console.log('✅ Success!');
    console.log(`  Account Balance: $10,000`);
    console.log(`  Risk: 2% = $200`);
    console.log(`  Entry: $100, SL: $99 (1% distance)`);
    console.log(`  Leverage: 20x`);
    console.log(`\n  Results:`);
    console.log(`  - Quantity: ${result.quantity} coins`);
    console.log(`  - Notional Value: $${result.notionalValue}`);
    console.log(`  - Margin Required: $${result.margin}`);
    console.log(`  - Max Loss: $${result.maxLoss} (${result.maxLossPercent}%)`);
    console.log();
} catch (error) {
    console.error('❌ Error:', error.message);
}

// Test Case 2: High leverage
console.log('Test 2: High Leverage (50x)');
try {
    const result = calculatePositionSize({
        accountBalance: 5000,
        riskPercentage: 1,
        entryPrice: 50000,
        stopLossPrice: 49500,
        leverage: 50
    });

    console.log('✅ Success!');
    console.log(`  Margin Required: $${result.margin}`);
    console.log(`  Notional Value: $${result.notionalValue}`);
    console.log(`  Max Loss: $${result.maxLoss}`);
    console.log();
} catch (error) {
    console.error('❌ Error:', error.message);
}

// Test Case 3: Invalid input (should throw error)
console.log('Test 3: Invalid Input (negative balance)');
try {
    calculatePositionSize({
        accountBalance: -1000,
        riskPercentage: 2,
        entryPrice: 100,
        stopLossPrice: 99,
        leverage: 20
    });
    console.error('❌ Should have thrown error!');
} catch (error) {
    console.log('✅ Correctly threw error:', error.message);
    console.log();
}

// Test Case 4: Risk:Reward calculation
console.log('Test 4: Risk:Reward Ratio');
const rrLong = calculateRiskReward(100, 99, 103, 'LONG');
const rrShort = calculateRiskReward(100, 101, 97, 'SHORT');

console.log(`  LONG: Entry $100, SL $99, Target $103`);
console.log(`  R:R = ${rrLong} (3% reward / 1% risk)`);
console.log(`  SHORT: Entry $100, SL $101, Target $97`);
console.log(`  R:R = ${rrShort} (3% reward / 1% risk)`);
console.log();

console.log('=== ALL TESTS COMPLETED ===');
