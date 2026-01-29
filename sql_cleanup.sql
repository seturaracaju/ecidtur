
-- Atenção: Este script deleta todas as respostas anteriores para evitar conflitos de tipo no Dashboard.
-- Use apenas se estiver em ambiente de desenvolvimento ou se desejar reiniciar os dados.

TRUNCATE TABLE responses;

-- Se desejar manter os dados mas apenas remover os inválidos, seria algo complexo de validar via SQL puro em JSONB.
-- Recomendado: Reiniciar a coleta com a nova estrutura padronizada.

-- Exemplo de consulta para verificar a nova estrutura (País/Estado/Cidade):
-- SELECT content->'geo_complete' FROM responses;
