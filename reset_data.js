
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function resetAllData() {
    console.log('=== RESETTING ALL TRADING DATA ===\n')

    // 1. Count before
    const { count: hBefore } = await supabase.from('trading_history').select('*', { count: 'exact', head: true })
    const { count: aBefore } = await supabase.from('market_anomalies').select('*', { count: 'exact', head: true })
    console.log(`Before: trading_history = ${hBefore} rows, market_anomalies = ${aBefore} rows`)

    // 2. Delete all trading_history
    const { error: hErr } = await supabase.from('trading_history').delete().gte('created_at', '2020-01-01')
    if (hErr) console.error('Error deleting trading_history:', hErr.message)
    else console.log('✅ Deleted all trading_history')

    // 3. Delete all market_anomalies
    const { error: aErr } = await supabase.from('market_anomalies').delete().gte('created_at', '2020-01-01')
    if (aErr) console.error('Error deleting market_anomalies:', aErr.message)
    else console.log('✅ Deleted all market_anomalies')

    // 4. Count after
    const { count: hAfter } = await supabase.from('trading_history').select('*', { count: 'exact', head: true })
    const { count: aAfter } = await supabase.from('market_anomalies').select('*', { count: 'exact', head: true })
    console.log(`\nAfter: trading_history = ${hAfter} rows, market_anomalies = ${aAfter} rows`)
    console.log('\n🎉 DONE! All data has been cleared.')
}

resetAllData()
