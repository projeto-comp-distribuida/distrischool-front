-- scripts/modify_roles.sql
-- Script helper para listar/criar/modificar roles no PostgreSQL.
-- INSTRUÇÕES:
-- 1) Defina a variável de ambiente PG_CONN com a connection string segura (não a cole em logs públicos):
--    Windows (cmd):   set PG_CONN=postgresql://user:pass@host:port/dbname?sslmode=require
--    PowerShell:       $env:PG_CONN='postgresql://user:pass@host:port/dbname?sslmode=require'
-- 2) Execute: psql "%PG_CONN%" -f scripts/modify_roles.sql   (cmd) ou psql $env:PG_CONN -f ./scripts/modify_roles.sql (PowerShell)
-- 3) Edite as seções abaixo conforme necessário (nomes de roles / usuários do banco / atributos).

-- -----------------------------------------------------------------------------
-- 1) Verificar roles existentes (consulta SQL)
-- (Note: \du é comando psql meta; usando SQL puro abaixo para compatibilidade em -f)
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles
ORDER BY rolname;

-- -----------------------------------------------------------------------------
-- 2) Criar uma role de grupo (se já não existir)
-- Substitua 'app_admin' pelo nome desejado para a role/grupo.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin NOINHERIT;
    RAISE NOTICE 'Role app_admin criada';
  ELSE
    RAISE NOTICE 'Role app_admin já existe';
  END IF;
END$$;

-- Opcional: dar permissões à role (ex.: criar DB / criar role / superuser) - ajuste com cautela
-- Exemplo: permitir que role tenha permissões de criar objetos no banco
-- ALTER ROLE app_admin WITH CREATEROLE;

-- -----------------------------------------------------------------------------
-- 3) Conceder a role a um usuário existente (usuários são roles com LOGIN)
-- Substitua 'existing_user' pelo nome do role/login do usuário que deve receber a role app_admin
-- Se você não souber os logins, verifique a saída da consulta acima (rolcanlogin = true)

-- Exemplo real (descomente e ajuste antes de rodar):
-- GRANT app_admin TO existing_user;

-- -----------------------------------------------------------------------------
-- 4) Tornar uma role com LOGIN (transformar em usuário) - usar apenas se necessário
-- ALTER ROLE app_admin WITH LOGIN PASSWORD 'uma-senha-segura-aqui';
-- OBS: Evite colocar senhas em arquivos; prefira criar um usuário separado com CREATE ROLE ... LOGIN PASSWORD '...' e não salvar senhas em repositório.

-- -----------------------------------------------------------------------------
-- 5) Exemplo de alteração de roles em tabela de aplicação (caso haja uma tabela "users" com coluna roles)
-- ATENÇÃO: ajuste conforme o esquema real da sua aplicação.
-- Exemplos genéricos:
-- Se roles for um texto simples:
-- UPDATE users SET role = 'ADMIN' WHERE email = 'usuario@exemplo.com';

-- Se roles for array text[]:
-- UPDATE users SET roles = array_append(roles, 'ADMIN') WHERE email = 'usuario@exemplo.com' AND NOT (roles @> ARRAY['ADMIN']);

-- Se roles for JSON/JSONB (ex.: {"roles": [...]}) ajustar com jsonb_set ou concatenação
-- Ex.: UPDATE users SET roles = (roles::jsonb || '"ADMIN"')::text WHERE ... -- adaptar conforme esquema

-- -----------------------------------------------------------------------------
-- 6) Checar membros da role app_admin
SELECT roleid::regrole::text AS role_name, member::regrole::text AS member_name
FROM pg_auth_members
JOIN pg_roles r ON r.oid = roleid
WHERE r.rolname = 'app_admin';

-- FIM

