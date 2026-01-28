const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars (run with node --env-file=.env.local)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllUsers() {
    console.log(`Listing all users in project: ${supabaseUrl}`);
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    if (data.users.length === 0) {
        console.log('NO users found in Auth table.');
    } else {
        console.log(`Found ${data.users.length} users:`);
        data.users.forEach(u => {
            console.log(`- ${u.email} (ID: ${u.id}, Confirmed: ${!!u.confirmed_at})`);
        });
    }
}

listAllUsers();
