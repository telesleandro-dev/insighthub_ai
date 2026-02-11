/**
 * Testar qual campo está causando erro 400
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const USER_ID = 'c048be53-fff6-4446-a8b8-6abf79fce171';

// Cliente COM autenticação de serviço (bypass RLS)
const supabaseService = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cliente SEM autenticação (mesmo que frontend)
const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
    console.log('\n🔍 TESTE: Identificar causa do erro 400\n');

    // 1. Testar com SERVICE_ROLE (bypass RLS)
    console.log('1. Teste com SERVICE_ROLE (bypass RLS)...\n');

    const { data: test1, error: error1 } = await supabaseService
        .from('user_configs')
        .upsert({
            user_id: USER_ID,
            ai_tone: 'persuasivo',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error1) {
        console.log('❌ FALHOU com SERVICE_ROLE:', error1.message);
        console.log('   Hint:', error1.hint);
        console.log('   Details:', error1.details);
    } else {
        console.log('✅ FUNCIONOU com SERVICE_ROLE!');
    }

    // 2. Testar com ANON_KEY (mesmo que frontend)
    console.log('\n2. Teste com ANON_KEY (mesmo que frontend)...\n');

    const { data: test2, error: error2 } = await supabaseAnon
        .from('user_configs')
        .upsert({
            user_id: USER_ID,
            ai_tone: 'consultivo',
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

    if (error2) {
        console.log('❌ FALHOU com ANON_KEY:', error2.message);
        console.log('   Código:', error2.code);
        console.log('   Hint:', error2.hint);
        console.log('   Details:', error2.details);
        console.log('\n💡 DIAGNÓSTICO: Problema de RLS (Row Level Security)!');
        console.log('   Solução: Adicionar política RLS para permitir UPDATE');
    } else {
        console.log('✅ FUNCIONOU com ANON_KEY!');
        console.log('   Problema não é RLS');
    }

    // 3. Testar campo por campo
    console.log('\n3. Testando campos individualmente...\n');

    const campos = [
        { user_id: USER_ID },
        { user_id: USER_ID, ai_tone: 'persuasivo' },
        { user_id: USER_ID, ai_tone: 'persuasivo', telegram_enabled: true },
        { user_id: USER_ID, ai_tone: 'persuasivo', telegram_token: '' },
        { user_id: USER_ID, ai_tone: 'persuasivo', telegram_chat_id: '' },
    ];

    for (let i = 0; i < campos.length; i++) {
        const payload = { ...campos[i], updated_at: new Date().toISOString() };
        const { error } = await supabaseService
            .from('user_configs')
            .upsert(payload, { onConflict: 'user_id' });

        if (error) {
            console.log(`❌ Teste ${i + 1} FALHOU:`, Object.keys(payload));
            console.log(`   Erro: ${error.message}`);
            break;
        } else {
            console.log(`✅ Teste ${i + 1} passou:`, Object.keys(payload));
        }
    }
}

test();
