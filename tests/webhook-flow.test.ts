import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('Webhook Flow - Status Transition', () => {
    const testEmail = `test-status-${Date.now()}@example.com`;
    const userId = 'dfe126ac-0bb0-46d9-9d4a-938a22044a4f'; // ID Real encontrado no Supabase

    beforeAll(() => {
        const secret = process.env.WEBHOOK_SECRET || '';
        console.log(`[DEBUG] WEBHOOK_SECRET length: ${secret.length}`);
        console.log(`[DEBUG] WEBHOOK_SECRET starts with: ${secret.substring(0, 3)}... and ends with: ...${secret.substring(secret.length - 3)}`);

        if (!process.env.WEBHOOK_SECRET) {
            console.warn('⚠️ WEBHOOK_SECRET não definida no ambiente!');
        }
    });
    it('should transition from pending to processed correctly', async () => {
        // 1. Simular Abandono de Carrinho (Webhook Externo -> Pending)
        const webhookPayload = {
            source: 'insighthub',
            status: 'abandoned',
            email: testEmail,
            name: 'Teste de Status',
            phone: '5511999999999',
            product_name: 'Produto Teste',
            product_id: 'prod_123',
            value: 100.00,
            transaction_id: `tr_${Date.now()}`
        };

        const webhookApiKey = (process.env.WEBHOOK_SECRET || '').trim();
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        const webhookRes = await fetch(`${baseUrl}/api/webhook/unified?user_id=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': webhookApiKey
            },
            body: JSON.stringify(webhookPayload)
        });

        if (webhookRes.status !== 200) {
            const body = await webhookRes.text();
            console.error(`[ERROR] Webhook failed with status ${webhookRes.status}: ${body}`);
        }
        expect(webhookRes.status).toBe(200);

        // Verificar se entrou como pending no banco
        const { data: leadPending } = await supabase
            .from('leads_profiles')
            .select('service_status')
            .eq('user_id', userId)
            .eq('email', testEmail)
            .single();

        expect(leadPending?.service_status).toBe('pending');

        // 2. Simular Enriquecimento por IA (Update Profile -> Processed)
        const updatePayload = {
            email: testEmail,
            user_id: userId,
            service_status: 'processed',
            lead_summary: 'Este lead foi analisado pela IA e está pronto para abordagem.'
        };

        const updateRes = await fetch(`${baseUrl}/api/leads/update-profile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': webhookApiKey
            },
            body: JSON.stringify(updatePayload)
        });

        if (updateRes.status !== 200) {
            const body = await updateRes.text();
            console.error(`[ERROR] update-profile failed with status ${updateRes.status}: ${body}`);
        }
        expect(updateRes.status).toBe(200);

        // Verificar se mudou para processed
        const { data: leadProcessed } = await supabase
            .from('leads_profiles')
            .select('service_status, lead_summary')
            .eq('user_id', userId)
            .eq('email', testEmail)
            .single();

        expect(leadProcessed?.service_status).toBe('processed');
        expect(leadProcessed?.lead_summary).toContain('analisado pela IA');
    }, 30000); // Timeout de 30s para acomodar chamadas HTTP + queries
});
