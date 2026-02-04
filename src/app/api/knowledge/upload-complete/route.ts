import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Client com SERVICE_ROLE_KEY (bypass RLS em Storage e Database)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;

        if (!file || !userId) {
            return NextResponse.json({ error: 'Arquivo e userId são obrigatórios' }, { status: 400 });
        }

        console.log('📤 [Upload Completo] Iniciando:', {
            fileName: file.name,
            fileSize: file.size,
            userId
        });

        // 1. Upload para Storage (com SERVICE_ROLE - bypass RLS)
        const timestamp = Date.now();
        const filePath = `knowledge/${userId}/${timestamp}_${file.name}`;

        const { error: storageError } = await supabaseAdmin.storage
            .from('knowledge-base')
            .upload(filePath, file);

        if (storageError) {
            console.error('❌ [Upload Completo] Erro no Storage:', storageError);
            throw new Error(`Storage error: ${storageError.message}`);
        }

        console.log('✅ [Upload Completo] Storage OK:', filePath);

        // 2. Salvar no banco (com SERVICE_ROLE - bypass RLS)
        const { data: insertedFile, error: dbError } = await supabaseAdmin
            .from('knowledge_files')
            .insert({
                user_id: userId,
                file_name: file.name,
                file_path: filePath,
                file_size: file.size,
                file_type: file.type
            })
            .select()
            .single();

        if (dbError) {
            console.error('❌ [Upload Completo] Erro no DB:', dbError);
            // Tentar deletar do storage se o DB falhar
            await supabaseAdmin.storage.from('knowledge-base').remove([filePath]);
            throw new Error(`Database error: ${dbError.message}`);
        }

        console.log('✅ [Upload Completo] Sucesso! ID:', insertedFile.id);

        return NextResponse.json({
            success: true,
            file: insertedFile
        });

    } catch (error: any) {
        console.error('❌ [Upload Completo] Exceção:', error);
        return NextResponse.json({
            error: error.message
        }, { status: 500 });
    }
}
