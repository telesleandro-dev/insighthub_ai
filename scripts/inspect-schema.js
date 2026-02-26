const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTable(tableName) {
    try {
        const { data, error } = await supabase.from(tableName).select('*').limit(1);
        if (error) return { table: tableName, error: error.message };
        if (data && data.length > 0) {
            return { table: tableName, columns: Object.keys(data[0]) };
        }
        return { table: tableName, status: 'Empty' };
    } catch (err) {
        return { table: tableName, error: err.message };
    }
}

async function run() {
    const tables = [
        'user_configs',
        'leads_profiles',
        'sales_events',
        'knowledge_files',
        'webhooks_log',
        'user_platform_configs',
        'supported_platforms',
        'inbox_messages'
    ];

    const results = [];
    for (const table of tables) {
        console.log(`Inspecting ${table}...`);
        const result = await inspectTable(table);
        results.push(result);
    }

    fs.writeFileSync('database_inspection.json', JSON.stringify(results, null, 2));
    console.log('Inspection complete. Results saved to database_inspection.json');
}

run();
