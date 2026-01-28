const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (!fs.existsSync(envPath)) return;
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
                process.env[key] = value;
            }
        });
    } catch (e) { }
}

loadEnv();

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(URL, SERVICE_KEY);

async function dump() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error(error);
        return;
    }
    fs.writeFileSync('profiles_dump.json', JSON.stringify(data, null, 2));
    console.log('Dumped to profiles_dump.json');
}

dump();
