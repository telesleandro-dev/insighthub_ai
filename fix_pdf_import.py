# Corrigir import do pdf-parse

file_path = r"c:\Users\leandro.teles\Desktop\projetos\insighthub_ ai\src\app\api\knowledge\extract\route.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Substituir imports problemáticos
old_imports = """import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';"""

new_imports = """import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Imports de bibliotecas que não têm export default correto
const pdf = require('pdf-parse');
const mammoth = require('mammoth');"""

if old_imports.replace('\r\n', '\n') in content.replace('\r\n', '\n'):
    content = content.replace(old_imports, new_imports)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Imports do pdf-parse e mammoth corrigidos!")
else:
    print("⚠️ Imports não encontrados exatamente. Tentando alternativa...")
    # Tentar replace individual
    if "import pdf from 'pdf-parse';" in content:
        content = content.replace(
            "import pdf from 'pdf-parse';",
            "const pdf = require('pdf-parse');"
        )
        content = content.replace(
            "import mammoth from 'mammoth';",
            "const mammoth = require('mammoth');"
        )
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Imports corrigidos (individual)!")
    else:
        print("❌ Não consegui encontrar os imports!")
