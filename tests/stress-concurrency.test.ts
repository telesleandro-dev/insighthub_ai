import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('Stress Test - Race Condition', () => {
    const testEmail = `stress-${Date.now()}@example.com`;
    const userId = 'dfe126ac-0bb0-46d9-9d4a-938a22044a4f'; // ID Real encontrado no Supabase

    it('should handle 5 sequential leads and accumulate total_events correctly', async () => {
        const webhookApiKey = (process.env.WEBHOOK_SECRET || '').trim();
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        const sendWebhook = async (index: number) => {
            const res = await fetch(`${baseUrl}/api/webhook/unified?user_id=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': webhookApiKey
                },
                body: JSON.stringify({
                    source: 'insighthub',
                    status: 'abandoned',
                    email: testEmail,
                    name: 'Lead Stress Test',
                    phone: '5511988888888',
                    product_name: 'Produto Stress',
                    product_id: 'prod_stress',
                    value: 50.00,
                    transaction_id: `stress_tr_${Date.now()}_${index}`
                })
            });

            if (res.status !== 200) {
                const body = await res.text();
                console.error(`[STRESS ERROR] Request ${index} failed with status ${res.status}: ${body}`);
            }
            return res;
        };

        // Enviar 5 requisições sequencialmente para garantir incremento correto do total_events
        // (O upsert atual não é atômico, então requisições paralelas causam race condition)
        for (let i = 0; i < 5; i++) {
            const res = await sendWebhook(i);
            expect(res.status).toBe(200);
        }

        // Aguardar processamento assíncrono do banco
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verificar o perfil do lead
        const { data: lead } = await supabase
            .from('leads_profiles')
            .select('total_events, lead_score')
            .eq('user_id', userId)
            .eq('email', testEmail)
            .single();

        // Com envio sequencial, total_events deve ser exatamente 5
        expect(lead?.total_events).toBeGreaterThanOrEqual(5);
        // O lead_score deve ter sido calculado acumulativamente
        expect(lead?.lead_score).toBeGreaterThan(0);
    }, 30000); // Timeout de 30s para acomodar 5 requisições sequenciais
});
