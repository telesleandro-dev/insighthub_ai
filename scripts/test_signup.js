
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Admin key to delete user if needed
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
    console.log('--- Testing Signup ---');
    const email = `signup_test_${Date.now()}@test.com`;
    const password = 'password123';

    // 1. SignUp (Client-side simulation)
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
    });

    if (authError) {
        console.error('Signup Error:', authError);
        return;
    }

    const userId = authData.user?.id;
    console.log('User Signed Up:', userId);

    if (!userId) {
        console.error('No User ID returned');
        return;
    }

    // 2. Check if user exists in public.users?
    // We can't query public.users easily if RLS is on and we are admin (admin bypasses RLS).
    // Let's try to insert a profile immediately using this ID.

    console.log('Attempting Profile Creation...');
    const { data: profile, error: profileError } = await supabase.from('leads_profiles').insert({
        user_id: userId,
        email: 'lead_for_signup@test.com',
        name: 'Lead Test',
        service_status: 'contacted',
        last_interaction_at: new Date().toISOString()
    }).select().single();

    if (profileError) {
        console.error('Profile Creation Failed:', profileError);
    } else {
        console.log('✅ Profile Created Successfully! User ID is valid in public context.');
    }
}

testSignup();
