# DistriSchool Development Docker Script for Windows PowerShell
# This script helps you start the development environment with Docker Compose

param(
    [string]$Action = "start"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Check if Docker is running
function Test-Docker {
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker Desktop and try again."
        return $false
    }
}

# Check if .env file exists
function Test-EnvFile {
    if (-not (Test-Path ".env")) {
        Write-Warning ".env file not found. Creating from env.example..."
        if (Test-Path "env.example") {
            Copy-Item "env.example" ".env"
            Write-Warning "Please edit .env file with your actual configuration values"
            Write-Warning "Especially update ACR_REGISTRY with your Azure Container Registry URL"
        }
        else {
            Write-Error "env.example file not found. Please create a .env file manually."
            return $false
        }
    }
    Write-Success ".env file found"
    return $true
}

# Pull latest images from ACR
function Invoke-PullImages {
    Write-Status "Pulling latest microservice images from ACR..."
    
    # Read .env file
    $envContent = Get-Content ".env" -Raw
    $envVars = @{}
    $envContent -split "`n" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $envVars[$matches[1]] = $matches[2]
        }
    }
    
    $acrRegistry = $envVars["ACR_REGISTRY"]
    
    if (-not $acrRegistry -or $acrRegistry -eq "your-acr-registry.azurecr.io") {
        Write-Warning "ACR_REGISTRY not configured in .env file. Skipping image pull."
        return
    }
    
    # Login to ACR
    Write-Status "Logging into Azure Container Registry..."
    try {
        $registryName = $acrRegistry.Split('.')[0]
        az acr login --name $registryName
    }
    catch {
        Write-Warning "Failed to login to ACR. Make sure you're logged into Azure CLI."
        Write-Warning "Continuing without pulling latest images..."
        return
    }
    
    # Pull images
    try {
        docker pull "$acrRegistry/distrischool-auth-service:latest"
    }
    catch {
        Write-Warning "Failed to pull auth service image"
    }
    
    try {
        docker pull "$acrRegistry/student-management-service:latest"
    }
    catch {
        Write-Warning "Failed to pull student management service image"
    }
    
    try {
        docker pull "$acrRegistry/microservice-teacher:latest"
    }
    catch {
        Write-Warning "Failed to pull teacher service image"
    }
    
    Write-Success "Image pull completed"
}

# Start services
function Start-Services {
    Write-Status "Starting DistriSchool development environment..."
    
    # Start infrastructure services first
    Write-Status "Starting infrastructure services (PostgreSQL, Redis, Kafka)..."
    docker-compose -f docker-compose-dev.yml up -d postgres redis zookeeper kafka kafka-ui
    
    # Wait for infrastructure to be ready
    Write-Status "Waiting for infrastructure services to be ready..."
    Start-Sleep -Seconds 10
    
    # Start microservices
    Write-Status "Starting microservices..."
    docker-compose -f docker-compose-dev.yml up -d microservice-auth-dev student-management-service-dev microservice-teacher-dev
    
    # Start frontend
    Write-Status "Starting frontend..."
    docker-compose -f docker-compose-dev.yml up -d frontend-dev
    
    Write-Success "All services started!"
}

# Show service URLs
function Show-Urls {
    Write-Host ""
    Write-Status "Service URLs:"
    Write-Host "  Frontend:           http://192.168.1.7:3000"
    Write-Host "  Auth Service:       http://192.168.1.7:8081"
    Write-Host "  Student Service:    http://192.168.1.7:8082"
    Write-Host "  teacher Service:   http://192.168.1.7:8083"
    Write-Host "  Kafka UI:           http://192.168.1.7:8090"
    Write-Host "  PostgreSQL:         192.168.1.7:5434"
    Write-Host "  Redis:              192.168.1.7:6379"
    Write-Host ""
}

# Main function
function Start-Main {
    Write-Host "🚀 DistriSchool Development Environment Setup" -ForegroundColor $Green
    Write-Host "==============================================" -ForegroundColor $Green
    
    if (-not (Test-Docker)) { return }
    if (-not (Test-EnvFile)) { return }
    
    # Ask if user wants to pull latest images
    $pullImages = Read-Host "Do you want to pull latest microservice images from ACR? (y/N)"
    if ($pullImages -eq "y" -or $pullImages -eq "Y") {
        Invoke-PullImages
    }
    
    Start-Services
    Show-Urls
    
    Write-Success "Development environment is ready!"
    Write-Status "Use 'docker-compose -f docker-compose-dev.yml logs -f' to view logs"
    Write-Status "Use 'docker-compose -f docker-compose-dev.yml down' to stop all services"
}

# Handle script arguments
switch ($Action.ToLower()) {
    "stop" {
        Write-Status "Stopping all services..."
        docker-compose -f docker-compose-dev.yml down
        Write-Success "All services stopped"
    }
    "restart" {
        Write-Status "Restarting all services..."
        docker-compose -f docker-compose-dev.yml down
        Start-Sleep -Seconds 5
        docker-compose -f docker-compose-dev.yml up -d
        Write-Success "All services restarted"
        Show-Urls
    }
    "logs" {
        docker-compose -f docker-compose-dev.yml logs -f
    }
    "status" {
        docker-compose -f docker-compose-dev.yml ps
    }
    default {
        Start-Main
    }
}
