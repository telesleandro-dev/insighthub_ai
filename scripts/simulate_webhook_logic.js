
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Business Logic Simulation
async function processWebhookLogic(userId, payload) {
    console.log('--- Simulating Webhook Logic ---');

    // 1. Identify User (Skipping Auth Check - Assuming Valid ID)
    const email = payload.Customer.email;
    const status = payload.status; // 'refused', 'paid'
    const productName = payload.product_name;
    const value = payload.value;
    const transactionId = payload.transaction_id || `TX-${Date.now()}`;

    // 2. Upsert Profile
    // Logic from route.ts: upsert based on email
    let { data: profile } = await supabase.from('leads_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('email', email)
        .maybeSingle();

    if (!profile) {
        console.log('Creating new profile...');
        const { data: newProfile, error } = await supabase.from('leads_profiles').insert({
            user_id: userId,
            email: email,
            name: payload.Customer.name,
            phone: payload.Customer.mobile,
            service_status: status === 'paid' ? 'converted' : 'pending',
            lead_score: status === 'paid' ? 0 : 50,
            last_event_type: status,
            potential_value: status !== 'paid' ? value : 0,
            converted_value: status === 'paid' ? value : 0
        }).select().single();

        if (error) throw error;
        profile = newProfile;
    } else {
        console.log(`Updating profile ${profile.id} (Status: ${profile.service_status})...`);

        // ROI CHECK LOGIC
        let isRoiValid = false;
        let recoveryStatus = 'organic'; // default

        if (status === 'paid' && profile.service_status === 'contacted') {
            isRoiValid = true;
            recoveryStatus = 'converted';
            console.log('💰 ROI DETECTED: Contacted -> Paid');
        } else if (status === 'paid') {
            console.log('ℹ️ Organic Sale: Status was ' + profile.service_status);
        }

        const updates = {
            last_event_type: status,
            // If paid, converted. If refused, ensure pending IF NOT contacted.
            // Rule: Don't overwrite 'contacted' with 'pending' on failure
            last_interaction_at: new Date().toISOString()
        };

        if (status === 'paid') {
            updates.service_status = 'converted';
            updates.lead_score = 0;
            updates.converted_value = value;
            updates.potential_value = 0;
        } else if (status === 'refused' || status === 'abandoned') {
            if (profile.service_status !== 'contacted') {
                updates.service_status = 'pending';
            }
            updates.potential_value = value;
        }

        const { error: updateError } = await supabase.from('leads_profiles')
            .update(updates)
            .eq('id', profile.id);

        if (updateError) throw updateError;

        // 3. Insert Sales Event
        if (status === 'paid' || status === 'refused') {
            const event = {
                user_id: userId,
                lead_profile_id: profile.id,
                product_name: productName,
                customer_email: email,
                customer_name: payload.Customer.name,
                status: status,
                value: value,
                platform_origin: 'Kiwify (Sim)',
                external_transaction_id: transactionId,
                recovery_status: status === 'paid' ? recoveryStatus : null,
                status_abordagem: status === 'paid' ? (recoveryStatus === 'converted' ? 'recuperado' : 'organico') : null,
                converted_at: new Date().toISOString()
            };

            const { error: eventError } = await supabase.from('sales_events').insert(event);
            if (eventError) console.error('Sales Event Error:', eventError);
            else console.log('✅ Sales Event Inserted');
        }
    }
}

// Test Runner
async function runSimulation() {
    const USER_ID = 'dfe126ac-0bb0-46d9-9d4a-938a22044a4f';
    const email = `sim_${Date.now()}@test.com`;

    try {
        console.log(`\n🧪 TEST SCENARIO: Recovery Loop (${email})`);

        // 1. Refused
        await processWebhookLogic(USER_ID, {
            status: 'refused', value: 1000, product_name: 'Mentoria',
            Customer: { email, name: 'Sim User', mobile: '11999999999' }
        });

        // 2. Manual Contact
        console.log('📞 Manually contacting lead...');
        const { data: p1 } = await supabase.from('leads_profiles').select('id').eq('email', email).single();
        await supabase.from('leads_profiles').update({ service_status: 'contacted' }).eq('id', p1.id);

        // 3. Paid
        await processWebhookLogic(USER_ID, {
            status: 'paid', value: 1000, product_name: 'Mentoria',
            transaction_id: `PAY-${Date.now()}`,
            Customer: { email, name: 'Sim User', mobile: '11999999999' }
        });

        // Verify
        const { data: events } = await supabase.from('sales_events').select('*').eq('customer_email', email);
        const paidEvent = events.find(e => e.status === 'paid');

        if (paidEvent && paidEvent.recovery_status === 'converted') {
            console.log('\n✅ SIMULATION PASSED: ROI Correctly Calculated');
        } else {
            console.error('\n❌ SIMULATION FAILED');
            console.log('Event:', paidEvent);
        }

    } catch (e) {
        console.error('Critical Error:', e);
    }
}

runSimulation();
