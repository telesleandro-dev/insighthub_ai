
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRefusedFlow() {
    console.log('--- Testing Refused -> Paid Flow ---');

    // 0. Setup User
    const emailRef = `refused_test_${Date.now()}@test.com`;
    // We assume user exists from previous setup or we use the known ID
    const userId = '90d0d014-e2ea-499f-9fb1-d17b662fa43f';

    // 1. Simulate REFUSED Webhook (Manual DB Insert for speed, mirroring webhook result)
    console.log('1. Creating Refused Event...');

    // Create Profile first (Webhook would do this)
    const { data: profile } = await supabase.from('leads_profiles').upsert({
        user_id: userId,
        email: emailRef,
        name: 'Eduardo Recusado Test',
        service_status: 'pending',
        lead_score: 40,
        last_event_type: 'refused',
        product_history: ['Mentoria'],
        last_interaction_at: new Date().toISOString()
    }, { onConflict: 'user_id, email' }).select().single();

    if (!profile) { console.error('FATAL: Failed to create profile (User ID might be invalid)'); return; }

    // Create Refused Event
    const { error: insertRefusedError } = await supabase.from('sales_events').insert({
        user_id: userId,
        lead_profile_id: profile.id,
        customer_email: emailRef,
        status: 'refused', // critical
        value: 997.00,
        platform_origin: 'kiwify',
        external_transaction_id: `REF-${Date.now()}`,
        recovery_status: 'eligible', // It goes to recovery list
        status_abordagem: 'pendente'
    });

    if (insertRefusedError) {
        console.error('FATAL: Refused Event Insert Error:', insertRefusedError);
        return;
    }

    console.log('   Refused Event Created.');

    // 2. Simulate Manual Contact (Usage of WhatsApp)
    console.log('2. Simulating WhatsApp Contact...');
    await supabase.from('leads_profiles').update({
        service_status: 'contacted',
        last_interaction_at: new Date().toISOString()
    }).eq('id', profile.id);

    // 3. Simulate PAID Webhook (Logic Check)
    console.log('3. Simulating PAID Webhook Logic...');

    // 3.1 Fetch Profile (Webhook does this)
    const { data: currentProfile } = await supabase.from('leads_profiles').select('*').eq('id', profile.id).single();

    // 3.2 Check ROI
    const checkIsRecovery = (p) => p?.service_status?.toLowerCase() === 'contacted';
    const isRoiValid = checkIsRecovery(currentProfile);
    console.log(`   isRoiValid: ${isRoiValid}`); // Should be true

    // 3.3 Cleanup Logic
    console.log('   Running Cleanup...');
    // Fetch previous events
    const { data: previousEvents } = await supabase.from('sales_events')
        .select('id')
        .eq('customer_email', emailRef)
        .in('recovery_status', ['eligible', 'pending']);

    console.log(`   Found ${previousEvents.length} events to clean.`);

    // Update them
    if (previousEvents.length > 0) {
        await supabase.from('sales_events').update({
            recovery_status: 'cleared',
            status_abordagem: 'recuperado'
        }).in('id', previousEvents.map(e => e.id));
    }

    // 3.4 Insert PAID Event
    console.log('   Inserting Paid Event...');
    const { data: paidEvent, error: insertError } = await supabase.from('sales_events').insert({
        user_id: userId,
        lead_profile_id: profile.id,
        customer_email: emailRef,
        status: 'paid',
        value: 997.00,
        platform_origin: 'kiwify',
        external_transaction_id: `REC-${Date.now()}`,
        recovery_status: isRoiValid ? 'converted' : 'organic',
        status_abordagem: isRoiValid ? 'recuperado' : 'organico',
        converted_at: new Date().toISOString()
    }).select().single();

    if (insertError) console.error('   Insert Error:', insertError);
    else console.log('   Paid Event Inserted:', paidEvent.recovery_status, paidEvent.value);

    // 4. Verify Dashboard Query
    console.log('4. Verifying Dashboard Query...');
    const { data: dashboardData } = await supabase.from('sales_events')
        .select('value')
        .eq('user_id', userId)
        .eq('recovery_status', 'converted'); // This matches fetchTotalRecovered logic

    const total = dashboardData.reduce((acc, curr) => acc + Number(curr.value), 0);
    console.log('   Total Recovered in DB:', total);

    if (total >= 997) console.log('✅ TEST PASSED: Value is summing.');
    else console.log('❌ TEST FAILED: Value missing.');
}

testRefusedFlow();
