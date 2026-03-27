# Relatório de Auditoria - Sistema de Gestão de Processos Judiciais

**Data:** 27 de Março de 2026  
**Status:** 🔴 Crítico - Múltiplos problemas de integração e roteamento

---

## Resumo Executivo

O sistema possui **57 testes passando** e **compilação TypeScript sem erros**, porém apresenta **6 problemas críticos** que impedem o funcionamento correto dos módulos integrados. Os problemas são principalmente:

1. **Inconsistências de roteamento** entre frontend e backend
2. **Queries de banco de dados incorretas** (filtros errados)
3. **Problemas de serialização de dados** (Buffer não serializa)
4. **Falta de endpoints de download** para relatórios
5. **Configuração frágil de banco de dados**

---

## Problemas Identificados

### 🔴 CRÍTICO #1: Inconsistências de Roteamento - CaseManagement

**Arquivo:** `client/src/pages/CaseManagement.tsx`  
**Severidade:** Crítica  
**Impacto:** Usuários não conseguem criar/editar/visualizar processos

**Problema:**
- Página navega para `/case/new` mas rota registrada é `/cases/new`
- Tabela navega para `/case/:id` mas rotas existentes são `/cases/:id` ou `/case-detail/:caseId`
- Resultado: Botões levam a páginas 404

**Código Problemático:**
```tsx
navigate("/case/new")  // ❌ Rota não existe
navigate(`/case/${caseItem.id}`)  // ❌ Rota não existe
```

**Rotas Corretas em App.tsx:**
```tsx
<Route path="/cases/new" component={...} />
<Route path="/cases/:id/edit" component={...} />
<Route path="/cases/:id" component={...} />
```

---

### 🔴 CRÍTICO #2: Inconsistências de Roteamento - LawyerManagement

**Arquivo:** `client/src/pages/LawyerManagement.tsx`  
**Severidade:** Crítica  
**Impacto:** Módulo de advogados completamente não funcional

**Problema:**
- Página usa rotas em português: `/advogados/:id`, `/advogados/:id/editar`
- App.tsx registra rotas em inglês: `/lawyers`, `/lawyers/:id`
- Resultado: Botões "Ver" e "Editar" levam a 404

**Código Problemático:**
```tsx
navigate(`/advogados/${lawyer.id}`)  // ❌ Rota não existe
navigate(`/advogados/${lawyer.id}/editar`)  // ❌ Rota não existe
```

**Rotas Corretas em App.tsx:**
```tsx
<Route path="/lawyers" component={LawyerManagement} />
<Route path="/lawyers/:id" component={LawyerProfile} />
```

---

### 🔴 CRÍTICO #3: Query de Prazos Retorna Sempre 0 Vencidos

**Arquivo:** `server/db.ts` e `client/src/pages/Dashboard.tsx`  
**Severidade:** Crítica  
**Impacto:** Dashboard não mostra prazos vencidos (sempre 0)

**Problema:**
- Query `getUpcomingDeadlinesByUserId` filtra por `status = 'pending'`
- Dashboard tenta calcular `overdueDeadlines` com `d.deadlines?.status === 'overdue'`
- Resultado: Nunca encontra prazos vencidos (query não retorna nenhum com status 'overdue')

**Código Problemático em db.ts:**
```ts
export async function getUpcomingDeadlinesByUserId(userId: number, daysAhead: number) {
  // ...
  where(eq(deadlines.status, 'pending'), ...)  // ❌ Filtra apenas 'pending'
}
```

**Código Problemático em Dashboard.tsx:**
```tsx
const overdueDeadlines = upcomingDeadlines.filter(
  (d: any) => d.deadlines?.status === "overdue"  // ❌ Nunca encontra
).length;
```

---

### 🔴 CRÍTICO #4: Upload de Documentos Usa Buffer (Não Serializa)

**Arquivo:** `server/routers.ts` - Procedure `documents.upload`  
**Severidade:** Crítica  
**Impacto:** Upload de documentos não funciona do navegador

**Problema:**
- Procedure usa `z.instanceof(Buffer)` para validar arquivo
- Buffer não serializa em JSON (tRPC não consegue enviar do browser)
- Resultado: Usuários não conseguem fazer upload de documentos

**Código Problemático:**
```ts
documents: router({
  upload: protectedProcedure
    .input(z.object({
      file: z.instanceof(Buffer),  // ❌ Não serializa do browser
      // ...
    }))
```

**Solução Necessária:**
- Aceitar `Uint8Array` ou `base64` string
- Ou criar endpoint Express separado para multipart/form-data
- Ou usar presigned S3 upload

---

### 🔴 CRÍTICO #5: Relatórios PDF Salvos em /tmp Sem Download

**Arquivo:** `server/reportRouter.ts` e `server/pdfReportService.ts`  
**Severidade:** Alta  
**Impacto:** Usuários não conseguem baixar relatórios

