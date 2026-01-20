import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function repair() {
    console.log('--- REPAIRING TRADE IDENTIFIERS ---');

    const { data: records, error } = await supabase
        .from('trading_history')
        .select('id, symbol, trade_id')
        .or('trade_id.is.null,trade_id.eq.""');

    if (error) {
        console.error('Error fetching records:', error.message);
        return;
    }

    console.log(`Found ${records.length} records to repair.`);

    for (const record of records) {
        const shortId = Math.random().toString(36).substring(2, 6).toUpperCase();
        const tradeId = `${record.symbol.replace('USDT', '')}-${shortId}`;

        const { error: updErr } = await supabase
            .from('trading_history')
            .update({ trade_id: tradeId })
            .eq('id', record.id);

        if (updErr) {
            console.error(`Failed to update ${record.id}:`, updErr.message);
        } else {
            console.log(`Updated ${record.symbol} -> ${tradeId}`);
        }
    }

    console.log('Repair complete!');
}

repair();
