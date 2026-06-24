# Como dar acesso premium a um usuário no RevenueCat

Este guia explica como conceder manualmente o entitlement **Bethunter Premium** a qualquer usuário via API do RevenueCat, sem necessidade de pagamento.

---

## Pré-requisitos

- Chave secreta da API do RevenueCat (`sk_...`)
- ID interno do usuário no banco de dados (coluna `id` da tabela `users`)

A chave fica no `.env` do projeto ou no dashboard do RevenueCat em **Project Settings → API Keys**.

---

## Passo 1 — Encontrar o usuário no RevenueCat

O app usa o UUID interno do usuário como App User ID no RC. Use o endpoint abaixo para confirmar que o usuário existe e ver seu status atual:

```bash
curl -s "https://api.revenuecat.com/v1/subscribers/{USER_ID}" \
  -H "Authorization: Bearer {RC_SECRET_KEY}" | python3 -m json.tool
```

Substitua `{USER_ID}` pelo `id` do usuário no banco (ex: `90ced5e5-2883-4b6f-815b-5bcbe0077610`).

**Resposta esperada:** o campo `entitlements` estará vazio se o usuário não tem premium.

---

## Passo 2 — Conceder o entitlement promocional

```bash
curl -s -X POST \
  "https://api.revenuecat.com/v1/subscribers/{USER_ID}/entitlements/Bethunter%20Premium/promotional" \
  -H "Authorization: Bearer {RC_SECRET_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"duration": "lifetime"}' | python3 -m json.tool
```

### Durações disponíveis

| Valor | Duração |
|---|---|
| `"daily"` | 1 dia |
| `"three_day"` | 3 dias |
| `"weekly"` | 1 semana |
| `"monthly"` | 1 mês |
| `"two_month"` | 2 meses |
| `"three_month"` | 3 meses |
| `"six_month"` | 6 meses |
| `"annual"` | 1 ano |
| `"lifetime"` | Vitalício (~200 anos) |

---

## Passo 3 — Confirmar o acesso

A resposta do POST já mostra o entitlement ativo. Para verificar novamente depois:

```bash
curl -s "https://api.revenuecat.com/v1/subscribers/{USER_ID}" \
  -H "Authorization: Bearer {RC_SECRET_KEY}" | python3 -m json.tool
```

Procure por `"Bethunter Premium"` dentro de `entitlements`. Se aparecer com `expires_date`, está ativo.

---

## O que acontece no app

- Na próxima vez que o usuário abrir o app, o SDK do RevenueCat (`react-native-purchases`) busca o status atualizado.
- O `subscriptionStore` (`src/storage/subscriptionStore.ts`) recebe `isPremium: true`.
- O usuário entra direto na tela principal com acesso completo, sem ver o Paywall.

O banco de dados (`is_premium`) é atualizado automaticamente via webhook do RevenueCat quando ele abre o app, **não é necessário alterar o banco manualmente**.

---

## Revogar acesso

Para remover o entitlement antes do prazo:

```bash
curl -s -X DELETE \
  "https://api.revenuecat.com/v1/subscribers/{USER_ID}/entitlements/Bethunter%20Premium" \
  -H "Authorization: Bearer {RC_SECRET_KEY}"
```

---

## Exemplo completo (usuário real)

```bash
USER_ID="90ced5e5-2883-4b6f-815b-5bcbe0077610"
RC_KEY="sk_tqHpNsxJqJwodPzQajCtLpaRovBsj"

# Verificar
curl -s "https://api.revenuecat.com/v1/subscribers/$USER_ID" \
  -H "Authorization: Bearer $RC_KEY" | python3 -m json.tool

# Ativar lifetime
curl -s -X POST \
  "https://api.revenuecat.com/v1/subscribers/$USER_ID/entitlements/Bethunter%20Premium/promotional" \
  -H "Authorization: Bearer $RC_KEY" \
  -H "Content-Type: application/json" \
  -d '{"duration": "lifetime"}' | python3 -m json.tool
```
