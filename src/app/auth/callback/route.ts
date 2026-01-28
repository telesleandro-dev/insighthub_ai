import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/dashboard'

    console.log('🔍 [AUTH CALLBACK] Iniciando...');
    console.log('  - Code presente:', !!code);
    console.log('  - Next path:', next);
    console.log('  - Origin:', requestUrl.origin);

    if (code) {
        try {
            const cookieStore = await cookies()
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        get(name: string) {
                            return cookieStore.get(name)?.value
                        },
                        set(name: string, value: string, options: CookieOptions) {
                            try {
                                cookieStore.set({ name, value, ...options })
                            } catch (error) {
                                console.error('❌ Erro ao setar cookie:', name, error);
                            }
                        },
                        remove(name: string, options: CookieOptions) {
                            try {
                                cookieStore.set({ name, value: '', ...options })
                            } catch (error) {
                                console.error('❌ Erro ao remover cookie:', name, error);
                            }
                        },
                    },
                }
            )

            console.log('🔄 Trocando código por sessão...');
            const { data, error } = await supabase.auth.exchangeCodeForSession(code)

            if (error) {
                console.error('❌ [AUTH CALLBACK] Erro ao trocar código:', error.message);
                return NextResponse.redirect(
                    `${requestUrl.origin}/login?error=${encodeURIComponent('Erro ao autenticar: ' + error.message)}`
                )
            }

            if (!data.session) {
                console.error('❌ [AUTH CALLBACK] Nenhuma sessão retornada');
                return NextResponse.redirect(
                    `${requestUrl.origin}/login?error=${encodeURIComponent('Sessão não estabelecida')}`
                )
            }

            console.log('✅ [AUTH CALLBACK] Sessão estabelecida com sucesso!');
            console.log('  - User ID:', data.user?.id);
            console.log('  - Email:', data.user?.email);
            console.log('  - Redirecionando para:', next);

            const redirectUrl = `${requestUrl.origin}${next}`
            return NextResponse.redirect(redirectUrl)

        } catch (err) {
            console.error('💥 [AUTH CALLBACK] Exceção:', err);
            return NextResponse.redirect(
                `${requestUrl.origin}/login?error=${encodeURIComponent('Erro interno no callback')}`
            )
        }
    }

    console.error('❌ [AUTH CALLBACK] Código de autenticação ausente');
    return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent('Código de autenticação não encontrado')}`
    )
}
