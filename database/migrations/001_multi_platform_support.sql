-- ============================================================================
-- MIGRATION: Multi-Platform Support
-- Data: 2026-01-27
-- Descrição: Adiciona suporte para múltiplas plataformas de pagamento
-- ============================================================================

-- 1. Adicionar novos campos à tabela sales_events
-- ============================================================================

-- Campo para armazenar ID da transação na plataforma externa
ALTER TABLE sales_events 
ADD COLUMN IF NOT EXISTS external_transaction_id TEXT;

-- Campo para armazenar metadados específicos da plataforma (JSON)
ALTER TABLE sales_events 
ADD COLUMN IF NOT EXISTS platform_metadata JSONB DEFAULT '{}'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN sales_events.external_transaction_id IS 'ID da transação na plataforma externa (order_id, transaction_id, etc)';
COMMENT ON COLUMN sales_events.platform_metadata IS 'Metadados específicos da plataforma armazenados como JSON';


-- 2. Criar tabela de plataformas suportadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS supported_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  requires_signature BOOLEAN DEFAULT false,
  webhook_url_template TEXT,
  documentation_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE supported_platforms IS 'Plataformas de pagamento suportadas pelo sistema';

-- Inserir plataformas iniciais
INSERT INTO supported_platforms (name, display_name, requires_signature, documentation_url) VALUES
  ('kiwify', 'Kiwify', false, 'https://developers.kiwify.com.br/webhooks'),
  ('hotmart', 'Hotmart', true, 'https://developers.hotmart.com/docs/pt-BR/v1/webhooks/'),
  ('eduzz', 'Eduzz', false, 'https://atendimento.eduzz.com/portal/pt-br/kb/articles/webhooks'),
  ('monetizze', 'Monetizze', false, 'https://docs.monetizze.com.br/webhooks')
ON CONFLICT (name) DO NOTHING;


-- 3. Criar tabela de configuração de plataformas por usuário
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_platform_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform_name TEXT NOT NULL,
  api_key TEXT,
  webhook_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  last_webhook_at TIMESTAMP,
  webhook_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, platform_name)
);

COMMENT ON TABLE user_platform_configs IS 'Configurações de integração por usuário e plataforma';
COMMENT ON COLUMN user_platform_configs.api_key IS 'Chave de API da plataforma (se aplicável)';
COMMENT ON COLUMN user_platform_configs.webhook_secret IS 'Segredo para validação de webhook (se aplicável)';
COMMENT ON COLUMN user_platform_configs.last_webhook_at IS 'Data/hora do último webhook recebido';
COMMENT ON COLUMN user_platform_configs.webhook_count IS 'Contador de webhooks recebidos';


-- 4. Criar índices para performance
-- ============================================================================

-- Índice para busca rápida por transação externa
CREATE INDEX IF NOT EXISTS idx_sales_external_transaction 
ON sales_events(external_transaction_id) 
WHERE external_transaction_id IS NOT NULL;

-- Índice para busca por plataforma e status
CREATE INDEX IF NOT EXISTS idx_sales_platform_status 
ON sales_events(platform_origin, status);

-- Índice para busca por usuário e plataforma
CREATE INDEX IF NOT EXISTS idx_user_platform_configs_user 
ON user_platform_configs(user_id, platform_name);

-- Índice GIN para busca em metadados JSON
CREATE INDEX IF NOT EXISTS idx_sales_platform_metadata 
ON sales_events USING GIN (platform_metadata);


-- 5. Criar função para atualizar timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_supported_platforms_updated_at 
BEFORE UPDATE ON supported_platforms 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_platform_configs_updated_at 
BEFORE UPDATE ON user_platform_configs 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- 6. Criar view para estatísticas por plataforma
-- ============================================================================

CREATE OR REPLACE VIEW platform_statistics AS
SELECT 
  se.platform_origin,
  sp.display_name,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE se.status = 'paid') as paid_count,
  COUNT(*) FILTER (WHERE se.status = 'waiting_payment') as pending_count,
  COUNT(*) FILTER (WHERE se.status = 'refused') as refused_count,
  SUM(se.value) FILTER (WHERE se.status = 'paid') as total_revenue,
  AVG(se.value) FILTER (WHERE se.status = 'paid') as avg_ticket,
  MIN(se.created_at) as first_sale,
  MAX(se.created_at) as last_sale
FROM sales_events se
LEFT JOIN supported_platforms sp ON se.platform_origin = sp.name
GROUP BY se.platform_origin, sp.display_name;

COMMENT ON VIEW platform_statistics IS 'Estatísticas agregadas por plataforma de pagamento';


-- 7. Criar função para registrar webhook recebido
-- ============================================================================

CREATE OR REPLACE FUNCTION register_webhook_received(
  p_user_id UUID,
  p_platform_name TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_platform_configs (user_id, platform_name, last_webhook_at, webhook_count)
  VALUES (p_user_id, p_platform_name, NOW(), 1)
  ON CONFLICT (user_id, platform_name) 
  DO UPDATE SET 
    last_webhook_at = NOW(),
    webhook_count = user_platform_configs.webhook_count + 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION register_webhook_received IS 'Registra recebimento de webhook e atualiza contador';


-- 8. Adicionar constraints de validação
-- ============================================================================

-- Validar que platform_origin existe em supported_platforms
-- (Comentado para não quebrar dados existentes, habilitar após migração)
-- ALTER TABLE sales_events
-- ADD CONSTRAINT fk_sales_platform 
-- FOREIGN KEY (platform_origin) 
-- REFERENCES supported_platforms(name);

-- Validar que platform_name existe em supported_platforms
ALTER TABLE user_platform_configs
ADD CONSTRAINT fk_user_platform 
FOREIGN KEY (platform_name) 
REFERENCES supported_platforms(name);


-- 9. Migrar dados existentes (se necessário)
-- ============================================================================

-- Atualizar plataformas existentes para lowercase
UPDATE sales_events 
SET platform_origin = LOWER(platform_origin) 
WHERE platform_origin IS NOT NULL;

-- Garantir que produtos tenham platform definida
UPDATE products 
SET platform = 'kiwify' 
WHERE platform IS NULL OR platform = '';


-- 10. Grants de permissão (ajustar conforme necessário)
-- ============================================================================

-- Permitir leitura das plataformas suportadas
GRANT SELECT ON supported_platforms TO anon, authenticated;

-- Permitir CRUD em user_platform_configs para usuários autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON user_platform_configs TO authenticated;

-- Permitir leitura da view de estatísticas
GRANT SELECT ON platform_statistics TO authenticated;


-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Verificar resultado
SELECT 
  'sales_events' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT platform_origin) as unique_platforms
FROM sales_events
UNION ALL
SELECT 
  'supported_platforms' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE is_active = true) as active_platforms
FROM supported_platforms;
