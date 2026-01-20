
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tnmagcatofooeshzdhac.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSettings() {
    console.log('--- BOT SETTINGS ---');
    const { data: settings, error } = await supabase.from('bot_settings').select('*');
    if (error) {
        console.error('Error:', error.message);
        return;
    }
    settings.forEach(s => console.log(`${s.key}: ${s.value}`));

    console.log('\n--- MANUAL SCAN TEST ---');
    try {
        const res = await fetch('https://tnmagcatofooeshzdhac.supabase.co/functions/v1/check-trades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const text = await res.text();
        console.log('Response Status:', res.status);
        console.log('Response Body:', text.substring(0, 500));
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

checkSettings();
