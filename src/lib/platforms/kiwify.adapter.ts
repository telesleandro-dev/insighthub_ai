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
     * Kiwify envia um objeto Customer e product_name
     */
    detectPayload(payload: any): boolean {
        return !!(
            payload.product_name &&
            (payload.Customer || payload.customer)
        );
    }

    /**
     * Normaliza dados do webhook Kiwify
     */
    normalizeData(payload: any): NormalizedSaleData {
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
        const customerPhone = customer.mobile || customer.phone || payload.mobile || '';
        const productName = payload.product_name || productInfo.product_name || 'Produto Desconhecido';
        const productId = String(payload.product_id || productInfo.product_id || '000');

        // Kiwify envia valores em centavos
        const amount = payload.order_amount
            ? (payload.order_amount / 100)
            : (payload.amount || 0);

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
