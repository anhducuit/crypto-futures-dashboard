
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function checkBot() {
    // 1. Check heartbeat
    const { data: heartbeat } = await supabase.from('bot_settings').select('value').eq('key', 'last_scan_at').single()
    if (heartbeat) {
        const lastScan = new Date(heartbeat.value)
        const diff = (Date.now() - lastScan.getTime()) / 1000
        const vnTime = new Date(lastScan.getTime() + 7 * 60 * 60 * 1000)
        console.log(`Last scan: ${vnTime.toISOString().replace('T', ' ').slice(0, 19)} (VN)`)
        console.log(`Seconds ago: ${diff.toFixed(0)}s`)
        console.log(`Bot status: ${diff < 300 ? '✅ ONLINE' : '❌ OFFLINE (>5 min)'}`)
    } else {
        console.log('❌ No heartbeat found')
    }

    // 2. Check if any new signals have been created after reset
    const { data: recent, count } = await supabase
        .from('trading_history')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5)

    console.log(`\nTotal trades after reset: ${count}`)
    if (recent && recent.length > 0) {
        console.log('Latest signals:')
        recent.forEach(t => {
            const vnTime = new Date(new Date(t.created_at).getTime() + 7 * 60 * 60 * 1000)
            console.log(`  ${t.trade_id || 'N/A'} | ${t.symbol} ${t.signal} | ${t.status} | ${vnTime.toISOString().slice(0, 19)}`)
        })
    } else {
        console.log('No new signals yet (data was just cleared)')
    }

    // 3. Check allowed settings
    const { data: settings } = await supabase.from('bot_settings').select('key, value').in('key', ['allowed_timeframes', 'target_symbols'])
    if (settings) {
        settings.forEach(s => console.log(`\nSetting [${s.key}]: ${JSON.stringify(s.value)}`))
    }
}

checkBot()
