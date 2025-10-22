package com.distrischool.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Spring Cloud Gateway API Gateway Application
 * 
 * This service acts as the central entry point for all microservice communication,
 * providing routing, load balancing, and CORS handling capabilities.
 * 
 * Features:
 * - Route requests to appropriate microservices
 * - CORS handling for frontend communication
 * - Health monitoring and metrics
 * - Request/Response logging
 */
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}
