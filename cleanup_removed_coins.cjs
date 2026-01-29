const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const REMOVED_COINS = ['INJUSDT', 'LINKUSDT', 'ARBUSDT', 'OPUSDT', 'FTMUSDT'];

async function cleanupRemovedCoins() {
    console.log('Cleaning up data for removed coins:', REMOVED_COINS.join(', '));

    // Delete from trading_history
    const { error: err1, count: count1 } = await supabase
        .from('trading_history')
        .delete({ count: 'exact' })
        .in('symbol', REMOVED_COINS);

    if (err1) console.error('Error deleting from trading_history:', err1);
    else console.log(`Deleted ${count1} records from trading_history`);

    // Delete from market_anomalies
    const { error: err2, count: count2 } = await supabase
        .from('market_anomalies')
        .delete({ count: 'exact' })
        .in('symbol', REMOVED_COINS);

    if (err2) console.error('Error deleting from market_anomalies:', err2);
    else console.log(`Deleted ${count2} records from market_anomalies`);

    console.log('Cleanup complete!');
}

cleanupRemovedCoins();
