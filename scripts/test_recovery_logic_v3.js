
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRecovery() {

    // 0. Use concrete ID
    const userId = '90d0d014-e2ea-499f8-9fb1-d17b662fa43f';
    console.log('Using UserID:', userId);

    // 1. Create a "manual" status
    const email = 'bruno2@recupera.com';

    // Create Profile as Contacted
    const { data: profileArgs, error } = await supabase.from('leads_profiles').upsert({
        user_id: userId,
        email: email,
        name: 'Bruno Recuperado 2',
        service_status: 'contacted',
        lead_score: 50,
        last_interaction_at: new Date().toISOString()
    }, { onConflict: 'user_id, email' }).select().single();

    if (error) console.error('Supabase Error:', error);

    const profile = profileArgs;
    if (!profile) { console.error('Failed to create profile'); return; }

    console.log('Profile Created/Updated:', profile);

    // 2. Simulate Webhook Logic (Fetching again)
    const { data: currentProfile } = await supabase
        .from('leads_profiles')
        .select('*')
        .eq('id', profile.id)
        .single();

    if (!currentProfile) { console.error('FATAL: Could not fetch updated profile'); return; }

    console.log(`[Webhook] Verificando ROI para: ${currentProfile.email} | Status Atual: ${currentProfile.service_status}`);

    // Verificar se é ROI válido (Case insensitive)
    const checkIsRecovery = (p) => {
        return p?.service_status?.toLowerCase() === 'contacted';
    };

    const isRoiValid = checkIsRecovery(currentProfile);
    console.log('Is ROI Valid?', isRoiValid);
}

testRecovery();
