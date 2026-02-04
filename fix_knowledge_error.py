# Adicionar try/catch ao getKnowledgeContext

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\app\api\ai\recuperar\route.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Código antigo (sem try/catch)
old_code = """    const tomDeVoz = configData?.ai_tone || 'consultivo';

    // 3. Buscar contexto da Base de Conhecimento
    const knowledgeContext = await getKnowledgeContext(lead.user_id, lead.product_id);
    const hasKnowledge = knowledgeContext.trim().length > 0;

    // 4. Inicializa Gemini SDK"""

# Código novo (com try/catch)
new_code = """    const tomDeVoz = configData?.ai_tone || 'consultivo';

    // 3. Buscar contexto da Base de Conhecimento (não crítico - não deve quebrar se falhar)
    let knowledgeContext = '';
    let hasKnowledge = false;
    
    try {
      knowledgeContext = await getKnowledgeContext(lead.user_id, lead.product_id);
      hasKnowledge = knowledgeContext.trim().length > 0;
      console.log(`📚 [Recuperar] Conhecimento: ${hasKnowledge ? `${knowledgeContext.length} chars` : 'vazio'}`);
    } catch (knowledgeError: any) {
      console.warn('⚠️ [Recuperar] Erro ao buscar conhecimento (continuando sem ele):', knowledgeError.message);
      // Continue sem conhecimento - não é crítico
    }

    // 4. Inicializa Gemini SDK"""

if old_code in content:
    content = content.replace(old_code, new_code)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Try/catch adicionado ao getKnowledgeContext!")
else:
    print("⚠️ Código não encontrado!")

