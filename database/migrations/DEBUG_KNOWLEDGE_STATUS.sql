-- ============================================================================
-- DEBUG: Verificar se há arquivos processados
-- Execute para ver se tem arquivos prontos para usar
-- ============================================================================

-- Ver arquivos com texto extraído
SELECT 
  id,
  user_id,
  file_name,
  processing_status,
  LENGTH(extracted_text) as text_length,
  SUBSTRING(extracted_text, 1, 100) as preview
FROM knowledge_files
WHERE processing_status = 'completed'
  AND extracted_text IS NOT NULL
ORDER BY created_at DESC;

-- Se retornar vazio, verificar todos os status
SELECT 
  processing_status,
  COUNT(*) as count,
  STRING_AGG(file_name, ', ') as files
FROM knowledge_files
GROUP BY processing_status;
