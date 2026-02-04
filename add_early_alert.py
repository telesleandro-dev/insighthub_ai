# Adicionar alert ANTES do upload ao Storage

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\components\views\ConfiguracoesView.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Adicionar alert LOGO NO INÍCIO do handleFileUpload
old_line = "    setUploading(true);\n    try {\n      // Upload para Storage"
new_code = """    setUploading(true);
    alert('DEBUG 1: handleFileUpload iniciado!');
    try {
      alert('DEBUG 2: Vai fazer upload para Storage');
      // Upload para Storage"""

if old_line in content:
    content = content.replace(old_line, new_code)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Alerts no início adicionados!")
else:
    print("⚠️ Não encontrado. Tentando com \\r\\n...")
    old_line_r = "    setUploading(true);\r\n    try {\r\n      // Upload para Storage"
    new_code_r = """    setUploading(true);\r
    alert('DEBUG 1: handleFileUpload iniciado!');\r
    try {\r
      alert('DEBUG 2: Vai fazer upload para Storage');\r
      // Upload para Storage"""
    
    if old_line_r in content:
        content = content.replace(old_line_r, new_code_r)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("✅ Alerts adicionados (com \\r\\n)!")
    else:
        print("❌ Não consegui encontrar o local!")
