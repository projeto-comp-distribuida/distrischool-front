# Modificar roles no PostgreSQL (scripts)

Estes scripts ajudam a listar, criar e atribuir roles (grupos) em um banco PostgreSQL.

ATENÇÃO: Não compartilhe connection strings sensíveis em locais públicos.

Arquivos:
- scripts/modify_roles.sql  - script SQL que lista roles e contém comandos de exemplo para criar/grant
- scripts/psql_run.cmd      - wrapper simples para Windows cmd.exe
- scripts/psql_run.ps1      - wrapper PowerShell

Como usar (cmd.exe):
1) Defina a variável `PG_CONN` com a sua connection string (sem colocar em histórico público):
   set PG_CONN=postgresql://neondb_owner:npg_dw4cyYv9sCoX@ep-crimson-night-a4vpbgkk-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

2) Execute o SQL helper:
   scripts\psql_run.cmd scripts\modify_roles.sql

Como usar (PowerShell):
1) Defina a variável de ambiente:
   $env:PG_CONN = 'postgresql://neondb_owner:npg_dw4cyYv9sCoX@ep-crimson-night-a4vpbgkk-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

2) Execute:
   .\scripts\psql_run.ps1 scripts\modify_roles.sql

Observações e passos seguros:
- O script SQL contém exemplos de `GRANT app_admin TO existing_user;` e instruções para `ALTER ROLE` caso precise transformar role em LOGIN. Edite o SQL conforme necessário.
- Se precisar criar um usuário do banco com login e senha, prefira rodar comandos interativos e não salvar senhas em arquivos de texto.
- Se sua aplicação mantém roles em uma tabela (ex.: `users`), ajuste as queries na seção 5 do SQL.

Se quiser, posso:
- Gerar comandos SQL específicos para atribuir a role `app_admin` ao usuário com email `danilopessoa@edu.unifor.br` — mas preciso que confirme qual é o campo/estrutura da tabela de usuários no banco (ex.: tabela `users`, coluna `email`, coluna `roles` é texto/json/array?).
- Ou posso executar localmente se você me autorizar a usar a connection string aqui (não recomendado por segurança). Prefiro que você execute os scripts localmente e cole a saída/erros aqui para eu ajudar a interpretar.


