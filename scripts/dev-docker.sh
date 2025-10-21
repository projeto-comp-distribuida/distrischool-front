#!/bin/bash

# DistriSchool Development Docker Script
# This script helps you start the development environment with Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from env.example..."
        if [ -f env.example ]; then
            cp env.example .env
            print_warning "Please edit .env file with your actual configuration values"
            print_warning "Especially update ACR_REGISTRY with your Azure Container Registry URL"
        else
            print_error "env.example file not found. Please create a .env file manually."
            exit 1
        fi
    fi
    print_success ".env file found"
}

# Pull latest images from ACR
pull_images() {
    print_status "Pulling latest microservice images from ACR..."
    
    # Source the .env file to get ACR_REGISTRY
    source .env
    
    if [ -z "$ACR_REGISTRY" ] || [ "$ACR_REGISTRY" = "your-acr-registry.azurecr.io" ]; then
        print_warning "ACR_REGISTRY not configured in .env file. Skipping image pull."
        return
    fi
    
    # Login to ACR (you might need to configure this)
    print_status "Logging into Azure Container Registry..."
    az acr login --name $(echo $ACR_REGISTRY | cut -d'.' -f1) || {
        print_warning "Failed to login to ACR. Make sure you're logged into Azure CLI."
        print_warning "Continuing without pulling latest images..."
        return
    }
    
    # Pull images
    docker pull $ACR_REGISTRY/distrischool-auth-service:latest || print_warning "Failed to pull auth service image"
    docker pull $ACR_REGISTRY/student-management-service:latest || print_warning "Failed to pull student management service image"
    docker pull $ACR_REGISTRY/microservice-teacher:latest || print_warning "Failed to pull teacher service image"
    
    print_success "Image pull completed"
}

# Start services
start_services() {
    print_status "Starting DistriSchool development environment..."
    
    # Start infrastructure services first
    print_status "Starting infrastructure services (PostgreSQL, Redis, Kafka)..."
    docker-compose -f docker-compose-dev.yml up -d postgres redis zookeeper kafka kafka-ui
    
    # Wait for infrastructure to be ready
    print_status "Waiting for infrastructure services to be ready..."
    sleep 10
    
    # Start microservices
    print_status "Starting microservices..."
    docker-compose -f docker-compose-dev.yml up -d microservice-auth-dev student-management-service-dev microservice-teacher-dev
    
    # Start frontend
    print_status "Starting frontend..."
    docker-compose -f docker-compose-dev.yml up -d frontend-dev
    
    print_success "All services started!"
}

# Show service URLs
show_urls() {
    echo ""
    print_status "Service URLs:"
    echo "  Frontend:           http://localhost:3000"
    echo "  Auth Service:       http://localhost:8081"
    echo "  Student Service:    http://localhost:8082"
    echo "  teacher Service:   http://localhost:8083"
    echo "  Kafka UI:           http://localhost:8090"
    echo "  PostgreSQL:         localhost:5434"
    echo "  Redis:              localhost:6379"
    echo ""
}

# Main function
main() {
    echo "🚀 DistriSchool Development Environment Setup"
    echo "=============================================="
    
    check_docker
    check_env_file
    
    # Ask if user wants to pull latest images
    read -p "Do you want to pull latest microservice images from ACR? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        pull_images
    fi
    
    start_services
    show_urls
    
    print_success "Development environment is ready!"
    print_status "Use 'docker-compose -f docker-compose-dev.yml logs -f' to view logs"
    print_status "Use 'docker-compose -f docker-compose-dev.yml down' to stop all services"
}

# Handle script arguments
case "${1:-}" in
    "stop")
        print_status "Stopping all services..."
        docker-compose -f docker-compose-dev.yml down
        print_success "All services stopped"
        ;;
    "restart")
        print_status "Restarting all services..."
        docker-compose -f docker-compose-dev.yml down
        sleep 5
        docker-compose -f docker-compose-dev.yml up -d
        print_success "All services restarted"
        show_urls
        ;;
    "logs")
        docker-compose -f docker-compose-dev.yml logs -f
        ;;
    "status")
        docker-compose -f docker-compose-dev.yml ps
        ;;
    *)
        main
        ;;
esac
