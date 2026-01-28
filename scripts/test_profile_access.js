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
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Simular o cliente do navegador
const supabase = createClient(URL, ANON_KEY);

async function testProfileAccess() {
    console.log('\n=== TESTE DE ACESSO AO PERFIL (como navegador) ===\n');

    // 1. Fazer login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@insighthub.ai',
        password: 'admin123'
    });

    if (authError) {
        console.error('❌ Erro no login:', authError.message);
        return;
    }

    console.log('✅ Login bem-sucedido');
    console.log(`   User ID: ${authData.user.id}`);

    // 2. Tentar buscar o perfil (exatamente como o useAuth faz)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (profileError) {
        console.error('❌ ERRO ao buscar perfil:', profileError.message);
        console.error('   Code:', profileError.code);
        console.error('   Details:', profileError.details);
        console.error('   Hint:', profileError.hint);
    } else {
        console.log('✅ Perfil recuperado com sucesso!');
        console.log('   Nome:', profile.name);
        console.log('   Role:', profile.role);
        console.log('   Email:', profile.email);
    }

    console.log('\n=== FIM DO TESTE ===\n');
}

testProfileAccess();
