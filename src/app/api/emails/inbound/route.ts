import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { parseEmail } from '@/lib/emailParser';
import { analyzeEmail } from '@/lib/ai/emailAnalyzer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('CRITICAL: Supabase environment variables are missing!');
}

const supabase = createClient(supabaseUrl || '', serviceRoleKey || '');

/**
 * Webhook endpoint for Resend Inbound Emails
 * https://resend.com/docs/dashboard/webhooks/event-types
 */
export async function POST(req: NextRequest) {
    try {
        // Verify webhook signature (optional but recommended)
        // const signature = req.headers.get('resend-signature');
        // TODO: Implement signature verification

        const payload = await req.json();
        console.log('Received inbound email:', payload);

        // Resend sends email.received events
        if (payload.type !== 'email.received') {
            return NextResponse.json({ message: 'Event type not supported' }, { status: 200 });
        }

        const emailData = payload.data;
        const parsed = parseEmail(emailData);

        // Extract recipient email to find user_id
        const recipientEmail = emailData.to?.[0] || emailData.to;

        if (!recipientEmail) {
            console.error('No recipient email found');
            return NextResponse.json({ error: 'No recipient' }, { status: 400 });
        }

        // Look up user by insighthub_email
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('insighthub_email', recipientEmail)
            .maybeSingle();

        if (profileError || !profile) {
            console.error('User not found for email:', recipientEmail, profileError);
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userId = profile.id;

        // Analyze email with AI
        console.log('Analyzing email for user:', userId);
        const analysis = await analyzeEmail(parsed.sender, parsed.subject, parsed.bodyText);

        // DEBUG: Ver análise completa
        console.log('📊 Análise completa da Gemini:', JSON.stringify(analysis, null, 2));

        // Try to match product by name (if produto_identificado exists)
        let productId = null;
        if (analysis.produto_identificado) {
            console.log('✅ Produto identificado pela IA:', analysis.produto_identificado);

            // Normalize the product name for better matching
            const normalizedSearch = normalizeString(analysis.produto_identificado);
            console.log('🔍 Buscando produto normalizado:', normalizedSearch);

            // Get all products for this user
            const { data: allProducts } = await supabase
                .from('products')
                .select('id, name')
                .eq('user_id', userId);

            if (allProducts && allProducts.length > 0) {
                console.log(`📦 ${allProducts.length} produto(s) cadastrado(s):`, allProducts.map(p => p.name));

                // Find best match by normalized similarity
                let bestMatch = null;
                for (const product of allProducts) {
                    const normalizedProductName = normalizeString(product.name);

                    // Check if search term is contained in product name or vice-versa
                    if (normalizedProductName.includes(normalizedSearch) ||
                        normalizedSearch.includes(normalizedProductName)) {
                        bestMatch = product;
                        break;
                    }
                }

                if (bestMatch) {
                    productId = bestMatch.id;
                    console.log('🎯 Product matched:', bestMatch.name, '→', productId);
                } else {
                    console.log('⚠️ Nenhum match encontrado. Tentei:', normalizedSearch);
                }
            } else {
                console.log('⚠️ Nenhum produto cadastrado para este usuário');
            }
        } else {
            console.log('❌ Gemini NÃO retornou produto_identificado');
        }

        // Helper function to normalize strings for matching
        function normalizeString(str: string): string {
            if (!str) return '';

            return str
                .toLowerCase()
                .normalize('NFD') // Decompose accented characters
                .replace(/[\u0300-\u036f]/g, '') // Remove diacritics (accents)
                .replace(/[^\w\s]/g, '') // Remove punctuation
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();
        }

        // Store in database
        console.log('💾 Salvando no banco:', {
            produto_identificado: analysis.produto_identificado,
            product_id: productId
        });

        const { error: insertError } = await supabase
            .from('inbox_messages')
            .insert({
                user_id: userId,
                sender: parsed.sender,
                subject: parsed.subject,
                body_text: parsed.bodyText,
                analise_sentimento: analysis.analise_sentimento,
                intencao: analysis.intencao,
                resumo_executivo: analysis.resumo_executivo,
                dores_identificadas: analysis.dores_identificadas,
                probabilidade_conversao: analysis.probabilidade_conversao,
                sugestao_resposta: analysis.sugestao_resposta,
                produto_identificado: analysis.produto_identificado, // NEW
                product_id: productId, // NEW
                raw_analysis: analysis,
                processed: true,
                received_at: new Date().toISOString()
            });

        if (insertError) {
            console.error('Error inserting email:', insertError);
            throw insertError;
        }

        console.log('Email processed successfully for user:', userId);
        return NextResponse.json({ success: true, analysis });

    } catch (error: any) {
        console.error('Error processing inbound email:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
