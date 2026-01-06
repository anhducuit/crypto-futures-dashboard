import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const supabase = createClient(supabaseUrl, supabaseKey)

        // 1. Fetch PENDING trades
        const { data: trades, error: fetchError } = await supabase
            .from('trading_history')
            .select('*')
            .eq('status', 'PENDING')

        if (fetchError) throw fetchError
        if (!trades || trades.length === 0) {
            return new Response(JSON.stringify({ message: 'No pending trades' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        const updates = []

        // Group trades by symbol to minimize API calls
        const grouped = trades.reduce((acc, trade) => {
            acc[trade.symbol] = acc[trade.symbol] || []
            acc[trade.symbol].push(trade)
            return acc
        }, {})

        // 2. Check each symbol against Binance
        for (const symbol of Object.keys(grouped)) {
            try {
                // Fetch klines for Audit (Last 1000 candles ~ 16 hours)
                const klineRes = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1m&limit=1000`)
                const klineData = await klineRes.json()

                if (!Array.isArray(klineData)) continue

                const candles = klineData.map((c) => ({
                    high: parseFloat(c[2]),
                    low: parseFloat(c[3]),
                    closeTime: c[6]
                }))

                // Fetch Current Price (Ticker)
                const tickerRes = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`)
                const tickerData = await tickerRes.json()
                const currentPrice = parseFloat(tickerData.price)

                for (const trade of grouped[symbol]) {
                    const tradeTime = new Date(trade.created_at).getTime()
                    let newStatus = 'PENDING'

                    // A. Immediate Neutral Check
                    if (trade.signal === 'NEUTRAL') {
                        newStatus = 'SUCCESS'
                    }
                    else {
                        // B. Historical Audit (Wicks)
                        const relevantCandles = candles.filter(c => c.closeTime >= tradeTime)

                        for (const c of relevantCandles) {
                            if (trade.signal === 'LONG') {
                                if (c.high >= trade.target_price) { newStatus = 'SUCCESS'; break; }
                                if (c.low <= trade.stop_loss) { newStatus = 'FAILED'; break; }
                            } else if (trade.signal === 'SHORT') {
                                if (c.low <= trade.target_price) { newStatus = 'SUCCESS'; break; }
                                if (c.high >= trade.stop_loss) { newStatus = 'FAILED'; break; }
                            }
                        }

                        // C. Real-time Check (if audit didn't catch it)
                        if (newStatus === 'PENDING') {
                            if (trade.signal === 'LONG') {
                                if (currentPrice >= trade.target_price) newStatus = 'SUCCESS'
                                else if (currentPrice <= trade.stop_loss) newStatus = 'FAILED'
                            } else if (trade.signal === 'SHORT') {
                                if (currentPrice <= trade.target_price) newStatus = 'SUCCESS'
                                else if (currentPrice >= trade.stop_loss) newStatus = 'FAILED'
                            }
                        }
                    }

                    // D. Push Update
                    if (newStatus !== 'PENDING') {
                        updates.push({ id: trade.id, status: newStatus, symbol: trade.symbol })

                        await supabase
                            .from('trading_history')
                            .update({ status: newStatus })
                            .eq('id', trade.id)
                    }
                }

            } catch (innerErr) {
                console.error(`Error processing ${symbol}:`, innerErr)
            }
        }

        return new Response(JSON.stringify({
            message: 'Check complete',
            processed: trades.length,
            updates: updates
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
