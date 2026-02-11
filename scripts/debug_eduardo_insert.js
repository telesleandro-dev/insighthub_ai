
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugEduardoInsert() {
    console.log('--- Debugging Eduardo Insert ---');

    const userId = '90d0d014-e2ea-499f-9fb1-d17b662fa43f';
    const email = 'edu@cartao.com';

    // 1. Get Profile ID
    const { data: profile } = await supabase.from('leads_profiles').select('id').eq('email', email).single();
    if (!profile) { console.error('Profile not found for Eduardo'); return; }

    console.log('Profile ID:', profile.id);

    // 2. Try Insert Paid Event (Mimicking Route)
    const eventData = {
        user_id: userId,
        lead_profile_id: profile.id,
        product_name: 'Mentoria',
        external_product_id: 'PROD-123',
        customer_email: email,
        customer_name: 'Eduardo Recusado',
        customer_phone: '',
        status: 'paid',
        value: 997.00,
        platform_origin: 'kiwify', // Normalized
        external_transaction_id: 'REC-005', // Unique
        status_abordagem: 'recuperado',
        recovery_status: 'converted',
        converted_at: new Date().toISOString()
    };

    console.log('Attempting Insert:', eventData);

    const { data, error } = await supabase.from('sales_events').insert(eventData).select();

    if (error) {
        console.error('❌ Insert Error (Check error_debug.txt)');
        require('fs').writeFileSync('error_debug.txt', JSON.stringify(error, null, 2));
    } else {
        console.log('✅ Insert Success:', data);
    }
}

debugEduardoInsert();
