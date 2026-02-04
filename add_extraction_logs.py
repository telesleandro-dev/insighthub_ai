# Adicionar logs detalhados e melhorar tratamento de erro do pdf-parse

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\app\api\knowledge\extract\route.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Encontrar e substituir o bloco de extração de PDF
old_pdf_block = """        // 5. Extrair texto baseado no tipo
        try {
            if (fileData.file_type === 'application/pdf') {
                // PDF
                const pdfData = await pdf(buffer);
                extractedText = pdfData.text;"""

new_pdf_block = """        // 5. Extrair texto baseado no tipo
        try {
            if (fileData.file_type === 'application/pdf') {
                // PDF
                console.log('📄 [Extração] Processando PDF:', fileData.file_name);
                console.log('📄 [Extração] Buffer size:', buffer.length, 'bytes');
                console.log('📄 [Extração] pdf function type:', typeof pdf);
                
                const pdfData = await pdf(buffer);
                extractedText = pdfData.text;
                console.log('✅ [Extração] PDF processado, texto:', extractedText.length, 'chars');"""

if old_pdf_block in content:
    content = content.replace(old_pdf_block, new_pdf_block)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Logs detalhados adicionados à API de extração!")
else:
    print("⚠️ Bloco não encontrado!")
