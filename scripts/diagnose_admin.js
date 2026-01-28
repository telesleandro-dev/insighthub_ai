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

async function diagnose() {
    console.log('\n=== DIAGNÓSTICO COMPLETO DO ADMIN ===\n');

    // 1. Listar todos os usuários do Auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const admin = users.find(u => u.email === 'admin@insighthub.ai');

    if (!admin) {
        console.error('❌ Usuário admin@insighthub.ai NÃO ENCONTRADO no Auth!');
        return;
    }

    console.log('✅ Usuário encontrado no Auth:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Metadata: ${JSON.stringify(admin.user_metadata)}`);

    // 2. Verificar perfil na tabela profiles
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', admin.id)
        .single();

    if (error) {
        console.error(`❌ Erro ao buscar perfil: ${error.message}`);
        return;
    }

    if (!profile) {
        console.error('❌ Perfil NÃO ENCONTRADO na tabela profiles!');
        return;
    }

    console.log('\n✅ Perfil encontrado na tabela profiles:');
    console.log(`   ID: ${profile.id}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Nome: ${profile.name}`);
    console.log(`   ROLE: ${profile.role}`);
    console.log(`   Handle: ${profile.insighthub_email}`);

    // 3. Verificar se a role é exatamente 'admin'
    if (profile.role === 'admin') {
        console.log('\n✅ ROLE CONFIRMADA COMO "admin" (correto!)');
    } else {
        console.log(`\n❌ PROBLEMA: Role é "${profile.role}" ao invés de "admin"!`);
    }

    console.log('\n=== FIM DO DIAGNÓSTICO ===\n');
}

diagnose();
