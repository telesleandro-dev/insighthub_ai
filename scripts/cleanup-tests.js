
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis do .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const userId = process.env.TEST_USER_ID;

if (!supabaseUrl || !supabaseServiceKey || !userId) {
    console.error('❌ Erro: Variáveis de ambiente ou TEST_USER_ID não encontrados no .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanup() {
    console.log(`🧹 Iniciando limpeza de dados para o usuário: ${userId}...`);

    try {
        // 1. Limpar logs de webhooks
        const { error: logError } = await supabase
            .from('webhooks_log')
            .delete()
            .eq('user_id', userId);

        if (logError) console.error('⚠️ Erro ao limpar webhooks_log:', logError.message);
        else console.log('✅ webhooks_log limpo.');

        // 2. Limpar eventos de vendas
        const { error: salesError } = await supabase
            .from('sales_events')
            .delete()
            .eq('user_id', userId);

        if (salesError) console.error('⚠️ Erro ao limpar sales_events:', salesError.message);
        else console.log('✅ sales_events limpo.');

        // 3. Limpar perfis de leads
        const { error: leadsError } = await supabase
            .from('leads_profiles')
            .delete()
            .eq('user_id', userId);

        if (leadsError) console.error('⚠️ Erro ao limpar leads_profiles:', leadsError.message);
        else console.log('✅ leads_profiles limpo.');

        console.log('\n✨ Base de dados de teste limpa com sucesso! Tudo pronto para novos testes.');
    } catch (err) {
        console.error('❌ Erro inesperado durante a limpeza:', err);
    }
}

cleanup();
