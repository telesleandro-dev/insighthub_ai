import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Extraímos os dados da requisição uma única vez
    const { userId, aiTone, apiKeys } = await req.json();

    // 2. Inicializamos o Supabase com Service Role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Atualizar Tom de Voz em user_configs
    await supabase.from('user_configs').upsert({
      user_id: userId,
      ai_tone: aiTone,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // 4. Atualizar Chaves de API em user_platform_configs
    if (Array.isArray(apiKeys)) {
      for (const key of apiKeys) {
        if (key.name && key.name.trim() !== '') {
          await supabase.from('user_platform_configs').upsert({
            user_id: userId,
            platform_name: key.name.toLowerCase(),
            api_key: key.value,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id, platform_name' });
        }
      }
    }

    // 5. Também manter cópia em user_settings (opcional, para compatibilidade total)
    await supabase.from('user_settings').upsert({
      user_id: userId,
      ai_tone: aiTone,
      api_keys: apiKeys,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro interno na API:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}