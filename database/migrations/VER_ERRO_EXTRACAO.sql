-- ============================================================================
-- VER ERRO DE PROCESSAMENTO
-- Execute para ver o que deu errado na extração
-- ============================================================================

SELECT 
  file_name,
  processing_status,
  processing_error,
  created_at,
  file_type,
  file_size
FROM knowledge_files
WHERE processing_status = 'failed'
ORDER BY created_at DESC;
