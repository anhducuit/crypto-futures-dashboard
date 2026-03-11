
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function checkWinRates() {
    console.log('=== CHECKING BOT SETTINGS (target_symbols) ===')
    const { data: settings } = await supabase
        .from('bot_settings')
        .select('key, value')
        .eq('key', 'target_symbols')
        .single()
    
    if (settings) {
        console.log('Configured symbols:', JSON.stringify(settings.value))
        console.log('Total symbols:', Array.isArray(settings.value) ? settings.value.length : 'N/A')
    } else {
        console.log('No target_symbols setting found, using DEFAULT_SYMBOLS')
    }

    console.log('\n=== WIN RATE PER COIN (ALL TIME) ===')
    
    // Fetch all completed trades
    let allData = []
    let page = 0
    const pageSize = 10000
    let hasMore = true

    while (hasMore) {
        const { data, error } = await supabase
            .from('trading_history')
            .select('symbol, status, signal')
            .in('status', ['SUCCESS', 'FAILED'])
            .neq('signal', 'NEUTRAL')
            .order('created_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) { console.error('Error:', error.message); break }
        if (data && data.length > 0) {
            allData = [...allData, ...data]
            if (data.length < pageSize) hasMore = false
            else page++
        } else {
            hasMore = false
        }
    }

    console.log(`Total completed trades: ${allData.length}`)

    // Group by symbol
    const stats = {}
    allData.forEach(t => {
        if (!stats[t.symbol]) stats[t.symbol] = { wins: 0, losses: 0, total: 0 }
        stats[t.symbol].total++
        if (t.status === 'SUCCESS') stats[t.symbol].wins++
        else stats[t.symbol].losses++
    })

    // Sort by win rate
    const sorted = Object.entries(stats)
        .map(([symbol, s]) => ({
            symbol,
            wins: s.wins,
            losses: s.losses,
            total: s.total,
            winRate: ((s.wins / s.total) * 100).toFixed(1)
        }))
        .sort((a, b) => parseFloat(a.winRate) - parseFloat(b.winRate))

    console.log('\n--- ALL COINS (sorted by win rate, lowest first) ---')
    console.log('Symbol'.padEnd(12) + 'Win'.padStart(5) + 'Loss'.padStart(6) + 'Total'.padStart(7) + 'WinRate'.padStart(9))
    console.log('-'.repeat(39))
    
    sorted.forEach(s => {
        const flag = parseFloat(s.winRate) < 30 ? ' ⚠️ DƯỚI 30%' : ''
        console.log(
            s.symbol.padEnd(12) +
            String(s.wins).padStart(5) +
            String(s.losses).padStart(6) +
            String(s.total).padStart(7) +
            (s.winRate + '%').padStart(9) +
            flag
        )
    })

    const under30 = sorted.filter(s => parseFloat(s.winRate) < 30)
    console.log(`\n⚠️ Coins dưới 30% win rate: ${under30.length}`)
    under30.forEach(s => console.log(`  - ${s.symbol}: ${s.winRate}% (${s.wins}W / ${s.losses}L / ${s.total} total)`))
}

checkWinRates()
