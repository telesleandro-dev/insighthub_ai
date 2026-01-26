import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Extraímos os dados da requisição uma única vez
    const { userId, aiTone, apiKeys } = await req.json();

    // 2. Inicializamos o Supabase com Service Role para evitar bloqueios de RLS no salvamento
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Executamos o UPSERT focado no user_id real
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: userId, // Identificador real c048be53...
        ai_tone: aiTone,
        api_keys: apiKeys,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id' // Atualiza se já existir, cria se não existir
      })
      .select();

    if (error) {
      console.error("Erro no banco de dados:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Erro interno na API:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}