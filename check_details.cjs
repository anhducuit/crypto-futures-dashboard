
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkDetails() {
    const { data, error } = await supabase
        .from('trading_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('--- DATABASE IS EMPTY ---');
    } else {
        console.log(`--- FOUND ${data.length} RECORDS ---`);
        data.forEach(d => {
            console.log(`[${d.created_at}] ${d.symbol} | Strategy: ${d.strategy_name} | ID: ${d.id}`);
        });
    }
}

checkDetails();
