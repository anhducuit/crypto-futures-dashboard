
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function updateSymbols() {
    console.log('Updating bot_settings targets...');

    const { data: existing } = await supabase
        .from('bot_settings')
        .select('*')
        .eq('key', 'target_symbols')
        .single();

    const newSymbols = ['XAUUSDT', 'XAGUSDT', 'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'NEARUSDT', 'TIAUSDT'];

    if (existing) {
        console.log('Updating existing target_symbols...');
        const { error } = await supabase
            .from('bot_settings')
            .update({ value: newSymbols })
            .eq('id', existing.id);
        if (error) console.error('Error updating:', error);
        else console.log('Successfully updated target_symbols');
    } else {
        console.log('Inserting new target_symbols...');
        const { error } = await supabase
            .from('bot_settings')
            .insert({ key: 'target_symbols', value: newSymbols });
        if (error) console.error('Error inserting:', error);
        else console.log('Successfully inserted target_symbols');
    }
}

updateSymbols();
