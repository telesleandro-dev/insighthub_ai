/**
 * Platform Adapter System
 * 
 * Sistema de adaptadores para integração com múltiplas plataformas de pagamento.
 * Cada plataforma implementa a interface PlatformAdapter para normalizar dados.
 */

/**
 * Status normalizado de uma venda/transação
 */
export type SaleStatus = 'paid' | 'waiting_payment' | 'refused' | 'refunded' | 'chargeback' | 'abandoned';

/**
 * Dados normalizados de uma venda
 * Todas as plataformas devem converter seus dados para este formato
 */
export interface NormalizedSaleData {
  /** Nome completo do cliente */
  customerName: string;

  /** Email do cliente (obrigatório) */
  customerEmail: string;

  /** Telefone do cliente (opcional, usado para recuperação) */
  customerPhone?: string;

  /** Nome do produto vendido */
  productName: string;

  /** ID externo do produto na plataforma */
  productId: string;

  /** Valor da venda em reais (já convertido de centavos se necessário) */
  amount: number;

  /** Status normalizado da transação */
  status: SaleStatus;

  /** ID da transação na plataforma */
  transactionId: string;

  /** Metadados específicos da plataforma (armazenados como JSON) */
  metadata?: Record<string, any>;

  /** Inteligência de Leads: Fonte de origem customizada */
  leadSource?: string;

  /** Inteligência de Leads: Tags de segmentação */
  leadTags?: string[];

  /** Inteligência de Leads: Observações contextuais */
  leadNotes?: string;
}

/**
 * Interface que todas as plataformas devem implementar
 */
export interface PlatformAdapter {
  /** Nome único da plataforma (lowercase, sem espaços) */
  readonly name: string;

  /** Nome de exibição da plataforma */
  readonly displayName: string;

  /**
   * Detecta se o payload pertence a esta plataforma
   * @param payload Dados brutos recebidos do webhook
   * @returns true se o payload for desta plataforma
   */
  detectPayload(payload: any): boolean;

  /**
   * Normaliza os dados do webhook para o formato padrão
   * @param payload Dados brutos recebidos do webhook
   * @returns Dados normalizados
   * @throws Error se dados obrigatórios estiverem ausentes
   */
  normalizeData(payload: any): NormalizedSaleData;

  /**
   * Valida a assinatura do webhook (se a plataforma suportar)
   * @param payload Dados recebidos
   * @param signature Assinatura recebida no header
   * @param secret Segredo configurado pelo usuário
   * @returns true se a assinatura for válida
   */
  validateSignature?(payload: any, signature: string, secret: string): boolean;

  /**
   * Retorna os headers esperados para validação
   */
  getSignatureHeaders?(): string[];
}

/**
 * Erro lançado quando dados obrigatórios estão ausentes
 */
export class MissingDataError extends Error {
  constructor(field: string, platform: string) {
    super(`Campo obrigatório ausente: ${field} (Plataforma: ${platform})`);
    this.name = 'MissingDataError';
  }
}

/**
 * Erro lançado quando a assinatura do webhook é inválida
 */
export class InvalidSignatureError extends Error {
  constructor(platform: string) {
    super(`Assinatura de webhook inválida (Plataforma: ${platform})`);
    this.name = 'InvalidSignatureError';
  }
}
