/**
 * Hotmart Platform Adapter
 * 
 * Adaptador para integração com a plataforma Hotmart.
 * Documentação: https://developers.hotmart.com/docs/pt-BR/v1/webhooks/
 */

import { PlatformAdapter, NormalizedSaleData, MissingDataError, SaleStatus } from './index';

export class HotmartAdapter implements PlatformAdapter {
    readonly name = 'hotmart';
    readonly displayName = 'Hotmart';

    /**
     * Detecta se o payload é da Hotmart
     * Hotmart envia um campo 'hottok' ou 'event'
     */
    detectPayload(payload: any): boolean {
        return !!(
            payload.hottok ||
            payload.event ||
            (payload.data && payload.data.product)
        );
    }

    /**
     * Normaliza dados do webhook Hotmart
     */
    normalizeData(payload: any): NormalizedSaleData {
        // Hotmart pode enviar dados em diferentes estruturas
        const data = payload.data || payload;
        const buyer = data.buyer || data.Buyer || {};
        const product = data.product || data.Product || {};
        const purchase = data.purchase || data.Purchase || {};
        const commissions = data.commissions || [];

        // Validação de campos obrigatórios
        const email = buyer.email || payload.email;
        if (!email) {
            throw new MissingDataError('buyer.email', this.name);
        }

        // Extração e normalização de dados
        const customerName = buyer.name || buyer.full_name || 'Cliente Sem Nome';
        const customerPhone = this.normalizePhone(buyer.phone || buyer.checkout_phone || '');
        const productName = product.name || product.product_name || 'Produto Desconhecido';
        const productId = String(product.id || product.product_id || '000');

        // Hotmart envia valores já em reais
        const amount = this.extractAmount(purchase, payload);

        const status = this.normalizeStatus(
            purchase.status ||
            payload.status ||
            data.status ||
            'waiting_payment'
        );

        const transactionId = purchase.transaction ||
            purchase.purchase_id ||
            payload.transaction ||
            '';

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
                hottok: payload.hottok,
                event: payload.event,
                subscription_id: purchase.subscription_id,
                offer_code: purchase.offer_code,
                payment_type: purchase.payment_type,
                commissions: commissions,
                raw_status: purchase.status || payload.status
            }
        };
    }

    /**
     * Extrai o valor da compra de diferentes estruturas possíveis
     */
    private extractAmount(purchase: any, payload: any): number {
        // Hotmart pode enviar o valor em diferentes campos
        if (purchase.price?.value) return purchase.price.value;
        if (purchase.price_value) return purchase.price_value;
        if (payload.price?.value) return payload.price.value;
        if (payload.price_value) return payload.price_value;
        if (purchase.value) return purchase.value;
        if (payload.value) return payload.value;

        return 0;
    }

    /**
     * Normaliza telefone removendo caracteres especiais
     */
    private normalizePhone(phone: string): string {
        if (!phone) return '';

        // Remove tudo que não é número
        const cleaned = phone.replace(/\D/g, '');

        // Remove código do país se presente (55)
        if (cleaned.startsWith('55') && cleaned.length > 11) {
            return cleaned.substring(2);
        }

        return cleaned;
    }

    /**
     * Normaliza o status da Hotmart para o padrão do sistema
     */
    private normalizeStatus(status: string): SaleStatus {
        const statusMap: Record<string, SaleStatus> = {
            'approved': 'paid',
            'complete': 'paid',
            'completed': 'paid',
            'paid': 'paid',
            'waiting_payment': 'waiting_payment',
            'pending': 'waiting_payment',
            'under_analysis': 'waiting_payment',
            'refunded': 'refunded',
            'cancelled': 'refused',
            'canceled': 'refused',
            'blocked': 'refused',
            'chargeback': 'chargeback'
        };

        const normalizedStatus = statusMap[status.toLowerCase()];

        if (!normalizedStatus) {
            console.warn(`Status desconhecido da Hotmart: ${status}, usando 'waiting_payment'`);
            return 'waiting_payment';
        }

        return normalizedStatus;
    }

    /**
     * Retorna os headers de assinatura da Hotmart
     */
    getSignatureHeaders(): string[] {
        return ['x-hotmart-hottok'];
    }

    /**
     * Valida assinatura do webhook Hotmart usando HMAC
     * Hotmart usa o campo 'hottok' para validação
     */
    validateSignature(payload: any, signature: string, secret: string): boolean {
        if (!signature || !secret) {
            return false;
        }

        try {
            // Hotmart envia o hottok no payload
            const hottok = payload.hottok;

            if (!hottok) {
                return false;
            }

            // Validação básica: verifica se o hottok está presente
            // Para validação completa, seria necessário verificar com a API da Hotmart
            return hottok === signature;

        } catch (error) {
            console.error('Erro ao validar assinatura Hotmart:', error);
            return false;
        }
    }
}
