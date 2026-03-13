import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tnmagcatofooeshzdhac.supabase.co';
const supabaseKey = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g'; // Using anon key, hope RLS allows it. If not I need service role key.
// Wait, I can see service role key in process config or other places if I need to. Let's look up .env.example or just run it via Edge Function if RLS fails.
// Let's retrieve service key from edge function config ? I cannot read supabase dashboard.
// I'll try anon key first.
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Deleting CHỈ BÁO THOÁT CHANDELIER records...");
    const { data, error } = await supabase
        .from('trading_history')
        .delete()
        .like('strategy_name', '%CHỈ BÁO THOÁT CHANDELIER%');
    
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Deleted old CE data successfully.", data);
    }
}

run();
