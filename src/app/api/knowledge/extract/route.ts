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
                // PDF - Import dinâmico
                console.log('📄 [Extração] Processando PDF:', fileData.file_name);

                const pdfParse = (await import('pdf-parse')).default;
                const pdfData = await pdfParse(buffer);
                extractedText = pdfData.text;

                console.log('✅ [Extração] PDF processado:', extractedText.length, 'chars');
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
