const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://kslrgyhcfkgbkbjimfay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzbHJneWhjZmtnYmtiamltZmF5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU2NTY1MywiZXhwIjoyMDg0MTQxNjUzfQ.1IWguc9g3rYVTV-r83vECCxsJ6dRNRIpgbc1GI6OyAc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectFile() {
    const { data: events } = await supabase
        .from('sales_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    fs.writeFileSync('temp_inspect.json', JSON.stringify(events, null, 2));
    console.log('✅ temp_inspect.json escrito.');
}

inspectFile();
