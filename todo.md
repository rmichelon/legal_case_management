# Sistema de Gestão de Processos Judiciais - TODO

## Banco de Dados
- [x] Criar schema completo com tabelas: processos, clientes, documentos, prazos, movimentações
- [x] Gerar e aplicar migrations do Drizzle
- [x] Criar query helpers em server/db.ts

## Backend (tRPC)
- [x] Procedures para CRUD de processos
- [x] Procedures para CRUD de clientes
- [x] Procedures para gestão de documentos (upload, listagem, exclusão)
- [x] Procedures para prazos e alertas
- [x] Procedures para movimentações processuais
- [x] Procedure para busca e filtros avançados
- [x] Integração com LLM para chatbot de petições

## Frontend - Design & Layout
- [x] Implementar design tipográfico internacional (branco, vermelho, preto, grid)
- [x] Estabelecer sistema de cores e tipografia em index.css
- [x] Criar componentes base reutilizáveis

## Frontend - Funcionalidades
- [x] Dashboard com estatísticas e prazos próximos
- [x] Página de cadastro/edição de processos
- [x] Página de gestão de clientes
- [x] Página de detalhes do processo com prazos, documentos e movimentações
- [x] Upload e gestão de documentos
- [x] Histórico de movimentações
- [x] Landing page com redirecionamento
- [x] Implementar busca e filtros avançados
- [x] Chatbot inteligente para redação de petições

## Integrações & Features Avançadas
- [x] Sistema de alertas por email para prazos próximos (backend pronto)
- [x] Integração com LLM para análise de documentos (backend pronto)
- [x] Integração com LLM para sugestões de jurisprudência (backend pronto)
- [x] Testes unitários com Vitest
- [x] Validação de formulários com Zod

## Publicação
- [x] Revisar e testar todas as funcionalidades
- [x] Criar checkpoint final
- [x] Publicar sistema

## Notificações em Tempo Real (Nova Feature)
- [x] Criar schema de notificações no banco de dados
- [x] Implementar procedures tRPC para notificações
- [x] Criar Centro de Notificações no frontend
- [x] Implementar painel de preferências de notificações
- [x] Adicionar widget de notificações em tempo real na navegação
- [x] Criar sistema de histórico de notificações
- [x] Testes do sistema de notificações (7 testes passando)
- [ ] Configurar servidor WebSocket para notificações push
- [ ] Implementar Push Notifications nativas do navegador
- [ ] Integração com prazos e eventos (criar notificações automáticas)

## WebSockets com Socket.io (Nova Feature)
- [x] Instalar Socket.io e dependências
- [x] Configurar servidor WebSocket no Express
- [x] Criar gerenciador de conexões de usuários
- [x] Implementar sistema de broadcast de notificações
- [x] Criar cliente WebSocket no frontend
- [x] Implementar reconexão automática
- [x] Criar NotificationService para envio de notificações
- [x] Integrar WebSocket ao NotificationBell
- [x] Adicionar indicador visual de status (conectado/offline)
- [x] Testes do sistema WebSocket (16 testes passando)
- [ ] Integrar notificações automáticas de prazos (job agendado)
- [ ] Integrar notificações de eventos (movimentações, documentos)


## Correções de WebSocket (Bugs Fixados)
- [x] Corrigir erro "websocket error" no cliente
- [x] Implementar autenticação automática via socket.handshake.auth
- [x] Adicionar tratamento de erros em todos os pontos críticos
- [x] Implementar fallback para polling quando WebSocket falhar
- [x] Adicionar timeout de conexão (15s)
- [x] Melhorar logs de debug para diagnosticar problemas
- [x] Testar todas as funcionalidades (38 testes passando)


## Integração com Google Calendar (Nova Feature)
- [x] Configurar Google Calendar API e credenciais
- [x] Implementar autenticação OAuth 2.0 com Google
- [x] Criar schema de integração (googleCalendarIntegration, calendarEvents)
- [x] Criar procedures tRPC para sincronização
- [x] Implementar sincronização de prazos para Google Calendar
- [x] Criar página de Agenda com visualização de eventos
- [x] Implementar controle de sincronização por tipo de prazo
- [x] Adicionar preferências de sincronização do usuário
- [x] Testes de integração com Google Calendar (6 testes passando)
- [x] Tratamento de erros de sincronização
- [x] Link de Agenda adicionado à navegação


## Webhook para Sincronizacao Bidirecional (Nova Feature)
- [x] Criar schema de webhook e historico de sincronizacao
- [x] Implementar Google Calendar Watch API
- [x] Criar WebhookHandler para processar notificacoes
- [x] Implementar sincronizacao bidirecional com tratamento de conflitos
- [x] Criar procedures tRPC para gerenciar webhooks
- [x] Adicionar sistema de resolucao de conflitos
- [x] Testes do sistema de webhook (3 testes passando)
- [ ] Criar endpoint Express para receber webhooks
- [ ] Adicionar validacao de seguranca (HMAC, tokens)
- [ ] Implementar retry logic para sincronizacoes falhadas


## Módulo de Gestão de Processos (Nova Feature)
- [x] Criar schema para integração com tribunal (courtData, tribunalSync)
- [x] Criar schema para histórico de interações (caseInteractions, auditLog)
- [x] Implementar serviço de integração com webservice do tribunal
- [x] Criar procedures tRPC para sincronizar dados do tribunal
- [x] Criar procedures tRPC para atualizar processos
- [ ] Desenvolver interface de edição avançada de processos
- [ ] Implementar histórico de interações e auditoria
- [ ] Adicionar campos específicos do tribunal (vara, juiz, status)
- [ ] Criar sistema de sincronização em tempo real
- [ ] Testes do módulo de gestão de processos


## Telas do Sistema de Gestão de Processos (Nova Feature)
- [x] Página de detalhes do processo com abas (Informações, Tribunal, Histórico, Auditoria)
- [x] Formulário de edição avançada de processos
- [x] Painel de sincronização com tribunal
- [x] Timeline de histórico de interações
- [x] Log de auditoria visual
- [ ] Gerenciador de configurações de tribunal
- [ ] Testes das telas
