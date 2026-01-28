
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Carregar .env.local manualmente
let env: { [key: string]: string } = {};
try {
    const envPath = path.resolve(__dirname, '.env.local');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
} catch (e) {
    console.error("Erro ao ler .env.local", e);
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Credenciais do Supabase não encontradas no arquivo .env.local.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    console.log("🔍 Testando permissão de UPDATE na tabela 'sales_events'...");

    // 1. Pegar um lead qualquer
    const { data: leads, error: fetchError } = await supabase
        .from('sales_events')
        .select('id, status_abordagem')
        .limit(1);

    if (fetchError) {
        console.error("❌ Erro ao buscar leads (Leitura):", fetchError);
        return;
    }

    if (!leads || leads.length === 0) {
        console.warn("⚠️ Tabela vazia, não é possível testar UPDATE.");
        return;
    }

    const lead = leads[0];
    console.log(`📝 Tentando atualizar lead ${lead.id}...`);

    // 2. Tentar atualizar
    const { data, error: updateError } = await supabase
        .from('sales_events')
        .update({ status_abordagem: 'contatado' })
        .eq('id', lead.id)
        .select();

    if (updateError) {
        console.error("❌ FALHA AO ATUALIZAR (Provável RLS):");
        console.error(JSON.stringify(updateError, null, 2));

        if (updateError.code === '42501') {
            console.log("\n🚨 CONFIRMADO: Erro de Permissão (RLS Policy Violada).");
            console.log("O usuário anônimo ou logado não tem permissão de UPDATE nesta tabela.");
        }
    } else {
        console.log("✅ Atualização bem sucedida! RLS parece estar OK.");
        // Reverter
        await supabase.from('sales_events').update({ status_abordagem: lead.status_abordagem }).eq('id', lead.id);
    }
}

testUpdate();
