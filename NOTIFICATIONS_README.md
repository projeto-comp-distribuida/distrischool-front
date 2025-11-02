# Sistema de Notificações - DistriSchool

## Visão Geral

O sistema de notificações do DistriSchool permite que administradores sejam notificados sobre eventos importantes do sistema, como criação de usuários, desabilitação de usuários e criação de professores.

## Arquitetura

### Componentes

1. **Frontend (Next.js)**
   - `src/components/notification-center.tsx` - Componente visual das notificações
   - `src/services/notification.service.ts` - Service para buscar notificações
   - `app/api/notifications/route.ts` - API route server-side para polling

2. **Tipos**
   - `src/types/notification.types.ts` - Definições de tipos TypeScript

3. **Cliente Kafka**
   - `lib/kafka-client.ts` - Cliente para consumir eventos do Kafka

## Eventos Monitorados

O sistema monitora os seguintes eventos:

1. **user.created** - Quando um novo usuário é criado
2. **user.disabled** - Quando um usuário é desabilitado
3. **teacher.created** - Quando um novo professor é cadastrado

## Como Funciona

### Fluxo de Dados

```
Kafka Topics (user-events, teacher-events)
    ↓
Next.js API Route (/api/notifications)
    ↓
Notification Service
    ↓
Notification Center Component
    ↓
Admin Dashboard
```

### Polling

- **Intervalo**: 30 segundos
- **Método**: Server-side via Next.js API Route
- **Cliente**: KafkaJS para consumir eventos do Kafka

## Implementação Atual

### Status

✅ **Concluído:**
- Tipos TypeScript para notificações
- Service de notificações
- Componente NotificationCenter
- API route para polling
- Integração com Dashboard Admin
- Toaster do Sonner para toast notifications

✅ **Testado e Funcional:**
- API de notificações retornando mock data corretamente
- Todos os 3 tipos de eventos sendo gerados (user.created, user.disabled, teacher.created)
- Estrutura JSON válida e formatada

🔄 **Em Desenvolvimento:**
- Integração real com Kafka (atualmente usando mock data)
- Mecanismo de persistence de notificações lidas
- Backend endpoint para agregar eventos do Kafka

### Notas de Implementação

O polling real do Kafka está pendente porque:
1. KafkaJS é projetado para streaming, não para polling simples
2. Next.js API routes têm limitações para manters conexões longas
3. É recomendado ter um serviço backend dedicado para consumir Kafka

**Próximos Passos:**
1. Criar um microserviço de notificações que consome Kafka
2. Expor endpoints REST para buscar notificações agregadas
3. Implementar WebSockets para notificações em tempo real (opcional)

## Uso

### Para Usuários

O ícone de notificações aparece no dashboard apenas para usuários ADMIN. As notificações são atualizadas automaticamente a cada 30 segundos.

### Para Desenvolvedores

#### Adicionar Novo Tipo de Notificação

1. Adicione o novo tipo em `src/types/notification.types.ts`:
```typescript
export type NotificationType = 'user.created' | 'user.disabled' | 'teacher.created' | 'NEW_EVENT';
```

2. Adicione o mapeamento em `app/api/notifications/route.ts`:
```typescript
case 'NEW_EVENT':
  return {
    ...notification,
    title: 'Título da Notificação',
    message: `Mensagem personalizada`,
  };
```

3. Atualize o NotificationCenter para o novo ícone (se necessário).

## Testes

Para testar o sistema:

1. Faça login como ADMIN
2. Crie um novo usuário ou professor via API
3. Verifique se a notificação aparece no dashboard

## Configuração

### Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://192.168.1.7:8080
KAFKA_BOOTSTRAP_SERVER=192.168.1.7:9092
```

### Dependências

- `kafkajs` - Cliente Kafka
- `sonner` - Toast notifications
- `lucide-react` - Ícones

## Problemas Conhecidos

1. ⚠️ A integração real com Kafka ainda não está implementada
2. ⚠️ Notificações não são persistas entre sessões
3. ⚠️ Não há backend endpoint específico para notificações ainda

## Roadmap

- [ ] Implementar backend endpoint para notificações
- [ ] Adicionar WebSockets para tempo real
- [ ] Persistência de notificações lidas
- [ ] Filtros e busca de notificações
- [ ] Notificações por email
- [ ] Exportação de histórico de notificações