**Problema:**
- Procedure `reports.generatePDF` gera arquivo em `/tmp/...`
- Retorna apenas `{path: '/tmp/report-xxx.pdf'}`
- Frontend não consegue acessar arquivo local do servidor

**Código Problemático:**
```ts
export async function generatePDF(data: any) {
  const filePath = `/tmp/report-${Date.now()}.pdf`;
  // ... gera arquivo ...
  return { path: filePath };  // ❌ Frontend não consegue acessar
}
```

**Solução Necessária:**
- Upload do PDF para S3 via `storagePut()`
- Retornar URL pública do S3
- Ou criar endpoint Express para download do arquivo

---

### 🟠 ALTO #6: Configuração Frágil de Banco de Dados

**Arquivo:** `server/db.ts`  
**Severidade:** Alta  
**Impacto:** Possível falha silenciosa em produção

**Problema:**
- `getDb()` usa `drizzle(process.env.DATABASE_URL)` sem pool
- Fallback silencioso: `if (!db) { console.warn(...); return _db = null; }`
- Testes mascaram problema porque usam banco de teste
- Em produção, falha silenciosa pode deixar app sem acesso ao BD

**Código Problemático:**
```ts
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);  // ❌ Sem pool
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;  // ❌ Fallback silencioso
    }
  }
  return _db;
}
```

---

## Análise por Módulo

### ✅ Módulos Funcionando
- **Notificações**: WebSocket conectando, autenticação OK
- **Google Calendar**: Procedures implementadas
- **Webhooks**: Estrutura em lugar
- **Testes**: 57 testes passando

### ❌ Módulos Quebrados
- **Gestão de Processos**: Rotas inconsistentes
- **Gestão de Advogados**: Rotas inconsistentes
- **Upload de Documentos**: Buffer não serializa
- **Relatórios**: Sem endpoint de download
- **Dashboard**: Prazos vencidos sempre 0

---

## Plano de Correção Priorizado

### Fase 1: Correções Críticas (1-2 horas)

1. **Corrigir rotas de CaseManagement**
   - Arquivo: `client/src/pages/CaseManagement.tsx`
   - Mudar `/case/*` para `/cases/*`
   - Testar navegação

2. **Corrigir rotas de LawyerManagement**
   - Arquivo: `client/src/pages/LawyerManagement.tsx`
   - Mudar `/advogados/*` para `/lawyers/*`
   - Testar navegação

3. **Corrigir query de prazos vencidos**
   - Arquivo: `server/db.ts`
   - Criar `getOverdueDeadlinesByUserId()` com filtro `status = 'overdue'`
   - Atualizar Dashboard para usar nova query

### Fase 2: Correções Altas (2-3 horas)

4. **Corrigir upload de documentos**
   - Arquivo: `server/routers.ts`
   - Mudar `z.instanceof(Buffer)` para `z.string()` (base64)
   - Converter base64 para Buffer no servidor

5. **Corrigir download de relatórios**
   - Arquivo: `server/reportRouter.ts`
   - Fazer upload do PDF para S3
   - Retornar URL pública

6. **Melhorar configuração do banco**
   - Arquivo: `server/db.ts`
   - Usar mysql2 pool
   - Remover fallback silencioso em produção

### Fase 3: Testes e Validação (1-2 horas)

7. **Criar testes de integração**
   - Testar fluxo completo: criar processo → atribuir advogado → sincronizar
   - Testar upload e download de documentos
   - Testar geração de relatórios

---

## Checklist de Validação

- [ ] Todas as rotas funcionam sem 404
- [ ] Dashboard mostra prazos vencidos corretamente
- [ ] Upload de documentos funciona
- [ ] Download de relatórios funciona
- [ ] Módulo de advogados totalmente funcional
- [ ] Módulo de processos totalmente funcional
- [ ] Testes de integração passando
- [ ] Sem erros de compilação TypeScript
- [ ] Sem erros no console do navegador

---

## Recomendações Adicionais

1. **Adicionar testes de integração E2E** com Playwright/Cypress
2. **Implementar logging estruturado** para rastrear erros em produção
3. **Criar CI/CD pipeline** para rodar testes antes de deploy
4. **Documentar fluxos de negócio** (criar processo → atribuir → sincronizar)
5. **Implementar rate limiting** nas procedures tRPC
6. **Adicionar validação de permissões** em todas as mutations

---

## Conclusão

O sistema tem uma **boa arquitetura base** (tRPC, Drizzle, TypeScript), mas precisa de **correções imediatas** nas rotas e queries para funcionar corretamente. Após as correções da Fase 1 e 2, o sistema estará pronto para uso em produção.

**Tempo Estimado para Correção:** 4-7 horas  
**Risco Atual:** 🔴 Alto (múltiplos módulos não funcionam)  
**Risco Após Correção:** 🟢 Baixo (arquitetura sólida)
