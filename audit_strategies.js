
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function audit() {
    console.log('--- Comprehensive Strategy Audit ---')

    const { data: signals, error } = await supabase
        .from('trading_history')
        .select('strategy_name, status, signal')
        .neq('signal', 'NEUTRAL')
        .neq('status', 'PENDING') // Only look at finished trades for win rate

    if (error) {
        console.error('Fetch Error:', error)
        return
    }

    const stats = signals.reduce((acc, s) => {
        const name = s.strategy_name || 'Unknown'
        if (!acc[name]) acc[name] = { total: 0, wins: 0, losses: 0 }
        acc[name].total++
        if (s.status === 'SUCCESS') acc[name].wins++
        else if (s.status === 'FAILED') acc[name].losses++
        return acc
    }, {})

    const report = Object.entries(stats).map(([name, data]) => ({
        'Trường phái': name,
        'Tổng lệnh': data.total,
        'Thắng': data.wins,
        'Thua': data.losses,
        'Win Rate (%)': ((data.wins / data.total) * 100).toFixed(1)
    })).sort((a, b) => b['Tổng lệnh'] - a['Tổng lệnh'])

    console.table(report)

    const total = signals.length
    const wins = signals.filter(s => s.status === 'SUCCESS').length
    console.log(`\nOVERALL WIN RATE: ${((wins / total) * 100).toFixed(1)}% (${wins}/${total})`)
}

audit()
