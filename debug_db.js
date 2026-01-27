
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function debug() {
    console.log('Checking trading_history table...')

    // 1. Try simple count
    const { count, error: countErr } = await supabase
        .from('trading_history')
        .select('*', { count: 'exact', head: true })

    if (countErr) {
        console.error('Count Error:', countErr)
    } else {
        console.log('Total rows in trading_history:', count)
    }

    // 2. Search for the specific trade IDs
    const ids = ['BTC-2WG0', 'BTC-04JG', 'BTC-641I'];
    const { data, error: selectErr } = await supabase
        .from('trading_history')
        .select('*')
        .in('trade_id', ids)

    if (selectErr) {
        console.error('Search Error:', selectErr.message)
    } else {
        console.log('Signals Details:', JSON.stringify(data, null, 2))
    }
}

debug()
