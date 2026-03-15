import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearDB() {
    console.log("Clearing all data from trading_history...");
    
    // Use a timestamp condition that effectively matches all past records
    const { data, error } = await supabase
        .from('trading_history')
        .delete()
        .lt('created_at', new Date().toISOString()); 
    
    if (error) {
        console.error("Error clearing DB:", error);
    } else {
        console.log("✅ Database cleared successfully. You can now monitor the bot from scratch.");
    }
}

clearDB();
