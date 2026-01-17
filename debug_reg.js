const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkReg() {
    console.log("Checking user_registrations table...");
    const { data, error } = await supabase
        .from('user_registrations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error("Error fetching registrations:", error);
    } else {
        console.table(data);
    }
}

checkReg();
