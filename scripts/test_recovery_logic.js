
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRecovery() {
    // 1. Create a "manual" status
    const email = 'bruno@recupera.com';

    // Create Profile as Contacted
    const { data: profile } = await supabase.from('leads_profiles').upsert({
        user_id: '5f9a623a-3453-4888-8869-7756f6723381',
        email: email,
        name: 'Bruno Recuperado',
        service_status: 'contacted',
        lead_score: 50
    }, { onConflict: 'user_id, email' }).select().single();

    console.log('Profile Created/Updated:', profile);

    // 2. Simulate Webhook
    console.log('--- Simulating Webhook Logic ---');
    const currentProfile = profile;

    const checkIsRecovery = (p) => {
        return p?.service_status === 'contacted';
    };

    const isRoiValid = checkIsRecovery(currentProfile);
    console.log('Is ROI Valid?', isRoiValid);

    const newServiceStatus = isRoiValid ? 'converted' : 'direct_sale';
    console.log('New Service Status:', newServiceStatus);

}

testRecovery();
