/**
 * Platform Registry
 * 
 * Registro centralizado de todos os adaptadores de plataforma.
 * Gerencia detecção automática e acesso aos adaptadores.
 */

import { PlatformAdapter } from './index';
import { KiwifyAdapter } from './kiwify.adapter';
import { HotmartAdapter } from './hotmart.adapter';
import { EduzzAdapter } from './eduzz.adapter';
import { MonetizzeAdapter } from './monetizze.adapter';
import { InsightHubAdapter } from './insighthub.adapter';

/**
 * Singleton que gerencia todos os adaptadores de plataforma
 */
class PlatformRegistry {
    private adapters: Map<string, PlatformAdapter> = new Map();
    private initialized = false;

    constructor() {
        this.initialize();
    }

    /**
     * Inicializa o registro com todos os adaptadores disponíveis
     */
    private initialize() {
        if (this.initialized) return;

        // Registra todos os adaptadores
        this.register(new KiwifyAdapter());
        this.register(new HotmartAdapter());
        this.register(new EduzzAdapter());
        this.register(new MonetizzeAdapter());
        this.register(new InsightHubAdapter());

        this.initialized = true;

        console.log(`[PlatformRegistry] ${this.adapters.size} plataformas registradas:`,
            Array.from(this.adapters.keys()).join(', '));
    }

    /**
     * Registra um novo adaptador
     * @param adapter Adaptador a ser registrado
     */
    register(adapter: PlatformAdapter): void {
        if (this.adapters.has(adapter.name)) {
            console.warn(`[PlatformRegistry] Adaptador '${adapter.name}' já registrado, sobrescrevendo...`);
        }

        this.adapters.set(adapter.name, adapter);
    }

    /**
     * Remove um adaptador do registro
     * @param name Nome do adaptador
     */
    unregister(name: string): boolean {
        return this.adapters.delete(name);
    }

    /**
     * Detecta automaticamente qual plataforma enviou o payload
     * @param payload Dados recebidos do webhook
     * @returns Adaptador detectado ou null se não reconhecido
     */
    detect(payload: any): PlatformAdapter | null {
        if (!payload || typeof payload !== 'object') {
            console.error('[PlatformRegistry] Payload inválido para detecção');
            return null;
        }

        // Tenta detectar a plataforma usando cada adaptador
        for (const adapter of this.adapters.values()) {
            try {
                if (adapter.detectPayload(payload)) {
                    console.log(`[PlatformRegistry] Plataforma detectada: ${adapter.displayName}`);
                    return adapter;
                }
            } catch (error) {
                console.error(`[PlatformRegistry] Erro ao detectar com ${adapter.name}:`, error);
            }
        }

        console.warn('[PlatformRegistry] Nenhuma plataforma reconheceu o payload');
        return null;
    }

    /**
     * Obtém um adaptador específico pelo nome
     * @param name Nome da plataforma
     * @returns Adaptador ou undefined se não encontrado
     */
    get(name: string): PlatformAdapter | undefined {
        return this.adapters.get(name.toLowerCase());
    }

    /**
     * Verifica se uma plataforma está registrada
     * @param name Nome da plataforma
     */
    has(name: string): boolean {
        return this.adapters.has(name.toLowerCase());
    }

    /**
     * Retorna todos os adaptadores registrados
     */
    getAll(): PlatformAdapter[] {
        return Array.from(this.adapters.values());
    }

    /**
     * Retorna os nomes de todas as plataformas registradas
     */
    getAllNames(): string[] {
        return Array.from(this.adapters.keys());
    }

    /**
     * Retorna informações sobre todas as plataformas
     */
    getPlatformInfo(): Array<{ name: string; displayName: string }> {
        return this.getAll().map(adapter => ({
            name: adapter.name,
            displayName: adapter.displayName
        }));
    }

    /**
     * Limpa todos os adaptadores (útil para testes)
     */
    clear(): void {
        this.adapters.clear();
        this.initialized = false;
    }

    /**
     * Retorna o número de plataformas registradas
     */
    get count(): number {
        return this.adapters.size;
    }
}

// Exporta instância singleton
export const platformRegistry = new PlatformRegistry();

// Exporta classe para testes
export { PlatformRegistry };
