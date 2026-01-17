import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const body = await req.json();
        console.log("PAYMENT WEBHOOK RECEIVED:", body);

        // LOGIC MATCHING (Example for SePay/Casso webhook)
        // SePay sends: { content: "REG-1234 ...", transferAmount: 250000, ... }
        const description = body.content || body.description || "";
        const amount = body.transferAmount || body.amount || 0;

        // 1. Find the registration by tx_code in the description
        const txMatch = description.match(/REG-\d{4}/);
        if (!txMatch) {
            return new Response(JSON.stringify({ error: "No REG code found" }), { status: 400 });
        }

        const txCode = txMatch[0];

        const { data: reg, error: fetchError } = await supabaseClient
            .from('user_registrations')
            .select('*')
            .eq('tx_code', txCode)
            .eq('payment_status', 'pending')
            .single();

        if (fetchError || !reg) {
            return new Response(JSON.stringify({ error: "Registration not found or already paid" }), { status: 404 });
        }

        // 2. Mark as completed
        await supabaseClient
            .from('user_registrations')
            .update({ payment_status: 'completed' })
            .eq('id', reg.id);

        // 3. Create actual Supabase Auth user
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
            email: reg.email,
            password: reg.password_hash,
            email_confirm: true
        });

        if (authError) {
            console.error("AUTH CREATION ERROR:", authError);
        }

        // 4. Send Telegram Notification to Owner
        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
        const adminEmail = "anhduc541996@gmail.com";

        const msg = `💰 **THANH TOÁN THÀNH CÔNG**\n\n👤 User: ${reg.email}\n💵 Số tiền: ${amount}đ\n🔑 Mã: ${txCode}\n🚀 Trạng thái: **Đã cấp tài khoản tự động**. Bạn không cần làm gì thêm.`;

        if (botToken && chatId) {
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
            });
        }

        // 5. Send Email via Resend (To Admin & User)
        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (resendKey) {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${resendKey}`
                },
                body: JSON.stringify({
                    from: 'Anh Duc Trader <system@trading.anhduc.pro>',
                    to: [adminEmail, reg.email],
                    subject: `[KÍCH HOẠT] Tài khoản ${reg.email} đã được mở`,
                    html: `
                        <h1>Thanh toán thành công!</h1>
                        <p>Chào <b>${reg.email}</b>,</p>
                        <p>Hệ thống đã nhận được khoản thanh toán cho mã <b>${txCode}</b>.</p>
                        <p>Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể đăng nhập ngay bây giờ.</p>
                        <hr/>
                        <p><i>Thông báo tự động từ Hệ thống Anh Duc Trader</i></p>
                    `
                })
            });
        }

        return new Response(JSON.stringify({ success: true, email: reg.email }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
