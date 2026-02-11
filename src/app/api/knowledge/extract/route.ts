import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
    try {
        const { fileId, userId } = await req.json();

        if (!fileId || !userId) {
            return NextResponse.json({ error: 'fileId e userId são obrigatórios' }, { status: 400 });
        }

        // 1. Buscar informações do arquivo no banco
        const { data: fileData, error: fileError } = await supabase
            .from('knowledge_files')
            .select('*')
            .eq('id', fileId)
            .eq('user_id', userId)
            .single();

        if (fileError || !fileData) {
            return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
        }

        // 2. Marcar como processando
        await supabase
            .from('knowledge_files')
            .update({ processing_status: 'processing' })
            .eq('id', fileId);

        // 3. Baixar arquivo do storage
        const { data: storageData, error: storageError } = await supabase.storage
            .from('knowledge-base')
            .download(fileData.file_path);

        if (storageError || !storageData) {
            throw new Error('Erro ao baixar arquivo do storage');
        }

        // 4. Converter para buffer
        const arrayBuffer = await storageData.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let extractedText = '';

        // 5. Extrair texto baseado no tipo
        try {
            if (fileData.file_type === 'application/pdf') {
                // PDF - Import dinâmico com tratamento robusto de erros
                console.log('📄 [Extração] Processando PDF:', fileData.file_name);

                try {
                    // Tentativa 1: pdf-parse (método padrão, rápido)
                    const pdfParseModule = await import('pdf-parse');
                    const pdfParse = pdfParseModule.default || pdfParseModule;
                    const pdfData = await pdfParse(buffer, {
                        max: 0,  // Sem limite de páginas
                    });
                    extractedText = pdfData.text;
                    console.log('✅ [pdf-parse] PDF processado com sucesso:', extractedText.length, 'chars');
                } catch (pdfError: any) {
                    console.warn('⚠️  [Extração] pdf-parse falhou:', pdfError.message);
                    console.log('💡 [Extração] Tentando extração alternativa (fallback)...');

                    // Tentativa 2: Extração bruta do buffer (fallback para PDFs problemáticos)
                    try {
                        const rawText = buffer.toString('utf8');
                        extractedText = rawText
                            .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')  // Remove caracteres de controle
                            .replace(/\s+/g, ' ')  // Normaliza espaços múltiplos
                            .split('\n')
                            .filter(line => line.trim().length > 0)
                            .join('\n')
                            .trim();

                        // Validar se conseguiu extrair texto útil
                        if (extractedText.length < 50) {
                            throw new Error('Texto extraído muito curto (possivelmente PDF de imagem ou protegido)');
                        }

                        console.log('✅ [Fallback] Extração alternativa bem-sucedida:', extractedText.length, 'chars');
                        console.log('ℹ️  [Fallback] Nota: Formatação pode ter sido perdida no processo');
                    } catch (fallbackError: any) {
                        throw new Error(`PDF corrompido, protegido ou apenas imagens. Detalhes: ${fallbackError.message}`);
                    }
                }
            } else if (
                fileData.file_type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                fileData.file_name.endsWith('.docx')
            ) {
                // DOCX
                console.log('📄 [Extração] Processando DOCX:', fileData.file_name);

                const mammoth = await import('mammoth');
                const result = await mammoth.extractRawText({ buffer });
                extractedText = result.value;

                console.log('✅ [Extração] DOCX processado:', extractedText.length, 'chars');
            } else if (fileData.file_type === 'text/plain' || fileData.file_name.endsWith('.txt')) {
                // TXT
                console.log('📄 [Extração] Processando TXT:', fileData.file_name);
                extractedText = buffer.toString('utf-8');
                console.log('✅ [Extração] TXT processado:', extractedText.length, 'chars');
            } else {
                throw new Error('Tipo de arquivo não suportado');
            }

            // 6. Limitar tamanho (máximo 50.000 caracteres)
            if (extractedText.length > 50000) {
                extractedText = extractedText.substring(0, 50000) + '\n\n[... texto truncado ...]';
            }

            // 7. Salvar texto extraído no banco
            const { error: updateError } = await supabase
                .from('knowledge_files')
                .update({
                    extracted_text: extractedText,
                    processing_status: 'completed',
                    processing_error: null
                })
                .eq('id', fileId);

            if (updateError) throw updateError;

            console.log('✅ [Extração] Salvo no banco com sucesso!');

            return NextResponse.json({
                success: true,
                extractedLength: extractedText.length,
                preview: extractedText.substring(0, 200) + '...'
            });

        } catch (extractError: any) {
            console.error('❌ [Extração] Erro:', extractError);

            // Marcar como falha
            await supabase
                .from('knowledge_files')
                .update({
                    processing_status: 'failed',
                    processing_error: extractError.message
                })
                .eq('id', fileId);

            throw extractError;
        }

    } catch (error: any) {
        console.error('❌ [Extração] Erro geral:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
