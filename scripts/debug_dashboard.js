/**
 * Script Debug Dashboard Logic
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugDashboard() {
    console.log('🔍 Debugging Dashboard Logic...');

    const { data: events, error } = await supabase
        .from('sales_events')
        .select(`
          id,
          product_name,
          external_product_id,
          user_id,
          customer_name,
          customer_email,
          status,
          status_abordagem, 
          value,
          created_at,
          platform_origin,
          recovery_status,
          recovered_at,
          lead_profile:leads_profiles(id, lead_score, service_status, potential_value)
        `)
        .eq('user_id', USER_ID);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    console.log(`Total events: ${events.length}`);

    const uniqueLeadProfiles = Array.from(
        new Map(
            events
                .filter(e => e.lead_profile)
                .map(e => [e.lead_profile.id, e.lead_profile])
        ).values()
    );

    console.log(`Unique profiles joined: ${uniqueLeadProfiles.length}`);

    if (uniqueLeadProfiles.length > 0) {
        console.log('\nSample Profiles:');
        uniqueLeadProfiles.forEach(p => {
            console.log(`- Score: ${p.lead_score} (${typeof p.lead_score}), Status: ${p.service_status}, Value: ${p.potential_value}`);
        });
    }

    const hotLeads = uniqueLeadProfiles.filter(profile =>
        profile.lead_score >= 80 &&
        ['pending', 'contacted'].includes(profile.service_status)
    );

    console.log(`\nHot Leads Counted: ${hotLeads.length}`);
}

debugDashboard();
