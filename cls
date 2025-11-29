* [33m8111243[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmasterv2[m[33m, [m[1;32mmaster[m[33m)[m Refatorando serviçoes para garantir conectividade
* [33mc540b60[m Correções simples
* [33me57ff55[m Corrigindo erros do front
* [33mf35b373[m Criando serviços necessarios para integração
* [33m2ea8295[m Atualizando com postman
* [33m2d6a73c[m[33m ([m[1;31morigin/master[m[33m)[m Integrando front com notificações.
* [33mc47709d[m[33m ([m[1;31morigin/main[m[33m, [m[1;31morigin/HEAD[m[33m, [m[1;32mmain[m[33m)[m Update Next.js configuration: set output to 'standalone' for improved deployment flexibility.
* [33m1682eb3[m Update Dockerfile and pnpm-lock.yaml: standardize environment variable syntax in Dockerfile and add new dependencies for Auth0 and Kafka in pnpm-lock.yaml, while removing the vaul package to streamline dependency management.
* [33m4c97f75[m Remove pnpm setup steps from GitHub Actions workflow to streamline the process, focusing on Azure Container Registry login.
* [33mc4b7821[m Add pnpm support in GitHub Actions workflow: enable pnpm via Corepack to enhance dependency management.
* [33m94dadc8[m Update GitHub Actions workflow: replace Corepack enable step with pnpm action setup for version 8, improving dependency management efficiency.
* [33m5696b0e[m Refactor GitHub Actions workflow: replace JDK setup with Node.js setup, update dependency management to use pnpm, and streamline build and test steps for improved efficiency.
* [33m71ec2df[m Add whitespace to SQL and shell script files for improved readability.
* [33m1e08856[m Update environment configuration to use public domain for API endpoints and CORS settings. Refactor authentication context to utilize session storage for user data and tokens, enhancing security and session management. Introduce new dashboard components for classes and grades, improving user navigation and experience.
* [33m17218e9[m Integrando notificações com front via websockets
* [33mf53c694[m Adicionando sistema de notificações
* [33m22c5f9c[m Update Docker Compose and configuration files: change API Gateway image to use Azure registry, update route configurations for user, student, and teacher services, and enhance user data handling in authentication context. Add new dependencies for Auth0 and improve API response handling in services.
* [33mab135e3[m Update service URLs and configurations to use local network IP 192.168.1.7:8080 for development. Adjusted CORS settings, API endpoints, and Postman collections accordingly. Added user refresh functionality in the dashboard and improved logging for user data fetching.
* [33m8121b32[m Integração backEnd e front, tela de cadastro
* [33m7f7a34b[m Update TypeScript configuration and remove unused utility functions: change path mapping in tsconfig.json and delete lib/utils.ts.
* [33m34b9705[m Refactor API Gateway setup: remove Dockerfile and pom.xml, switch to image-based deployment in Docker Compose, and clean up related configurations.
* [33ma6df6e3[m Add API Gateway service to Docker Compose and update frontend configuration to use gateway routes
* [33m6edf12a[m Remove docker-compose-dev.yml file to streamline development environment configuration.
* [33maf21a51[m Update Docker Compose configuration to reflect new image names for microservices: changed auth, student management, and teacher management service images to match the latest naming conventions.
* [33m70f5c34[m Remove unused components: deleted LoginForm, RegisterForm, ThemeProvider, and various UI components (Button, Card, Input, Label, Select) to streamline the codebase.
* [33mab86c2a[m Initialized repository for project School app pages
