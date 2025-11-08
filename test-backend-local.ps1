# Script de Teste do Backend Local - DistriSchool
# Testa endpoints locais e configurações

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TESTE DO BACKEND LOCAL - DISTRISCHOOL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# URLs para testar
$urls = @(
    "http://localhost:3000",
    "http://localhost:8080",
    "http://192.168.1.7:8080",
    "http://distrischool.ddns.net",
    "http://distrischool.ddns.net:80",
    "http://distrischool.ddns.net:8080"
)

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TESTANDO CONECTIVIDADE COM DIVERSAS URLs" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

foreach ($url in $urls) {
    Write-Host "[TEST] Testando: $url" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 3 -ErrorAction Stop
        Write-Host "[SUCCESS] $url - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
        }
        
        if ($statusCode) {
            Write-Host "[WARN] $url - Status: $statusCode" -ForegroundColor Yellow
        } else {
            Write-Host "[ERROR] $url - Nao acessivel: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TESTANDO ENDPOINTS DA API" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$apiEndpoints = @(
    @{ Url = "http://192.168.1.7:8080/api/v1/auth/health"; Name = "Auth Health (Local)" },
    @{ Url = "http://distrischool.ddns.net/api/v1/auth/health"; Name = "Auth Health (Remote)" },
    @{ Url = "http://192.168.1.7:8080/api/v1/notifications"; Name = "Notifications (Local)" },
    @{ Url = "http://distrischool.ddns.net/api/v1/notifications"; Name = "Notifications (Remote)" }
)

foreach ($endpoint in $apiEndpoints) {
    Write-Host "[TEST] $($endpoint.Name)" -ForegroundColor Yellow
    Write-Host "  URL: $($endpoint.Url)" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -Method GET -Headers @{"Content-Type" = "application/json"} -TimeoutSec 5 -ErrorAction Stop
        Write-Host "[SUCCESS] Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Tentar parsear JSON
        try {
            $json = $response.Content | ConvertFrom-Json
            Write-Host "  Resposta: $($json | ConvertTo-Json -Depth 1 -Compress)" -ForegroundColor Gray
        } catch {
            Write-Host "  Resposta: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))" -ForegroundColor Gray
        }
    } catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
        }
        
        if ($statusCode -eq 401) {
            Write-Host "[WARN] Status 401 - Nao autenticado (normal)" -ForegroundColor Yellow
        } elseif ($statusCode) {
            Write-Host "[WARN] Status: $statusCode" -ForegroundColor Yellow
        } else {
            Write-Host "[ERROR] Erro: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    Start-Sleep -Milliseconds 500
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "VERIFICANDO VARIAVEIS DE AMBIENTE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$envVars = @(
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_AUTH_SERVICE_URL",
    "NEXT_PUBLIC_STUDENT_SERVICE_URL",
    "NEXT_PUBLIC_TEACHER_SERVICE_URL"
)

foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if ($value) {
        Write-Host "[INFO] $var = $value" -ForegroundColor Green
    } else {
        Write-Host "[WARN] $var nao definida" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "RECOMENDACOES" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[INFO] 1. Verifique se o servidor backend esta rodando" -ForegroundColor Cyan
Write-Host "[INFO] 2. Verifique se o API Gateway esta configurado corretamente" -ForegroundColor Cyan
Write-Host "[INFO] 3. Verifique as configuracoes de firewall" -ForegroundColor Cyan
Write-Host "[INFO] 4. Para testar localmente, use: http://192.168.1.7:8080" -ForegroundColor Cyan
Write-Host "[INFO] 5. Para testar remotamente, verifique se distrischool.ddns.net esta acessivel" -ForegroundColor Cyan

