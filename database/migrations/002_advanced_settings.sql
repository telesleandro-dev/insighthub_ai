-- ============================================================================
-- MIGRATION: Advanced Settings Tables
-- Data: 2026-01-27
-- Descrição: Adiciona tabelas para configurações avançadas de recuperação,
--            descontos e base de conhecimento
-- ============================================================================

-- ============================================================================
-- 1. TABELA: user_recovery_settings
-- Descrição: Configurações de recuperação automática de vendas
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_recovery_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  ai_tone TEXT DEFAULT 'consultivo' CHECK (ai_tone IN ('persuasivo', 'consultivo', 'cordial')),
  wait_time_minutes INTEGER DEFAULT 60 CHECK (wait_time_minutes > 0),
  max_attempts INTEGER DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  retry_interval_hours INTEGER DEFAULT 24 CHECK (retry_interval_hours > 0),
  work_start_hour INTEGER DEFAULT 8 CHECK (work_start_hour BETWEEN 0 AND 23),
  work_end_hour INTEGER DEFAULT 22 CHECK (work_end_hour BETWEEN 0 AND 23),
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_recovery UNIQUE(user_id)
);

COMMENT ON TABLE user_recovery_settings IS 'Configurações de recuperação automática de vendas abandonadas';
COMMENT ON COLUMN user_recovery_settings.ai_tone IS 'Tom de voz da IA: persuasivo, consultivo ou cordial';
COMMENT ON COLUMN user_recovery_settings.wait_time_minutes IS 'Tempo de espera em minutos antes de abordar o cliente';
COMMENT ON COLUMN user_recovery_settings.max_attempts IS 'Número máximo de tentativas de recuperação';
COMMENT ON COLUMN user_recovery_settings.retry_interval_hours IS 'Intervalo em horas entre tentativas';
COMMENT ON COLUMN user_recovery_settings.work_start_hour IS 'Hora de início do expediente (0-23)';
COMMENT ON COLUMN user_recovery_settings.work_end_hour IS 'Hora de fim do expediente (0-23)';

-- ============================================================================
-- 2. TABELA: user_discount_settings
-- Descrição: Configurações de descontos para recuperação
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_discount_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  default_discount_percent INTEGER DEFAULT 10 CHECK (default_discount_percent BETWEEN 0 AND 100),
  coupon_code TEXT,
  coupon_validity_hours INTEGER DEFAULT 48 CHECK (coupon_validity_hours > 0),
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_discount UNIQUE(user_id)
);

COMMENT ON TABLE user_discount_settings IS 'Configurações de descontos automáticos para recuperação';
COMMENT ON COLUMN user_discount_settings.default_discount_percent IS 'Percentual de desconto padrão (0-100)';
COMMENT ON COLUMN user_discount_settings.coupon_code IS 'Código do cupom a ser oferecido';
COMMENT ON COLUMN user_discount_settings.coupon_validity_hours IS 'Validade do cupom em horas';

