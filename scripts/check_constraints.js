
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraints() {
    console.log('--- Checking Sales Events Constraints ---');
    // We can't query information_schema easily, so we try to insert a minimal event and see what fails
    // But since the previous insert hangs, maybe it's a trigger?

    // Let's try to query current triggers
    // Or just try a very minimal insert that should fail fast

    const userId = '90d0d014-e2ea-499f-9fb1-d17b662fa43f';
    const emailRef = `constraint_test_${Date.now()}@test.com`;

    console.log('Inserting minimal event...');
    const { data, error } = await supabase.from('sales_events').insert({
        user_id: userId,
        customer_email: emailRef,
        status: 'test',
        platform_origin: 'kiwify'
    });

    if (error) console.error('Insert Error:', error);
    else console.log('Insert Success (unexpected if we are debugging failure)');
}

checkConstraints();
