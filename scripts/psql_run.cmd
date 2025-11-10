@echo off
REM scripts/psql_run.cmd
REM Use: set PG_CONN=postgresql://user:pass@host:port/dbname?sslmode=require
REM then: psql_run.cmd scripts/modify_roles.sql
if "%~1"=="" (
  echo Uso: psql_run.cmd path_to_sql_file.sql
  exit /b 1
)
if "%PG_CONN%"=="" (
  echo Por favor defina a variavel de ambiente PG_CONN com a connection string.
  echo Exemplo: set PG_CONN=postgresql://user:pass@host:port/dbname?sslmode=require
  exit /b 1
)
psql "%PG_CONN%" -f "%~1"

