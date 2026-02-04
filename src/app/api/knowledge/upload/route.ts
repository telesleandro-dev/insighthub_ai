import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Client com SERVICE_ROLE_KEY (bypass RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: Request) {
    try {
        const { userId, fileName, filePath, fileSize, fileType } = await req.json();

        if (!userId || !fileName || !filePath) {
            return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
        }

        console.log('📝 [API Upload] Tentando inserir:', { userId, fileName, filePath, fileSize, fileType });

        // Usar supabaseAdmin (SERVICE_ROLE) para bypass RLS
        const { data, error } = await supabaseAdmin
            .from('knowledge_files')
            .insert({
                user_id: userId,
                file_name: fileName,
                file_path: filePath,
                file_size: fileSize,
                file_type: fileType
            })
            .select()
            .single();

        if (error) {
            console.error('❌ [API Upload] Erro ao inserir:', error);
            throw error;
        }

        console.log('✅ [API Upload] Sucesso! ID:', data.id);

        return NextResponse.json({ success: true, file: data });

    } catch (error: any) {
        console.error('❌ [API Upload] Exceção:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
