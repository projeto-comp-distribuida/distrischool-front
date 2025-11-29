# scripts/psql_run.ps1
# Use: $env:PG_CONN = 'postgresql://user:pass@host:port/dbname?sslmode=require'; .\psql_run.ps1 scripts/modify_roles.sql
param(
  [string]$sqlFile = "scripts/modify_roles.sql"
)
if (-not $env:PG_CONN) {
  Write-Error "Por favor defina a variavel de ambiente PG_CONN com a connection string. Ex: $env:PG_CONN='postgresql://user:pass@host:port/db?sslmode=require'"
  exit 1
}
if (-not (Test-Path $sqlFile)) {
  Write-Error "Arquivo SQL nao encontrado: $sqlFile"
  exit 1
}
$psql = "psql"
$cmd = "$psql `"$env:PG_CONN`" -f `"$sqlFile`""
Write-Output "Executando: $cmd"
Invoke-Expression $cmd

