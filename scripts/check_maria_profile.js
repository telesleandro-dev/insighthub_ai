const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMariaProfile() {
    console.log('--- VERIFICANDO PERFIL (MARIA) ---');
    const { data: profile, error } = await supabase
        .from('leads_profiles')
        .select('*')
        .eq('email', 'maria.direta@teste.com')
        .single();

    if (error) {
        console.error(error);
    } else {
        console.log(JSON.stringify(profile, null, 2));
    }
}

checkMariaProfile();
