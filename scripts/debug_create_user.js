
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCreate() {
    console.log('Debugging User Creation...');
    const userId = '90d0d014-e2ea-499f-9fb1-d17b662fa43f';
    const email = 'test_setup@insighthub.ai';

    // 1. Try Create
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        uid: userId, // Explicitly request this ID
        email: email,
        password: 'password123',
        email_confirm: true
    });

    if (createError) {
        console.error('Create Error:', createError.message);

        // 2. If already exists, fetch by email
        if (createError.message.includes('already registered')) {
            console.log('User exists. Fetching by email...');
            // admin.listUsers? No, no filtering by email directly widely supported in listUsers? 
            // Better: admin.listUsers() and find? Or just assume ID mismatch?

            // I'll leave it as error for now, because "User not found" by ID implies ID mismatch if email exists.

            // Try to delete user by email? No API for that.
            // Try listUsers to find the email.
            const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
            if (listData && listData.users) {
                const found = listData.users.find(u => u.email === email);
                if (found) {
                    console.log('Found User by Email!');
                    console.log('Expected ID:', userId);
                    console.log('Actual   ID:', found.id);
                } else {
                    console.log('User NOT found in listUsers either (weird if create says registered).');
                }
            }
        }
    } else {
        console.log('User Created Successfully!');
        console.log('Returned ID:', createData.user.id);
        console.log('Requested ID:', userId);
    }
}

debugCreate();
