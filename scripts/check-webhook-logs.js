
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function checkWebhookLogs() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: logs, error } = await supabase
        .from('webhooks_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        fs.writeFileSync('webhook_inspection.txt', 'Erro: ' + error.message);
        return;
    }

    let output = '📜 Últimos 10 logs de webhook:\n\n';
    logs.forEach((log, i) => {
        output += `--- Log #${i + 1} (${log.platform}) ---\n`;
        output += `ID: ${log.id}\n`;
        output += `Data: ${log.created_at}\n`;
        output += `Status: ${log.status}\n`;
        output += `Payload: ${JSON.stringify(log.payload, null, 2)}\n`;
        if (log.error_message) output += `Erro: ${log.error_message}\n`;
        output += '\n' + '='.repeat(40) + '\n\n';
    });

    fs.writeFileSync('webhook_inspection.txt', output);
    console.log('✅ Logs salvos em webhook_inspection.txt');
}

checkWebhookLogs();
