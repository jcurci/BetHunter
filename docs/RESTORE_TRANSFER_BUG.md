# Bug: "Já sou assinante" libera premium sem assinatura ativa (transferência de entitlement)

## Sintoma

Usuários sem assinatura conseguem acesso premium tocando **"Já sou assinante"** no paywall — inclusive contas recém-criadas, no primeiro uso.

## Causa raiz

O botão "Já sou assinante" executa `Purchases.restorePurchases()` dentro do SDK nativo. O restore **não olha a conta BetHunter** — ele lê o **recibo da loja do aparelho** (Apple ID / conta Google logada no device) e sincroniza com o `app_user_id` atual.

Com o comportamento padrão do RevenueCat (**Restore behavior = "Transfer to new App User ID"**), se o recibo do aparelho contém uma assinatura ativa, o RC **transfere o entitlement para a conta atual** no ato do restore — e **revoga da conta original**. O guard do app (`Paywall.tsx` / `CelebrationScreen.tsx`) então vê um entitlement *genuinamente ativo* para essa conta e libera o acesso. O código funciona como projetado; o furo é de configuração.

Consequências:

1. Uma única assinatura paga destrava serialmente quantas contas quiserem no mesmo aparelho (uma por vez).
2. **Um assinante pagante perde o acesso** quando outra conta restaura no aparelho dele.
3. Em ambiente de teste, o recibo sandbox/TestFlight do aparelho libera qualquer conta nova testada nele — por isso o bug reproduz com conta recém-criada.

Fontes possíveis do recibo no aparelho:

- **Sandbox/TestFlight** — o Apple ID sandbox (ou license tester Google) já comprou em testes anteriores.
- **Assinatura real de outra conta** usada antes no mesmo aparelho.
- **Entitlement promocional** concedido no dashboard/API (ver `revenuecat-dar-acesso-premium.md`).

### Fluxo do bug

```
Conta nova (B) toca "Já sou assinante"
↓
SDK: restorePurchases() → lê recibo da loja do aparelho
↓
Recibo tem assinatura ativa (da conta A ou sandbox)
↓
RC (restore behavior = Transfer): TRANSFERE entitlement A → B, revoga de A
↓
onRestoreCompleted({ customerInfo })  ← entitlement ATIVO para B (legítimo do ponto de vista do RC)
↓
Guard do app passa → Home  ✅ código / ❌ configuração
```

### Como confirmar o diagnóstico

No dashboard do RevenueCat, abrir o **Customer History** do `app_user_id` da conta de teste — deve haver um evento **Transfer** (ou um grant **Promotional**) no timestamp exato do teste.

## Correção (dashboard RevenueCat — passo manual)

1. **Project Settings → Restore behavior**: trocar de "Transfer to new App User ID" para **"Transfer if there are no active subscriptions"**.
   - Bloqueia o compartilhamento serial de uma assinatura entre contas, mantendo o restore legítimo para recibos órfãos.
   - Alternativa mais estrita: "Keep with original App User ID" — nunca transfere, porém gera carga de suporte (usuário que perdeu acesso à conta original não se recupera sozinho).
2. Auditar o **Customer History** da conta de teste: evento Transfer? Grant Promotional/Complimentary?
3. Retestar com conta de loja **sem** assinatura (nem sandbox): o restore deve exibir o alert "Assinatura não encontrada".
4. Confirmar que o binário em teste contém o guard atual (o alert "Assinatura não encontrada" deve existir no build — ver `PAYWALL_BUGFIX.md`; se o build for antigo, gerar novo).

## O que NÃO foi alterado no app e por quê

- **Guard client-side** — já existe e está correto nos dois únicos pontos de restore (`src/screens/Paywall/Paywall.tsx` e `src/screens/OnboardingFlow/screens/CelebrationScreen.tsx`): só navega se `entitlements.active['Bethunter Premium']` for truthy.
- **Bloqueio por `originalAppUserId ≠ userId`** — descartado. Após um TRANSFER, o `customerInfo` pertence legitimamente ao novo usuário (`originalAppUserId` = id dele), então o check não detecta transferência — e pode falso-bloquear assinantes com histórico de alias anônimo. Não existe sinal client-side confiável de transfer; a detecção é server-side (webhook `TRANSFER`) e a prevenção é o restore behavior.
- **Gate client-first mantido** — o entitlement do RevenueCat continua sendo a fonte imediata de liberação (padrão recomendado pela RevenueCat; UX fluida, funciona offline). Sem chamada síncrona ao backend no caminho do restore; o expiration guard em `App.tsx` revoga depois se divergir.

A única mudança de código foi adicionar logs `__DEV__` no `finishAsSubscriber` do `CelebrationScreen.tsx` (paridade com o `Paywall.tsx`): keys de `entitlements.active/all` e `originalAppUserId`, para diagnosticar restores nesse caminho.

## Checklist de auditoria

- [ ] Dashboard RC: restore behavior ≠ "Transfer to new App User ID"?
- [ ] Customer History da conta de teste: evento Transfer ou grant Promotional no horário do bug?
- [ ] Teste com conta de loja sem assinatura (nem sandbox) → restore bloqueia com alert?
- [ ] Log `[PAYWALL] entitlements.active keys:` vazio para não-assinante?
- [ ] Build em teste contém o guard ("Assinatura não encontrada")?
- [ ] `REVENUECAT_WEBHOOK_SECRET` setado no deploy da API?

## Recomendações para o `bethunter-api` (fora deste repositório)

Estes furos não causam o bug do botão, mas agravam o problema e devem ser corrigidos no repositório da API:

1. **`getSubscriptionStatus`** — computar `isPremium = is_premium && (premium_expires_at == null || premium_expires_at > now)` em vez de retornar `is_premium` cru; opcionalmente persistir `is_premium = false` ao detectar expiração (lazy revoke). Hoje, premium expirado continua premium se o webhook `EXPIRATION` falhar.
2. **Webhook RC fail-closed** — se `REVENUECAT_WEBHOOK_SECRET` não estiver configurado, rejeitar a requisição (401/503) em vez de aceitar sem autenticação. Hoje, sem a env, qualquer um forja um `INITIAL_PURCHASE`.
3. **Tratar o evento `TRANSFER`** — revogar `is_premium` do `transferred_from` e conceder ao `transferred_to`. Hoje a conta antiga permanece premium no banco após uma transferência.
