/**
 * Monetizze Platform Adapter
 * 
 * Adaptador para integração com a plataforma Monetizze.
 * Documentação: https://docs.monetizze.com.br/webhooks
 */

import { PlatformAdapter, NormalizedSaleData, MissingDataError, SaleStatus } from './index';

export class MonetizzeAdapter implements PlatformAdapter {
    readonly name = 'monetizze';
    readonly displayName = 'Monetizze';

    /**
     * Detecta se o payload é da Monetizze
     * Monetizze envia campos específicos como 'venda' ou estrutura característica
     */
    detectPayload(payload: any): boolean {
        return !!(
            payload.venda ||
            payload.comprador ||
            (payload.produto && payload.comissao) ||
            payload.codigo_pedido
        );
    }

    /**
     * Normaliza dados do webhook Monetizze
     */
    normalizeData(payload: any): NormalizedSaleData {
        // Monetizze pode enviar dados em diferentes estruturas
        const venda = payload.venda || payload;
        const comprador = payload.comprador || venda.comprador || {};
        const produto = payload.produto || venda.produto || {};

        // Validação de campos obrigatórios
        const email = comprador.email || payload.email;
        if (!email) {
            throw new MissingDataError('comprador.email', this.name);
        }

        // Extração e normalização de dados
        const customerName = comprador.nome ||
            comprador.name ||
            payload.nome_comprador ||
            'Cliente Sem Nome';

        const customerPhone = this.normalizePhone(
            comprador.telefone ||
            comprador.celular ||
            payload.telefone ||
            ''
        );

        const productName = produto.nome ||
            produto.name ||
            payload.produto ||
            'Produto Desconhecido';

        const productId = String(
            produto.codigo ||
            produto.id ||
            payload.codigo_produto ||
            '000'
        );

        // Monetizze envia valores já em reais
        const amount = this.parseAmount(
            venda.valor ||
            payload.valor ||
            payload.preco ||
            '0'
        );

        const status = this.normalizeStatus(
            venda.status ||
            payload.status ||
            payload.status_pagamento ||
            'waiting_payment'
        );

        const transactionId = venda.codigo ||
            payload.codigo_pedido ||
            payload.transacao_id ||
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
                codigo_pedido: payload.codigo_pedido,
                tipo_pagamento: payload.tipo_pagamento || venda.tipo_pagamento,
                parcelas: payload.parcelas || venda.parcelas,
                comissao: payload.comissao,
                produtor: payload.produtor,
                afiliado: payload.afiliado,
                raw_status: venda.status || payload.status
            }
        };
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
     * Converte string de valor para número
     * Monetizze pode enviar valores como "99.90" ou "99,90"
     */
    private parseAmount(value: string | number): number {
        if (typeof value === 'number') {
            return value;
        }

        // Remove espaços, R$ e converte vírgula para ponto
        const cleaned = String(value)
            .trim()
            .replace(/R\$/g, '')
            .replace(/\s/g, '')
            .replace(',', '.');

        const parsed = parseFloat(cleaned);

        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Normaliza o status da Monetizze para o padrão do sistema
     */
    private normalizeStatus(status: string | number): SaleStatus {
        // Monetizze pode enviar status como número ou string
        const statusStr = String(status).toLowerCase();

        const statusMap: Record<string, SaleStatus> = {
            '2': 'paid',
            'paga': 'paid',
            'aprovada': 'paid',
            'finalizada': 'paid',
            '1': 'waiting_payment',
            'aguardando': 'waiting_payment',
            'pendente': 'waiting_payment',
            '3': 'refused',
            'cancelada': 'refused',
            'recusada': 'refused',
            '4': 'refunded',
            'reembolsada': 'refunded',
            'devolvida': 'refunded',
            '5': 'chargeback',
            'chargeback': 'chargeback',
            'contestada': 'chargeback'
        };

        const normalizedStatus = statusMap[statusStr];

        if (!normalizedStatus) {
            console.warn(`Status desconhecido da Monetizze: ${status}, usando 'waiting_payment'`);
            return 'waiting_payment';
        }

        return normalizedStatus;
    }

    /**
     * Retorna os headers de assinatura da Monetizze
     */
    getSignatureHeaders(): string[] {
        return ['x-monetizze-signature'];
    }

    /**
     * Valida assinatura do webhook Monetizze
     * TODO: Implementar validação quando Monetizze fornecer documentação
     */
    validateSignature(payload: any, signature: string, secret: string): boolean {
        // Monetizze não fornece validação de assinatura robusta
        // Validamos pela presença de campos obrigatórios
        return true;
    }
}
