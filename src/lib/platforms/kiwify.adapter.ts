/**
 * Kiwify Platform Adapter
 * 
 * Adaptador para integração com a plataforma Kiwify.
 * Documentação: https://developers.kiwify.com.br/webhooks
 */

import { PlatformAdapter, NormalizedSaleData, MissingDataError, SaleStatus } from './index';

export class KiwifyAdapter implements PlatformAdapter {
    readonly name = 'kiwify';
    readonly displayName = 'Kiwify';

    /**
     * Detecta se o payload é da Kiwify
     * Kiwify pode enviar três formatos:
     * 1. Formato antigo: com Customer e product_name
     * 2. Formato novo: com checkout_link, email, name
     * 3. Formato mais recente: com order_id, order_status, store_id
     */
    detectPayload(payload: any): boolean {
        // Formato antigo: tem product_name e Customer
        const hasOldFormat = !!(
            payload.product_name &&
            (payload.Customer || payload.customer)
        );

        // Formato novo: tem checkout_link ou (email + name + id)
        // Exclui sale_id (Eduzz) e hottok/event (Hotmart)
        const hasNewFormat = !!(
            payload.checkout_link ||
            (payload.email && payload.name && payload.id && !payload.hottok && !payload.event && !payload.sale_id)
        );

        // Formato mais recente: order_id, order_status, store_id
        // Unique to Kiwify: store_id and order_ref combination
        const hasNewestFormat = !!(
            payload.order_id &&
            payload.store_id &&
            payload.order_status
        );

        return hasOldFormat || hasNewFormat || hasNewestFormat;
    }

    /**
     * Normaliza dados do webhook Kiwify
     * Suporta formato antigo e novo
     */
    normalizeData(payload: any): NormalizedSaleData {
        // DEBUG: Log completo do payload para diagnóstico
        console.log('[Kiwify] Payload completo recebido:', JSON.stringify(payload, null, 2));

        // Kiwify pode enviar Customer ou customer (case-insensitive)
        const customer = payload.Customer || payload.customer || {};
        const productInfo = payload.product || {};

        // Validação de campos obrigatórios
        const email = customer.email || payload.email;
        if (!email) {
            throw new MissingDataError('customer.email', this.name);
        }

        // Extração e normalização de dados
        const customerName = customer.full_name || customer.name || payload.name || 'Cliente Sem Nome';
        const customerPhone = customer.mobile || customer.phone || payload.phone || payload.mobile || '';

        // Produto: pode vir em product_name (antigo) ou offer_name (novo)
        const productName = payload.product_name || payload.offer_name || productInfo.product_name || 'Produto Desconhecido';
        const productId = String(payload.product_id || payload.offer_id || productInfo.product_id || payload.id || '000');

        // Kiwify envia valores em centavos (order_amount) ou reais (amount/value)
        let amount = 0;
        if (payload.order_amount) {
            amount = payload.order_amount / 100;
        } else if (payload.amount) {
            amount = typeof payload.amount === 'number' ? payload.amount : parseFloat(payload.amount) || 0;
        } else if (payload.value) {
            amount = typeof payload.value === 'number' ? payload.value : parseFloat(payload.value) || 0;
        }

        const status = this.normalizeStatus(payload.status || payload.order_status || 'waiting_payment');
        const transactionId = payload.order_id || payload.transaction_id || payload.id || '';

        return {
            customerName,
            customerEmail: email,
            customerPhone,
            productName,
            productId,
            amount,
            status,
            transactionId,
            metadata: {
                commission_as: payload.commission_as,
                order_ref: payload.order_ref,
                subscription_id: payload.subscription_id,
                installments: payload.installments,
                payment_method: payload.payment_method,
                checkout_link: payload.checkout_link,
                offer_name: payload.offer_name,
                country: payload.country,
                cpf: payload.cpf,
                raw_status: payload.status
            }
        };
    }

    /**
     * Normaliza o status da Kiwify para o padrão do sistema
     */
    private normalizeStatus(status: string): SaleStatus {
        const statusMap: Record<string, SaleStatus> = {
            'paid': 'paid',
            'approved': 'paid',
            'complete': 'paid',
            'waiting_payment': 'waiting_payment',
            'pending': 'waiting_payment',
            'abandoned': 'waiting_payment',
            'refused': 'refused',
            'cancelled': 'refused',
            'refunded': 'refunded',
            'chargeback': 'chargeback'
        };

        const normalizedStatus = statusMap[status.toLowerCase()];

        if (!normalizedStatus) {
            console.warn(`Status desconhecido da Kiwify: ${status}, usando 'waiting_payment'`);
            return 'waiting_payment';
        }

        return normalizedStatus;
    }

    /**
     * Retorna os headers de assinatura da Kiwify
     */
    getSignatureHeaders(): string[] {
        return ['x-kiwify-signature'];
    }

    /**
     * Valida assinatura do webhook Kiwify (se implementado pela plataforma)
     * TODO: Implementar validação HMAC quando Kiwify disponibilizar
     */
    validateSignature(payload: any, signature: string, secret: string): boolean {
        // Kiwify atualmente não fornece validação de assinatura via HMAC
        // Retornamos true por padrão, mas validamos user_id na URL
        return true;
    }
}
