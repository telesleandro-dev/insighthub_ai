/**
 * InsightHub Platform Adapter
 * 
 * Adaptador genérico para integração com qualquer fonte via API Central.
 * Ideal para uso com Make, n8n, Typeform e formulários próprios.
 */

import { PlatformAdapter, NormalizedSaleData, MissingDataError, SaleStatus } from './index';

export class InsightHubAdapter implements PlatformAdapter {
    readonly name = 'insighthub';
    readonly displayName = 'InsightHub API';

    /**
     * Detecta se o payload é destinado ao adaptador InsightHub
     * Detecção via campo 'source' no payload ou header 'x-insighthub-source'
     */
    detectPayload(payload: any): boolean {
        return !!(payload.source === 'insighthub' || payload.platform === 'insighthub');
    }

    /**
     * Normaliza os dados recebidos para o formato padrão InsightHub
     */
    normalizeData(payload: any): NormalizedSaleData {
        // Validação de campos obrigatórios
        if (!payload.email) {
            throw new MissingDataError('email', this.displayName);
        }
        if (!payload.status) {
            throw new MissingDataError('status', this.displayName);
        }
        if (!payload.product_name) {
            throw new MissingDataError('product_name', this.displayName);
        }

        // Extração de dados
        const customerEmail = payload.email.trim().toLowerCase();
        const customerName = payload.name || payload.customer_name || 'Cliente';
        const customerPhone = payload.phone || payload.celular || payload.mobile || '';
        const productName = payload.product_name;
        const productId = payload.product_id || payload.external_id || 'HUB-GENERIC';

        // Valor da venda (converte para number)
        let amount = 0;
        if (payload.value !== undefined) {
            amount = typeof payload.value === 'number' ? payload.value : parseFloat(payload.value) || 0;
        } else if (payload.valor !== undefined) {
            amount = typeof payload.valor === 'number' ? payload.valor : parseFloat(payload.valor) || 0;
        }

        const status = this.normalizeStatus(payload.status);
        const transactionId = payload.transaction_id || payload.order_id || `HUB-${Date.now()}`;

        return {
            customerName,
            customerEmail,
            customerPhone,
            productName,
            productId,
            amount,
            status,
            transactionId,
            leadSource: payload.source || payload.platform || 'api',
            leadTags: Array.isArray(payload.tags) ? payload.tags : [],
            leadNotes: payload.notes || payload.observacoes || '',
            metadata: {
                source: payload.source || 'api',
                original_platform: payload.platform || 'generic',
                tags: payload.tags || [],
                notes: payload.notes || payload.observacoes
            }
        };
    }

    /**
     * Converte status externo para o padrão interno do sistema
     */
    private normalizeStatus(status: string): SaleStatus {
        const s = status.toLowerCase().trim();

        // Mapeamento de status comuns
        const mapping: Record<string, SaleStatus> = {
            // Paid
            'paid': 'paid',
            'pago': 'paid',
            'aprovado': 'paid',
            'approved': 'paid',
            'complete': 'paid',
            'concluido': 'paid',

            // Waiting Payment
            'waiting_payment': 'waiting_payment',
            'pending': 'waiting_payment',
            'pendente': 'waiting_payment',
            'aguardando_pagamento': 'waiting_payment',
            'boleto_gerado': 'waiting_payment',
            'pix_gerado': 'waiting_payment',

            // Refused
            'refused': 'refused',
            'recusado': 'refused',
            'rejeitado': 'refused',
            'rejected': 'refused',
            'expired': 'refused',
            'expirado': 'refused',
            'cancelado': 'refused',
            'canceled': 'refused',

            // Abandoned
            'abandoned': 'abandoned',
            'abandonado': 'abandoned',
            'carrinho_abandonado': 'abandoned',

            // Refunded
            'refunded': 'refunded',
            'reembolsado': 'refunded',
            'estornado': 'refunded',

            // Chargeback
            'chargeback': 'chargeback'
        };

        return mapping[s] || 'waiting_payment';
    }

    /**
     * Headers esperados para este adaptador
     */
    getSignatureHeaders(): string[] {
        return ['x-api-key'];
    }

    /**
     * No caso deste adaptador, a validação de API Key é feita diretamente na rota unificada
     * para permitir integração simples via ferramentas No-Code
     */
    validateSignature(payload: any, signature: string, secret: string): boolean {
        // A validação real será feita no route.ts comparando com o secret do usuário
        return true;
    }
}
