-- =================================================================
-- AUDITORIA COMPLETA DE SEGURANÇA RLS (Row Level Security)
-- =================================================================
-- Este script verifica o status RLS e a contagem de políticas
-- para todas as tabelas no esquema 'public'.

SELECT
    c.relname AS table_name,
    CASE
        WHEN c.relrowsecurity THEN '✅ RLS ATIVO'
        ELSE '❌ RLS DESATIVADO'
    END AS rls_status,
    (SELECT COUNT(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count,
    CASE
        WHEN c.relrowsecurity AND (SELECT COUNT(*) FROM pg_policy p WHERE p.polrelid = c.oid) = 0 THEN '⚠️ ATENÇÃO: RLS ATIVO, MAS SEM POLÍTICAS'
        WHEN c.relrowsecurity AND (SELECT COUNT(*) FROM pg_policy p WHERE p.polrelid = c.oid) > 0 THEN '✅ SEGURO: RLS ATIVO COM POLÍTICAS'
        ELSE '❌ VULNERÁVEL: RLS DESATIVADO'
    END AS security_assessment
FROM
    pg_class c
JOIN
    pg_namespace n ON n.oid = c.relnamespace
WHERE
    n.nspname = 'public' AND c.relkind = 'r' -- 'r' for regular tables
ORDER BY
    security_assessment DESC, table_name;