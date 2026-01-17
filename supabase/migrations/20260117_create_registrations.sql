-- Create user_registrations table to track pending signups
CREATE TABLE IF NOT EXISTS public.user_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Store actual hash if possible, or temporary marker
    payment_status TEXT DEFAULT 'pending', -- pending, completed
    tx_code TEXT UNIQUE, -- Unique code for payment matching (e.g., REG 1234)
    amount_expected DECIMAL(10,2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_registrations ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (anyone can start registration)
CREATE POLICY "Anyone can create a registration" 
ON public.user_registrations FOR INSERT 
WITH CHECK (true);

-- Allow public to select their own registration by email (for status check)
CREATE POLICY "Users can see their own registration" 
ON public.user_registrations FOR SELECT 
USING (true); -- We will filter by email in the UI

-- Allow service role to manage everything
CREATE POLICY "Service role can manage all" 
ON public.user_registrations FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');
