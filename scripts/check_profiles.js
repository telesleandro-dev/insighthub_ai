const { createClient } = require('@supabase/supabase-js');

const URL = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(URL, SERVICE_KEY);

async function check() {
    const { data: users } = await supabase.auth.admin.listUsers();
    console.log(`Users in auth.users: ${users.length}`);

    const { data: profiles, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('❌ Error reading profiles table:', error.message);
        return;
    }

    console.log(`Rows in public.profiles: ${profiles.length}`);
    profiles.forEach(p => {
        console.log(`- Profile ID: ${p.id}, Email: ${p.email}, Role: ${p.role}`);
    });
}

check();
