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
