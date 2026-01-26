import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Recebe o ID do lead e o novo link enviados pelo Modal
    const { leadId, discountLink } = await req.json();

    // 2. Inicializa o cliente do Supabase com as permissões de serviço
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 3. Executa o comando .update() no campo que criamos via SQL
    const { error } = await supabase
      .from('sales_events')
      .update({ custom_discount_link: discountLink })
      .eq('id', leadId);

    // 4. Tratamento de erro caso a atualização falhe
    if (error) {
      console.error("Erro no Supabase:", error.message);
      throw error;
    }

    return NextResponse.json({ success: true, message: "Link atualizado com sucesso!" });

  } catch (error: any) {
    console.error("Erro na Rota de Update:", error.message);
    return NextResponse.json(
      { error: "Falha ao atualizar o link de desconto" }, 
      { status: 500 }
    );
  }
}