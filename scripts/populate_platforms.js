
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function populatePlatforms() {
    console.log('--- Populating Supported Platforms ---');

    // Clear existing to avoid conflicts or half-states
    await supabase.from('supported_platforms').delete().neq('name', 'placeholder_impossible');

    const platforms = [
        { name: 'kiwify', display_name: 'Kiwify', requires_signature: false, documentation_url: 'https://developers.kiwify.com.br/webhooks' },
        { name: 'hotmart', display_name: 'Hotmart', requires_signature: true, documentation_url: 'https://developers.hotmart.com/docs/pt-BR/v1/webhooks/' },
        { name: 'eduzz', display_name: 'Eduzz', requires_signature: false, documentation_url: 'https://atendimento.eduzz.com/portal/pt-br/kb/articles/webhooks' },
        { name: 'monetizze', display_name: 'Monetizze', requires_signature: false, documentation_url: 'https://docs.monetizze.com.br/webhooks' },
        { name: 'insighthub', display_name: 'InsightHub', requires_signature: false, documentation_url: '' }
    ];

    // Use upsert to be safe
    const { error } = await supabase.from('supported_platforms').upsert(platforms, { onConflict: 'name' });

    if (error) console.error('Error populating platforms:', error);
    else console.log('✅ Platforms Populated.');
}

populatePlatforms();
