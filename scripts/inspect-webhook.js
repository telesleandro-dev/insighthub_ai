
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.TEST_USER_ID;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
    console.log('🧐 Inspecionando dados recentes...');

    // 1. Ver Webhooks Log
    const { data: logs, error: logError } = await supabase
        .from('webhooks_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (logError) console.error('❌ Erro logs:', logError.message);
    else {
        console.log('\n--- ÚLTIMOS LOGS DE WEBHOOK ---');
        console.table(logs.map(l => ({
            platform: l.platform,
            status: l.status,
            created_at: l.created_at,
            payload: JSON.stringify(l.payload).substring(0, 50) + '...'
        })));
    }

    // 2. Ver Leads Profiles
    const { data: leads, error: leadsError } = await supabase
        .from('leads_profiles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (leadsError) console.error('❌ Erro leads:', leadsError.message);
    else {
        console.log('\n--- LEADS NO BANCO ---');
        console.table(leads.map(l => ({
            name: l.name,
            email: l.email,
            service_status: l.service_status,
            potential: l.potential_value
        })));
    }
}

inspect();
