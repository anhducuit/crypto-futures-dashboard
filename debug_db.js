
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

    // 2. Try select with new columns
    const { data, error: selectErr } = await supabase
        .from('trading_history')
        .select('id, symbol, pnl_reason, strategy_name')
        .limit(1)

    if (selectErr) {
        console.error('Select with new columns Error:', selectErr.message)
        if (selectErr.message.includes('column') && selectErr.message.includes('does not exist')) {
            console.log('CRITICAL: New columns are missing in the database!')
        }
    } else {
        console.log('Select successful. Sample data:', data)
    }
}

debug()
