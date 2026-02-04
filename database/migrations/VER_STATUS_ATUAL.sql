-- ============================================================================
-- VERIFICAR STATUS ATUAL DOS ARQUIVOS
-- Execute para ver se o novo upload foi processado
-- ============================================================================

SELECT 
  id,
  file_name,
  processing_status,
  processing_error,
  created_at,
  LENGTH(extracted_text) as text_length
FROM knowledge_files
ORDER BY created_at DESC
LIMIT 5;
