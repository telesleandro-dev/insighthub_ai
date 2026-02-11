
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL(query) {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    if (error) {
        // console.error('SQL Error:', error);
        return { error };
    }
    return { data };
}

async function testRecovery() {
    console.log('--- Starting Full Test ---');

    // 1. Create Auth User
    const emailRef = `test_${Date.now()}@insighthub.ai`;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: emailRef,
        password: 'password123',
        email_confirm: true
    });

    if (authError) { console.error('Auth User Error:', authError); return; }
    const userId = authData.user.id;
    console.log('Auth User Created:', userId);

    // 2. Try to Sync to public.users (raw SQL to avoid schema cache issues)
    // We try to insert. If table doesn't exist, it will fail.
    const syncQuery = `
        INSERT INTO public.users (id, email, name) 
        VALUES ('${userId}', '${emailRef}', 'Test User') 
        ON CONFLICT (id) DO NOTHING;
    `;
    const { error: syncError } = await runSQL(syncQuery);
    if (syncError) {
        console.log('Sync to public.users failed (expected if table missing or RPC disabled):', syncError.message);
        // If it failed because relation "public.users" does not exist, then we assume leads_profiles refers to auth.users
        // BUT we got error saying it refers to "users". So maybe the fk is to auth.users and I am confused?
        // Let's verify the FK definition.
    } else {
        console.log('Sync to public.users executed (if table exists).');
    }

    // 3. Create Profile
    const leadEmail = `lead_${Date.now()}@test.com`;
    console.log('Creating Profile for:', leadEmail);

    const { data: profile, error: profileError } = await supabase.from('leads_profiles').upsert({
        user_id: userId,
        email: leadEmail,
        name: 'Bruno Recuperado Test',
        service_status: 'contacted', // MANUAL ACTION SIMULATION
        lead_score: 50,
        last_interaction_at: new Date().toISOString()
    }, { onConflict: 'user_id, email' }).select().single();

    if (profileError) {
        console.error('FATAL: Profile Creation Error:', profileError);
        return;
    }
    console.log('Profile Created:', profile.id, profile.service_status);

    // 4. Simulate Webhook
    // The webhook code I modified does:
    // 1. Fetch current profile
    // 2. checkIsRecovery(freshProfile)

    const { data: freshProfile } = await supabase.from('leads_profiles').select('*').eq('id', profile.id).single();

    console.log(`[Webhook Simulation] Validating ROI for ${freshProfile.email}`);
    console.log(`[Webhook Simulation] Current Status: '${freshProfile.service_status}'`);

    // Exact logic from route.ts
    const checkIsRecovery = (p) => {
        return p?.service_status?.toLowerCase() === 'contacted';
    };

    const isRoiValid = checkIsRecovery(freshProfile);
    console.log('[Webhook Simulation] isRoiValid Result:', isRoiValid);

    if (isRoiValid) {
        console.log('✅ SUCCESS: System recognizes recovery possibility.');
    } else {
        console.error('❌ FAILURE: System DENIES recovery.');
    }
}

testRecovery();
