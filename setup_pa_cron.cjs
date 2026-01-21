// Setup Price Action Bot Cron Job
// Run: node setup_pa_cron.cjs

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tnmagcatofooeshzdhac.supabase.co';
const supabaseKey = 'sb_secret_AE9jk6pbcyFQRS-rSCFjzQ_DRJ5f4Xj'; // Service role key
const anonKey = 'sb_publishable_8M9n5vsFXwrzf39f0oY9DA_uByjBK4g';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCronJob() {
    console.log('🔧 Setting up Price Action Bot cron job...\n');

    try {
        // 1. Enable pg_cron extension
        console.log('1. Enabling pg_cron extension...');
        const { error: extError } = await supabase.rpc('exec_sql', {
            sql: 'CREATE EXTENSION IF NOT EXISTS pg_cron;'
        });

        if (extError) {
            console.log('   Note: Extension might already exist or need manual enable');
        } else {
            console.log('   ✅ pg_cron enabled');
        }

        // 2. Create cron job
        console.log('\n2. Creating cron job...');
        const cronSQL = `
            SELECT cron.schedule(
                'price-action-bot-scan',
                '*/5 * * * *',
                $$
                SELECT
                    net.http_post(
                        url:='${supabaseUrl}/functions/v1/price-action-bot',
                        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${anonKey}"}'::jsonb
                    ) as request_id;
                $$
            );
        `;

        const { data, error } = await supabase.rpc('exec_sql', { sql: cronSQL });

        if (error) {
            console.error('   ❌ Error:', error.message);
            console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
            console.log(cronSQL);
        } else {
            console.log('   ✅ Cron job created successfully!');
            console.log('   📅 Schedule: Every 5 minutes');
        }

        // 3. Verify cron job
        console.log('\n3. Verifying cron job...');
        const { data: jobs, error: jobError } = await supabase
            .from('cron.job')
            .select('*')
            .eq('jobname', 'price-action-bot-scan');

        if (jobs && jobs.length > 0) {
            console.log('   ✅ Cron job verified!');
            console.log('   Job details:', jobs[0]);
        } else {
            console.log('   ⚠️ Could not verify cron job (might need manual check)');
        }

        // 4. Test invoke function
        console.log('\n4. Testing Price Action Bot function...');
        const response = await fetch(`${supabaseUrl}/functions/v1/price-action-bot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${anonKey}`
            }
        });

        const result = await response.json();
        console.log('   Function response:', result);

        if (result.success) {
            console.log(`   ✅ Function works! Found ${result.signalsFound} signals`);
        } else {
            console.log('   ⚠️ Function returned error:', result.error);
        }

        console.log('\n✅ Setup complete!');
        console.log('\n📊 Next steps:');
        console.log('   1. Wait 5 minutes for first cron run');
        console.log('   2. Check signals: SELECT * FROM price_action_signals ORDER BY created_at DESC LIMIT 10;');
        console.log('   3. Check webapp: Scroll to "🎯 Price Action Bot" panel');

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        console.log('\n📝 Manual setup required. Run this SQL in Supabase SQL Editor:');
        console.log(`
SELECT cron.schedule(
  'price-action-bot-scan',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url:='${supabaseUrl}/functions/v1/price-action-bot',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${anonKey}"}'::jsonb
    ) as request_id;
  $$
);
        `);
    }
}

setupCronJob();