-- ============================================================================
-- 3. TABELA: user_knowledge_base
-- Descrição: Base de conhecimento para IA (FAQs, objeções, documentos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('faq', 'objection', 'document')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_knowledge_user_type ON user_knowledge_base(user_id, type);

COMMENT ON TABLE user_knowledge_base IS 'Base de conhecimento para alimentar a IA';
COMMENT ON COLUMN user_knowledge_base.type IS 'Tipo: faq (pergunta frequente), objection (objeção comum), document (documento)';
COMMENT ON COLUMN user_knowledge_base.title IS 'Título ou pergunta';
COMMENT ON COLUMN user_knowledge_base.content IS 'Conteúdo ou resposta';
COMMENT ON COLUMN user_knowledge_base.file_url IS 'URL do arquivo (para documentos)';

-- ============================================================================
-- 4. ATUALIZAR: user_platform_configs
-- Descrição: Adicionar campos de estatísticas
-- ============================================================================

ALTER TABLE user_platform_configs 
ADD COLUMN IF NOT EXISTS last_webhook_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_webhooks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_abandonments INTEGER DEFAULT 0;

COMMENT ON COLUMN user_platform_configs.last_webhook_at IS 'Data/hora do último webhook recebido';
COMMENT ON COLUMN user_platform_configs.total_webhooks IS 'Total de webhooks recebidos';
COMMENT ON COLUMN user_platform_configs.total_sales IS 'Total de vendas aprovadas';
COMMENT ON COLUMN user_platform_configs.total_abandonments IS 'Total de carrinhos abandonados';

-- ============================================================================
-- 5. FUNÇÃO: Atualizar estatísticas de plataforma
-- Descrição: Trigger para atualizar contadores quando webhook chega
-- ============================================================================

CREATE OR REPLACE FUNCTION update_platform_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza estatísticas da plataforma
  UPDATE user_platform_configs
  SET 
    last_webhook_at = NEW.created_at,
    total_webhooks = total_webhooks + 1,
    total_sales = CASE 
      WHEN NEW.status = 'paid' THEN total_sales + 1 
      ELSE total_sales 
    END,
    total_abandonments = CASE 
      WHEN NEW.status IN ('waiting_payment', 'refused') THEN total_abandonments + 1 
      ELSE total_abandonments 
    END,
    updated_at = NOW()
  WHERE user_id = NEW.user_id 
    AND platform = NEW.platform_origin;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_platform_stats ON sales_events;
CREATE TRIGGER trigger_update_platform_stats
  AFTER INSERT ON sales_events
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_stats();

COMMENT ON FUNCTION update_platform_stats() IS 'Atualiza estatísticas de plataforma quando novo webhook chega';

-- ============================================================================
-- 6. FUNÇÃO: Atualizar timestamp de updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_recovery_updated_at ON user_recovery_settings;
CREATE TRIGGER trigger_recovery_updated_at
  BEFORE UPDATE ON user_recovery_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_discount_updated_at ON user_discount_settings;
CREATE TRIGGER trigger_discount_updated_at
  BEFORE UPDATE ON user_discount_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_knowledge_updated_at ON user_knowledge_base;
CREATE TRIGGER trigger_knowledge_updated_at
  BEFORE UPDATE ON user_knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. DADOS INICIAIS: Configurações padrão para usuário existente
-- ============================================================================

-- Inserir configurações padrão de recuperação
INSERT INTO user_recovery_settings (user_id, ai_tone, wait_time_minutes, max_attempts, retry_interval_hours, work_start_hour, work_end_hour, enabled)
VALUES ('c048be53-fff6-4446-a8b8-6abf79fce171', 'consultivo', 60, 3, 24, 8, 22, true)
ON CONFLICT (user_id) DO NOTHING;

-- Inserir configurações padrão de desconto
INSERT INTO user_discount_settings (user_id, default_discount_percent, coupon_code, coupon_validity_hours, enabled)
VALUES ('c048be53-fff6-4446-a8b8-6abf79fce171', 10, 'RECUPERA10', 48, false)
ON CONFLICT (user_id) DO NOTHING;

-- Inserir FAQs de exemplo
INSERT INTO user_knowledge_base (user_id, type, title, content)
VALUES 
  ('c048be53-fff6-4446-a8b8-6abf79fce171', 'faq', 'Como funciona o pagamento?', 'Aceitamos cartão de crédito, PIX e boleto. O pagamento é processado de forma segura pela plataforma.'),
  ('c048be53-fff6-4446-a8b8-6abf79fce171', 'faq', 'Qual o prazo de acesso?', 'O acesso é vitalício! Você pode acessar o conteúdo quando quiser, sem prazo de expiração.'),
  ('c048be53-fff6-4446-a8b8-6abf79fce171', 'objection', 'Está muito caro', 'Entendo sua preocupação com o investimento. Que tal um desconto especial de 10% válido por 48h? Use o cupom RECUPERA10 no checkout!')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. VIEWS: Visões úteis para dashboard
-- ============================================================================

-- View: Resumo de configurações por usuário
CREATE OR REPLACE VIEW v_user_settings_summary AS
SELECT 
  u.id as user_id,
  u.email,
  -- Plataformas
  COUNT(DISTINCT upc.platform) as platforms_connected,
  COALESCE(SUM(upc.total_webhooks), 0) as total_webhooks,
  COALESCE(SUM(upc.total_sales), 0) as total_sales,
  COALESCE(SUM(upc.total_abandonments), 0) as total_abandonments,
  -- Recuperação
  urs.enabled as recovery_enabled,
  urs.ai_tone,
  urs.max_attempts,
  -- Descontos
  uds.enabled as discount_enabled,
  uds.default_discount_percent,
  -- Base de conhecimento
  (SELECT COUNT(*) FROM user_knowledge_base WHERE user_id = u.id AND type = 'faq') as total_faqs,
  (SELECT COUNT(*) FROM user_knowledge_base WHERE user_id = u.id AND type = 'objection') as total_objections
FROM auth.users u
LEFT JOIN user_platform_configs upc ON u.id = upc.user_id
LEFT JOIN user_recovery_settings urs ON u.id = urs.user_id
LEFT JOIN user_discount_settings uds ON u.id = uds.user_id
GROUP BY u.id, u.email, urs.enabled, urs.ai_tone, urs.max_attempts, uds.enabled, uds.default_discount_percent;

COMMENT ON VIEW v_user_settings_summary IS 'Resumo completo das configurações de cada usuário';

-- ============================================================================
-- 9. PERMISSÕES (RLS desabilitado para service role)
-- ============================================================================

-- Desabilitar RLS para permitir acesso via Service Role Key
ALTER TABLE user_recovery_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_discount_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_knowledge_base DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Migration concluída com sucesso!';
  RAISE NOTICE '📊 Tabelas criadas: user_recovery_settings, user_discount_settings, user_knowledge_base';
  RAISE NOTICE '🔄 Triggers criados: update_platform_stats, updated_at automático';
  RAISE NOTICE '👁️ View criada: v_user_settings_summary';
  RAISE NOTICE '✨ Dados iniciais inseridos para usuário c048be53-fff6-4446-a8b8-6abf79fce171';
END $$;
