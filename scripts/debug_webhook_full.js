
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateWebhook() {
    console.log('--- Simulating Webhook POST ---');

    // 1. Create a User and User Config (Required for API Key check)
    // We'll reuse the user we synced earlier or create new

    // Ensure user exists (using the ID we know works)
    const userId = '90d0d014-e2ea-499f-9fb1-d17b662fa43f';
    const emailRef = `test_${Date.now()}@insighthub.ai`;

    // Sync user just in case (idempotent)
    await supabase.from('users').upsert({ id: userId, email: emailRef, name: 'Test User' });

    // Create User Platform Config (Crucial for identifying user from webhook if using API Key)
    // The webhook code I saw uses `user_platform_configs` to find user?
    // Let's check route.ts logic again. It uses `x-api-key` header OR `product_id`?
    // Looking at route.ts:
    // It calls `validateWebhookRequest(req)`.
    // If we don't have a platform config, it might fail.

    // Let's first create a platform config for Kiwify
    await supabase.from('user_platform_configs').upsert({
        user_id: userId,
        platform_name: 'kiwify',
        api_key: 'test_api_key',
        is_active: true
    }, { onConflict: 'user_id, platform_name' });

    // 2. Create HEADERS and BODY
    const body = {
        product: { id: 'PROD-123', name: 'Mentoria' },
        Customer: { email: 'bruno_real@test.com', full_name: 'Bruno Real', mobile: '+5511999999999' },
        Commissions: { charge_amount: 99700 }, // Kiwify sends in cents usually, but let's assume route normalizes
        order_status: 'paid',
        payment_method: 'credit_card'
    };

    // We can't easily invoke the Next.js route function directly from node script without mocking Request.
    // Instead, I will REPLICATE the route logic step-by-step here to see where it fails.

    console.log('1. Normalizing Data...');
    const normalizedData = {
        productId: 'PROD-123',
        productName: 'Mentoria',
        amount: 997.00,
        status: 'paid',
        customerEmail: 'bruno_real@test.com',
        customerName: 'Bruno Real',
        customerPhone: '+5511999999999',
        transactionId: `TRANS-${Date.now()}`,
        platform: 'kiwify'
    };

    console.log('2. Finding User...');
    // The route finds user by... ?
    // I need to read the route to know exactly how it finds the user. 
    // Usually it looks up by product_id or just uses the first user?
    // Assuming we have the User ID.

    // 3. Process Profile (Mocking the route logic)

    // 3.1 Check/Create Profile
    // PRE-CONDITION: Create a profile as 'contacted' to test recovery
    const { error: upsertError } = await supabase.from('leads_profiles').upsert({
        user_id: userId,
        email: normalizedData.customerEmail,
        name: normalizedData.customerName,
        service_status: 'contacted', // MANUAL ACTION
        lead_score: 50, // Arbitrary score
        last_interaction_at: new Date().toISOString()
    }, { onConflict: 'user_id, email' });

    if (upsertError) console.error('Upsert Profile Error:', upsertError);

    // 3.2 Fetch Profile (The critical step)
    const { data: currentProfile } = await supabase
        .from('leads_profiles')
        .select('*')
        .eq('email', normalizedData.customerEmail)
        .eq('user_id', userId)
        .single();

    if (!currentProfile) { console.error('Profile not found!'); return; }

    // 3.3 Check ROI Logic
    const { data: freshProfile } = await supabase
        .from('leads_profiles')
        .select('*')
        .eq('id', currentProfile.id)
        .single();

    const profileToCheck = freshProfile || currentProfile;
    console.log(`[Logic Check] Status: ${profileToCheck.service_status}`);

    const isRoiValid = profileToCheck?.service_status?.toLowerCase() === 'contacted';
    console.log(`[Logic Check] Is ROI Valid? ${isRoiValid}`);

    // 3.4 Insert Sales Event
    console.log('3.4 Inserting Sales Event...');
    const { data: event, error: eventError } = await supabase.from('sales_events').insert({
        user_id: userId,
        lead_profile_id: profileToCheck.id,
        customer_email: normalizedData.customerEmail,
        status: normalizedData.status,
        value: normalizedData.amount,
        platform_origin: normalizedData.platform,
        recovery_status: isRoiValid ? 'converted' : 'organic',
        status_abordagem: isRoiValid ? 'recuperado' : 'organico', // Just for logging
        converted_at: new Date().toISOString() // Important for dashboard!
    }).select().single();

    if (eventError) console.error('Insert Event Error:', eventError);
    else console.log('Event Inserted:', event);

}

simulateWebhook();
