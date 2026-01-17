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
        console.log("PAYMENT WEBHOOK RECEIVED:", JSON.stringify(body));

        // 1. Get transaction info from multiple possible fields
        const content = body.content || "";
        const description = body.description || "";
        const code = body.code || "";
        const subAccount = body.subAccount || "";

        // Combine all text fields to search for the code
        const fullText = `${content} ${description} ${code} ${subAccount}`;
        console.log("Full searching text:", fullText);

        // Dynamic regex to find REG-xxxx or REGxxxx or just xxxx
        const txMatch = fullText.match(/REG-?\d+/);
        if (!txMatch) {
            console.error("No REG code found in payload");
            return new Response(JSON.stringify({ error: "No REG code found", payload: body }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let txCode = txMatch[0];
        // Ensure format is REG-xxxx for DB query (in case it came as REGxxxx)
        if (txCode.startsWith('REG') && !txCode.includes('-')) {
            txCode = txCode.replace('REG', 'REG-');
        }

        console.log("Searching for txCode:", txCode);

        // 2. Find registration
        const { data: reg, error: fetchError } = await supabaseClient
            .from('user_registrations')
            .select('*')
            .eq('tx_code', txCode)
            .eq('payment_status', 'pending')
            .single();

        if (fetchError || !reg) {
            console.error("Registration not found or already paid:", txCode, fetchError);
            return new Response(JSON.stringify({ error: "Registration not found", txCode }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // 3. Update status
        const { error: updateError } = await supabaseClient
            .from('user_registrations')
            .update({ payment_status: 'completed' })
            .eq('id', reg.id);

        if (updateError) console.error("Update status error:", updateError);

        // 4. Create Auth User
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
            email: reg.email,
            password: reg.password_hash,
            email_confirm: true
        });

        if (authError) {
            console.error("AUTH CREATION ERROR:", authError);
        } else {
            console.log("Auth user created successfully:", reg.email);
        }

        // 5. Notifications
        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
        const adminEmail = "anhduc541996@gmail.com";
        const amount = body.transferAmount || body.amount || 0;

        if (botToken && chatId) {
            const msg = `💰 **THANH TOÁN THÀNH CÔNG**\n\n👤 User: ${reg.email}\n💵 Số tiền: ${amount}đ\n🔑 Mã: ${txCode}\n🚀 Trạng thái: **Đã cấp tài khoản tự động**.`;
            await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
            });
        }

        const resendKey = Deno.env.get('RESEND_API_KEY');
        if (resendKey) {
            try {
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
                        html: `<h1>Thanh toán thành công!</h1><p>Tài khoản <b>${reg.email}</b> đã được kích hoạt mã <b>${txCode}</b>.</p>`
                    })
                });
            } catch (e) {
                console.error("Resend error:", e);
            }
        }

        return new Response(JSON.stringify({ success: true, email: reg.email }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        console.error("GLOBAL ERROR:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
