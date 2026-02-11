
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

// Config
const API_URL = 'http://localhost:3000/api/webhook/unified';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = 'dfe126ac-0bb0-46d9-9d4a-938a22044a4f'; // Validated Auth User ID

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to build Kiwify-like payload
function buildPayload(email, status, value, transactionId) {
    return {
        product_name: 'Mentoria',
        Customer: {
            email: email,
            name: 'Test Setup User',
            mobile: '+5511999999999'
        },
        status: status,
        value: value,
        transaction_id: transactionId,
        store_id: 'test_store'
    };
}

// Helper to send webhook
async function sendWebhook(payload) {
    try {
        const urlObj = new URL(API_URL);
        urlObj.searchParams.set('user_id', USER_ID);
        const fullUrl = urlObj.toString();
        // console.log('   Calling URL:', fullUrl); 

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { raw: text };
        }

        return { status: response.status, data };
    } catch (e) {
        return { status: 500, error: e.message };
    }
}

// Helper to get profile
async function getProfile(email) {
    const { data } = await supabase.from('leads_profiles').select('*').eq('email', email).maybeSingle();
    return data;
}

// Helper to get events
async function getEvents(email) {
    const { data } = await supabase.from('sales_events').select('*').eq('customer_email', email).order('created_at', { ascending: true });
    return data || [];
}

async function runTests() {
    try {
        console.log('🚀 Starting Business Rules Tests...');
        console.log(`Target User ID: ${USER_ID}`);

        // --- SCENARIO 1: RECOVERY (Refused -> Contacted -> Paid) ---
        console.log('\n🧪 TEST 1: Recovery Loop (Refused -> Contacted -> Paid)');
        const email1 = `recovery_${Date.now()}@test.com`;

        // 1. Send Refused
        const res0 = await sendWebhook(buildPayload(email1, 'refused', 1000, `REF-1-${Date.now()}`));
        console.log('   Webhook Refused Response:', res0);

        // 2. Manual Update to 'contacted'
        let p1 = await getProfile(email1);
        if (!p1) { console.error('❌ P1: Profile not created'); }
        else {
            await supabase.from('leads_profiles').update({ service_status: 'contacted' }).eq('id', p1.id);
            console.log('   Updated status to contacted.');
        }

        // 3. Send Paid
        const res1 = await sendWebhook(buildPayload(email1, 'paid', 1000, `REC-1-${Date.now()}`));

        // Verify
        p1 = await getProfile(email1);
        const events1 = await getEvents(email1);
        const paidEvent1 = events1.find(e => e.status === 'paid');

        if (p1?.service_status === 'converted' && paidEvent1?.recovery_status === 'converted') {
            console.log('✅ TEST 1 PASSED: Marked as Converted / ROI Valid');
        } else {
            console.error('❌ TEST 1 FAILED');
            console.log('   Profile Status:', p1?.service_status);
            console.log('   Event Recovery Status:', paidEvent1?.recovery_status);
            console.log('   Webhook Response:', res1.data);
        }


        /*
    // --- SCENARIO 2: ORGANIC (Refused -> No Verify -> Paid) ---
    console.log('\n🧪 TEST 2: Organic Loop (Refused -> Paid without contact)');
    const email2 = `organic_${Date.now()}@test.com`;

    // 1. Send Refused
    await sendWebhook({
        platform: 'Kiwify', name: 'Organic Test', email: email2, product_name: 'Mentoria',
        value: 1000, status: 'refused', transaction_id: `REF-2-${Date.now()}`
    });

    // 2. Send Paid (Immediately)
    await sendWebhook({
        platform: 'Kiwify', name: 'Organic Test', email: email2, product_name: 'Mentoria',
        value: 1000, status: 'paid', transaction_id: `REC-2-${Date.now()}`
    });

    // Verify
    const p2 = await getProfile(email2);
    const events2 = await getEvents(email2);
    const paidEvent2 = events2.find(e => e.status === 'paid');

    if (p2?.service_status === 'direct_sale' && paidEvent2?.recovery_status === 'organic') {
        console.log('✅ TEST 2 PASSED: Marked as Direct Sale / ROI Organic');
    } else {
        console.error('❌ TEST 2 FAILED');
        console.log('   Profile Status:', p2?.service_status);
        console.log('   Event Recovery Status:', paidEvent2?.recovery_status);
    }


    // --- SCENARIO 3: STATUS PERSISTENCE (Refused -> Contacted -> Refused Again) ---
    console.log('\n🧪 TEST 3: Status Persistence (Refused -> Contacted -> Refused)');
    const email3 = `persist_${Date.now()}@test.com`;

    // 1. Send Refused
    await sendWebhook({
        platform: 'Kiwify', name: 'Persist Test', email: email3, product_name: 'Mentoria',
        value: 1000, status: 'refused', transaction_id: `REF-3A-${Date.now()}`
    });

    // 2. Manual Update to 'contacted'
    let p3 = await getProfile(email3);
    await supabase.from('leads_profiles').update({ service_status: 'contacted' }).eq('id', p3.id);

    // 3. Send Refused Again (New failure)
    await sendWebhook({
        platform: 'Kiwify', name: 'Persist Test', email: email3, product_name: 'Mentoria',
        value: 1000, status: 'refused', transaction_id: `REF-3B-${Date.now()}`
    });

    // Verify
    p3 = await getProfile(email3);
    
    if (p3?.service_status === 'contacted') {
        console.log('✅ TEST 3 PASSED: Status remained "contacted"');
    } else {
        console.error('❌ TEST 3 FAILED');
        console.log('   Profile Status:', p3?.service_status);
    }


    // --- SCENARIO 4: NEW ORGANIC IGNORED ---
    console.log('\n🧪 TEST 4: New Organic Ignored (Paid -> Unknown Lead)');
    const email4 = `unknown_${Date.now()}@test.com`;

    // 1. Send Paid directly
    const res4 = await sendWebhook({
        platform: 'Kiwify', name: 'Unknown Test', email: email4, product_name: 'Mentoria',
        value: 1000, status: 'paid', transaction_id: `PAID-4-${Date.now()}`
    });

    // Verify
    const p4 = await getProfile(email4);
    
    if (!p4) {
        console.log('✅ TEST 4 PASSED: Profile NOT created');
    } else {
        console.error('❌ TEST 4 FAILED');
        console.log('   Profile Created:', p4);
    }
    */
    } catch (error) {
        console.error('\n❌ CRITICAL TEST FAILURE:', error);
    }
}

runTests();
