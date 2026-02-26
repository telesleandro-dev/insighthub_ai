import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Extraímos os dados da requisição uma única vez
    const { userId, aiTone, apiKeys, telegramToken, telegramChatId, telegramEnabled } = await req.json();

    // 2. Inicializamos o Supabase com Service Role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Atualizar configurações em user_configs (incluindo Telegram)
    const updateData: any = {
      user_id: userId,
      ai_tone: aiTone
    };

    if (telegramToken !== undefined) updateData.telegram_token = telegramToken || null;
    if (telegramChatId !== undefined) updateData.telegram_chat_id = telegramChatId || null;
    if (telegramEnabled !== undefined) updateData.telegram_enabled = telegramEnabled;

    const { error: upsertError } = await supabase
      .from('user_configs')
      .upsert(updateData, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('❌ [settings/update] Erro no upsert user_configs:', upsertError.message, upsertError.details);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    console.log('✅ [settings/update] user_configs salvo para:', userId);

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
    // user_settings: compatibilidade opcional — ignora erro se tabela não existir
    await supabase.from('user_settings').upsert({
      user_id: userId,
      ai_tone: aiTone,
      api_keys: apiKeys
    }, { onConflict: 'user_id' }).then(() => {/* ignora erro */ });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Erro interno na API:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}