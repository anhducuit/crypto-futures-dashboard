
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const secret = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);

    // Setup Webhook Action (Run once)
    if (url.searchParams.get('setup') === 'true') {
      const webhookUrl = 'https://tnmagcatofooeshzdhac.supabase.co/functions/v1/telegram-bot';
      const res = await fetch(`https://api.telegram.org/bot${secret}/setWebhook?url=${webhookUrl}`);
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Setup Commands Action
    if (url.searchParams.get('setup_commands') === 'true') {
      const commands = [
        { command: 'menu', description: 'Hiển thị Menu điều khiển' },
        { command: '1m', description: 'Bật/Tắt khung 1 Phút' },
        { command: '15m', description: 'Bật/Tắt khung 15 Phút' },
        { command: '1h', description: 'Bật/Tắt khung 1 Giờ' },
        { command: '4h', description: 'Bật/Tắt khung 4 Giờ' },
        { command: 'all', description: 'Bật tất cả khung' },
        { command: 'scalp', description: 'Chỉ khung 1 Phút' },
        { command: 'swing', description: 'Khung 15m, 1h, 4h' }
      ];
      const res = await fetch(`https://api.telegram.org/bot${secret}/setMyCommands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Handle Telegram Update
    const update = await req.json();

    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();
      let responseText = '';

      // 1. Fetch current settings
      let { data: settings } = await supabase
        .from('bot_settings')
        .select('value')
        .eq('key', 'allowed_timeframes')
        .single();

      let allowed = settings?.value || ['15m', '1h', '4h']; // Default

      // 2. Process Commands
      if (text === '/start' || text === '/menu') {
        responseText = `🤖 **Trading Bot Config Menu**\n\n` +
          `Active Timeframes: \`${allowed.join(', ')}\`\n\n` +
          `**Available Commands:**\n` +
          `/1m - Toggle 1m (Scalp)\n` +
          `/15m - Toggle 15m (Day Trade)\n` +
          `/1h - Toggle 1h (Swing)\n` +
          `/4h - Toggle 4h (Trend)\n` +
          `/all - Enable All timeframes\n` +
          `/scalp - Only 1m signals\n` +
          `/swing - 15m, 1h, 4h signals\n` +
          `/menu - Show this menu`;
      } else if (['/1m', '/15m', '/1h', '/4h'].includes(text)) {
        const tf = text.substring(1); // Remove /
        if (allowed.includes(tf)) {
          allowed = allowed.filter(t => t !== tf);
          responseText = `❌ Disabled **${tf}** signals.`;
        } else {
          allowed.push(tf);
          responseText = `✅ Enabled **${tf}** signals.`;
        }
      } else if (text === '/all') {
        allowed = ['1m', '15m', '1h', '4h'];
        responseText = `✅ Enabled **ALL** timeframes.`;
      } else if (text === '/scalp') {
        allowed = ['1m'];
        responseText = `⚡ Switched to **SCALP ONLY (1m)**.`;
      } else if (text === '/swing') {
        allowed = ['15m', '1h', '4h'];
        responseText = `🌊 Switched to **SWING (15m, 1h, 4h)**.`;
      } else {
        return new Response('ok', { headers: corsHeaders }); // Ignore non-commands
      }

      // 3. Save Settings
      const { error } = await supabase
        .from('bot_settings')
        .upsert({ key: 'allowed_timeframes', value: allowed }, { onConflict: 'key' });

      if (error) console.error('Error saving settings:', error);

      // 4. Send Reply
      await fetch(`https://api.telegram.org/bot${secret}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText + `\n\nActive: [${allowed.join(', ')}]`,
          parse_mode: 'Markdown'
        })
      });
    }

    return new Response('ok', { headers: corsHeaders });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
})
