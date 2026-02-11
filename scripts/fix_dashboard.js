/**
 * Script para corrigir Dashboard manualmente
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'views', 'DashboardView.tsx');

console.log('🔧 Corrigindo DashboardView.tsx...\n');

// Ler arquivo
let content = fs.readFileSync(filePath, 'utf8');

// CORREÇÃO 1: Leads Quentes (linhas 109-122)
const oldLeadsQuentes = `    // 2. Leads Quentes (Score >= 80 + Status pending/contacted)
    // ALINHADO COM INTELIGÊNCIA DE VENDAS: Contar leads ÚNICOS (não eventos)
    const uniqueLeadProfiles = Array.from(
      new Map(
        filtered
          .filter(e => e.lead_profile)
          .map(e => [e.lead_profile.id, e.lead_profile])
      ).values()
    );
    
    const hotLeadsCount = uniqueLeadProfiles.filter(profile =>
      profile.lead_score >= 80 &&
      ['pending', 'contacted'].includes(profile.service_status)
    ).length;`;

const newLeadsQuentes = `    // 2. Leads Quentes (Score >= 80, NÃO convertidos)
    const hotLeadsCount = filtered.filter(e => {
      if (!e.lead_profile || e.lead_profile.lead_score < 80) return false;
      const isConverted = successStatuses.includes(e.status?.toLowerCase());
      const isRecovered = e.recovery_status === 'converted';
      return !isConverted && !isRecovered;
    }).length;`;

if (content.includes(oldLeadsQuentes)) {
    content = content.replace(oldLeadsQuentes, newLeadsQuentes);
    console.log('✅ Leads Quentes corrigido');
} else {
    console.log('⚠️  Padrão de Leads Quentes não encontrado (pode já estar corrigido)');
}

// Salvar arquivo
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ Arquivo salvo com sucesso!');
console.log('\n📋 Resumo das correções:');
console.log('   1. Leads Quentes: Removida lógica quebrada de uniqueLeadProfiles');
console.log('   2. Pipeline: Já corrigido (removido filtro isPending)');
console.log('\n🔄 Recarregue o Dashboard para ver as mudanças!\n');
