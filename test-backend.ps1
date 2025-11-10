# Script de Teste do Backend - DistriSchool
# Testa os endpoints principais da API

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "TESTE DO BACKEND - DISTRISCHOOL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://distrischool.ddns.net"
$apiBase = "$baseUrl/api/v1"

# Função para testar endpoint
function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$Description
    )
    
    Write-Host "[INFO] Testando: $Description" -ForegroundColor Cyan
    Write-Host "  $Method $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Method = $Method
            Uri = $Url
            Headers = @{
                "Content-Type" = "application/json"
            }
            ErrorAction = "Stop"
            TimeoutSec = 10
        }
        
        # Adicionar headers customizados
        foreach ($key in $Headers.Keys) {
            $params.Headers[$key] = $Headers[$key]
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        
        Write-Host "[SUCCESS] Sucesso - Status: $statusCode" -ForegroundColor Green
        
        # Tentar parsear JSON
        try {
            $jsonResponse = $response.Content | ConvertFrom-Json
            Write-Host "  Resposta: $($jsonResponse | ConvertTo-Json -Depth 2 -Compress)" -ForegroundColor Gray
        } catch {
            Write-Host "  Resposta: $($response.Content)" -ForegroundColor Gray
        }
        
        return $true
    }
    catch {
        $statusCode = $null
        $errorMessage = $_.Exception.Message
        
        # Tentar obter status code
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode.value__
        }
        
        if ($statusCode) {
            Write-Host "[WARN] Status: $statusCode - $errorMessage" -ForegroundColor Yellow
            
            # Tentar ler a resposta de erro
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $responseBody = $reader.ReadToEnd()
                Write-Host "  Resposta de erro: $responseBody" -ForegroundColor Yellow
            } catch {
                # Ignorar se não conseguir ler
            }
        } else {
            Write-Host "[ERROR] Erro: $errorMessage" -ForegroundColor Red
        }
        
        return $false
    }
}

# 1. Teste de Health Check - Auth Service
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "1. TESTE DE HEALTH CHECK" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$healthTests = @(
    @{
        Method = "GET"
        Url = "$apiBase/auth/health"
        Description = "Auth Service Health Check"
    }
)

$healthResults = @()
foreach ($test in $healthTests) {
    $result = Test-Endpoint @test
    $healthResults += $result
    Start-Sleep -Seconds 1
}

Write-Host ""

# 2. Teste de Notificações (REST)
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "2. TESTE DE NOTIFICACOES (REST API)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "[INFO] Testando endpoint de notificacoes (requer autenticacao)" -ForegroundColor Cyan
Write-Host "[WARN] Este teste requer token de autenticacao" -ForegroundColor Yellow
Write-Host "  GET $apiBase/notifications" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Method GET -Uri "$apiBase/notifications" -Headers @{"Content-Type" = "application/json"} -TimeoutSec 10 -ErrorAction Stop
    Write-Host "[SUCCESS] Notificacoes recuperadas com sucesso" -ForegroundColor Green
    Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    $statusCode = $null
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode.value__
    }
    
    if ($statusCode -eq 401) {
        Write-Host "[WARN] Status 401 - Nao autenticado (esperado sem token)" -ForegroundColor Yellow
    } elseif ($statusCode) {
        Write-Host "[WARN] Status $statusCode" -ForegroundColor Yellow
    } else {
        Write-Host "[ERROR] Erro de conectividade: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# 3. Teste de Conectividade WebSocket
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "3. TESTE DE WEBSOCKET" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "[INFO] Testando endpoint WebSocket" -ForegroundColor Cyan
$wsUrl = "ws://distrischool.ddns.net/ws/notifications"
Write-Host "  WebSocket: $wsUrl" -ForegroundColor Gray
Write-Host "[WARN] WebSocket requer conexao em tempo real (teste manual necessario)" -ForegroundColor Yellow
Write-Host "[INFO] Para testar WebSocket, use o frontend apos fazer login como ADMIN" -ForegroundColor Cyan

Write-Host ""

# 4. Teste de Conectividade Básica
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "4. TESTE DE CONECTIVIDADE BASICA" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "[INFO] Testando conectividade com o servidor..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[SUCCESS] Servidor acessivel - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Nao foi possivel conectar ao servidor: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "[INFO] Verifique se o servidor esta rodando e acessivel" -ForegroundColor Cyan
}

Write-Host ""

# 5. Resumo dos Testes
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "RESUMO DOS TESTES" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

$totalTests = $healthResults.Count
$passedTests = ($healthResults | Where-Object { $_ -eq $true }).Count
$failedTests = $totalTests - $passedTests

Write-Host "Total de testes: $totalTests" -ForegroundColor White
Write-Host "[SUCCESS] Testes passados: $passedTests" -ForegroundColor Green
if ($failedTests -gt 0) {
    Write-Host "[ERROR] Testes falhados: $failedTests" -ForegroundColor Red
} else {
    Write-Host "[SUCCESS] Testes falhados: 0" -ForegroundColor Green
}

Write-Host ""
Write-Host "[INFO] Dica: Para testar endpoints autenticados, primeiro faca login e obtenha um token" -ForegroundColor Cyan
Write-Host "[INFO] Para testar WebSocket, use o frontend apos fazer login como ADMIN" -ForegroundColor Cyan
