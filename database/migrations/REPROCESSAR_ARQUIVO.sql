-- ============================================================================
-- REPROCESSAR ARQUIVO FALHADO
-- Execute para marcar arquivo como pending e tentar novamente
-- ============================================================================

-- 1. Ver ID do arquivo falhado
SELECT id, file_name, processing_error
FROM knowledge_files
WHERE processing_status = 'failed'
LIMIT 1;

-- 2. Marcar como pending para reprocessar
UPDATE knowledge_files
SET processing_status = 'pending',
    processing_error = NULL,
    extracted_text = NULL
WHERE processing_status = 'failed';

-- 3. Retornar ID para chamar API de extração
SELECT id, user_id, file_name
FROM knowledge_files
WHERE processing_status = 'pending'
LIMIT 1;
