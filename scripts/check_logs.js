
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogs() {
    console.log('--- Checking Webhook Logs ---');

    // Test Insert (Commented out to isolate SELECT)
    /*
    const { error: insertError } = await supabase.from('webhooks_log').insert({
        platform: 'test_script',
        status: 'debug_entry',
        user_id: '90d0d014-e2ea-499f-9fb1-d17b662fa43f'
    });
    if (insertError) console.error('Test Insert Error:', JSON.stringify(insertError, null, 2));
    */

    const { data: logs, error } = await supabase
        .from('webhooks_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) console.error('Select Error:', JSON.stringify(error, null, 2));

    if (error) console.error(error);
    else {
        logs.forEach(log => {
            console.log(`[${log.created_at}] Status: ${log.status} | Platform: ${log.platform}`);
            if (log.status === 'error') {
                console.log('   ERROR:', log.error_message);
                console.log('   Context:', log.payload?.error_context);
            }
            if (log.payload?._debug_roi_valid !== undefined) {
                console.log(`   ROI Check: ${log.payload._debug_roi_valid} | Profile Status: ${log.payload._debug_profile_status}`);
            }
        });
    }
}

checkLogs();
