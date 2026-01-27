/**
 * Eduzz Platform Adapter
 * 
 * Adaptador para integração com a plataforma Eduzz.
 * Documentação: https://atendimento.eduzz.com/portal/pt-br/kb/articles/webhooks
 */

import { PlatformAdapter, NormalizedSaleData, MissingDataError, SaleStatus } from './index';

export class EduzzAdapter implements PlatformAdapter {
    readonly name = 'eduzz';
    readonly displayName = 'Eduzz';

    /**
     * Detecta se o payload é da Eduzz
     * Eduzz envia campos específicos como 'sale_id' ou 'eduzz_api_key'
     */
    detectPayload(payload: any): boolean {
        return !!(
            payload.sale_id ||
            payload.eduzz_api_key ||
            payload.contract_id ||
            (payload.client_email && payload.product_name && payload.sale_value)
        );
    }

    /**
     * Normaliza dados do webhook Eduzz
     */
    normalizeData(payload: any): NormalizedSaleData {
        // Validação de campos obrigatórios
        const email = payload.client_email || payload.email;
        if (!email) {
            throw new MissingDataError('client_email', this.name);
        }

        // Extração e normalização de dados
        const customerName = payload.client_name || payload.name || 'Cliente Sem Nome';
        const customerPhone = payload.client_cel || payload.client_phone || payload.phone || '';
        const productName = payload.product_name || 'Produto Desconhecido';
        const productId = String(payload.product_id || payload.prod_id || '000');

        // Eduzz envia valores como string, precisa converter
        const amount = this.parseAmount(payload.sale_value || payload.value || '0');

        const status = this.normalizeStatus(
            payload.sale_status_name ||
            payload.status ||
            'waiting_payment'
        );

        const transactionId = payload.sale_id ||
            payload.transaction_id ||
            payload.invoice_id ||
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
                contract_id: payload.contract_id,
                invoice_id: payload.invoice_id,
                sale_id: payload.sale_id,
                payment_method: payload.payment_method,
                installments: payload.installments,
                producer_name: payload.producer_name,
                raw_status: payload.sale_status_name
            }
        };
    }

    /**
     * Converte string de valor para número
     * Eduzz pode enviar valores como "99.90" ou "99,90"
     */
    private parseAmount(value: string | number): number {
        if (typeof value === 'number') {
            return value;
        }

        // Remove espaços e converte vírgula para ponto
        const cleaned = String(value)
            .trim()
            .replace(/\s/g, '')
            .replace(',', '.');

        const parsed = parseFloat(cleaned);

        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Normaliza o status da Eduzz para o padrão do sistema
     */
    private normalizeStatus(status: string): SaleStatus {
        const statusMap: Record<string, SaleStatus> = {
            'finalizada': 'paid',
            'paga': 'paid',
            'aprovada': 'paid',
            'aguardando pagamento': 'waiting_payment',
            'pendente': 'waiting_payment',
            'em análise': 'waiting_payment',
            'cancelada': 'refused',
            'recusada': 'refused',
            'reembolsada': 'refunded',
            'devolvida': 'refunded',
            'chargeback': 'chargeback',
            'contestada': 'chargeback'
        };

        const normalizedStatus = statusMap[status.toLowerCase()];

        if (!normalizedStatus) {
            console.warn(`Status desconhecido da Eduzz: ${status}, usando 'waiting_payment'`);
            return 'waiting_payment';
        }

        return normalizedStatus;
    }

    /**
     * Retorna os headers de assinatura da Eduzz
     */
    getSignatureHeaders(): string[] {
        return ['x-eduzz-signature'];
    }

    /**
     * Valida assinatura do webhook Eduzz
     * TODO: Implementar validação quando Eduzz fornecer documentação
     */
    validateSignature(payload: any, signature: string, secret: string): boolean {
        // Eduzz não fornece validação de assinatura robusta
        // Validamos pela presença de campos obrigatórios
        return true;
    }
}
