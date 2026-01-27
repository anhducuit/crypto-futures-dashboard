
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function debug() {
    console.log('--- Database Audit: Last 24 Hours ---')

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // 1. Total signals in 24h
    const { data: signals, error } = await supabase
        .from('trading_history')
        .select('id, symbol, strategy_name, signal, timeframe, created_at, status')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch Error:', error)
        return
    }

    console.log(`Total signals in last 24h: ${signals.length}`)

    // 2. Group by Strategy
    const strategyStats = signals.reduce((acc, s) => {
        const name = s.strategy_name || 'Unknown'
        acc[name] = (acc[name] || 0) + 1
        return acc
    }, {})
    console.log('\nSignals by Strategy:')
    console.table(strategyStats)

    // 3. Group by Symbol
    const symbolStats = signals.reduce((acc, s) => {
        acc[s.symbol] = (acc[s.symbol] || 0) + 1
        return acc
    }, {})
    console.log('\nSignals by Symbol:')
    console.table(symbolStats)

    // 4. Check for duplicates in small time windows (e.g., same symbol, same strategy, within 5 mins)
    console.log('\nChecking for potential spam (same symbol + strategy within 5 mins)...')
    let spamCount = 0
    for (let i = 0; i < signals.length - 1; i++) {
        const s1 = signals[i]
        const s2 = signals[i + 1]
        const diff = Math.abs(new Date(s1.created_at).getTime() - new Date(s2.created_at).getTime())
        if (s1.symbol === s2.symbol && s1.strategy_name === s2.strategy_name && diff < 5 * 60 * 1000) {
            spamCount++
            if (spamCount < 10) {
                console.log(`Potential Spam: ${s1.symbol} - ${s1.strategy_name} at ${s1.created_at} and ${s2.created_at}`)
            }
        }
    }
    console.log(`Total potential spam cases found: ${spamCount}`)
}

debug()
