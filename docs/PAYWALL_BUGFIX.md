# Correções de Bugs — Botão "Já sou assinante" (Paywall)

## Contexto

Usuários com assinatura ativa no RevenueCat não conseguiam ser redirecionados para a Home após tocar em **"Já sou assinante"** no paywall. O botão executava o fluxo de restore mas o app ficava preso no paywall sem exibir nenhum feedback.

---

## Arquivos Modificados

| Arquivo | Tipo de alteração |
|---|---|
| `src/screens/Paywall/Paywall.tsx` | Correção de lógica + tratamento de erros |
| `src/screens/OnboardingFlow/screens/CelebrationScreen.tsx` | Correção de lógica + tratamento de erros |

---

## Bugs Corrigidos

### Bug 1 — `onRestoreCompleted` ignorava o `customerInfo` retornado pelo SDK

**Antes:**
```tsx
onRestoreCompleted={async () => {
  await finishAsSubscriber(); // não usa o customerInfo do restore
}}
```

O SDK do RevenueCat entrega `{ customerInfo }` ao callback — esses dados já contêm os entitlements pós-restore e são confiáveis. O código ignorava esse dado e disparava uma segunda chamada de rede (`Purchases.getCustomerInfo()`), criando um ponto de falha desnecessário.

**Depois:**
```tsx
onRestoreCompleted={async ({ customerInfo }) => {
  await finishAsSubscriber(customerInfo); // usa diretamente o customerInfo
}}
```

`finishAsSubscriber` agora recebe `CustomerInfo` opcionalmente. Quando informado, chama `setFromCustomerInfo()` (sincronamente, sem rede) em vez de `refresh()`.

---

### Bug 2 — Falha silenciosa: nenhum feedback quando a assinatura não é encontrada

**Antes:**
```tsx
if (!isNowPremium) {
  isNavigatingRef.current = false;
  return; // silêncio total — o usuário não sabe o que aconteceu
}
```

Em todos os cenários de falha (entitlement não mapeado, RC anônimo, erro de rede), o comportamento era idêntico: o app simplesmente permanecia no paywall sem mensagem alguma.

**Depois:**
```tsx
if (!isNowPremium) {
  isNavigatingRef.current = false;
  Alert.alert(
    'Assinatura não encontrada',
    'Não encontramos uma assinatura ativa nesta conta. Verifique se está usando a conta correta na loja e tente novamente.',
  );
  return;
}
```

O usuário agora recebe uma mensagem clara que permite diagnosticar o problema (conta errada na loja, assinatura expirada, etc.).

---

### Bug 3 — Erros de rede em `finishAsSubscriber` eram absorvidos sem feedback

**Antes:**
```tsx
} catch {
  isNavigatingRef.current = false;
  // sem Alert — o catch nunca era acionado de forma visível
}
```

O `catch` externo de `finishAsSubscriber` nunca era acionado porque `refresh()` absorvia internamente todas as exceções do `Purchases.getCustomerInfo()`. Erros de rede eram completamente invisíveis.

**Depois:**
```tsx
} catch {
  isNavigatingRef.current = false;
  Alert.alert(
    'Erro ao verificar assinatura',
    'Não foi possível confirmar sua assinatura. Verifique sua conexão e tente novamente.',
  );
}
```

---

### Bug 4 — `onRestoreError` e `onPurchaseError` não estavam conectados (iOS)

**Antes:** nenhum handler wired para erros de restore e compra.

**Depois:**
```tsx
onRestoreError={({ error: restoreError }) => {
  Alert.alert(
    'Erro ao restaurar',
    restoreError.message || 'Não foi possível restaurar sua assinatura. Tente novamente.',
  );
}}
onPurchaseError={({ error: purchaseError }) => {
  Alert.alert(
    'Erro na compra',
    purchaseError.message || 'Não foi possível processar a compra. Tente novamente.',
  );
}}
```

Erros nativos do SDK (rede, conta da loja, produto indisponível) agora chegam ao usuário via Alert em vez de serem descartados silenciosamente.

---

### Bug 5 — Android: erro/cancelamento redirecionava para `OnboardingFlow`

**Antes:**
```tsx
// presentAndroidPaywall separado
if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
  await finishAsSubscriber();
} else {
  // qualquer outro resultado (ERROR, CANCELLED) → manda para OnboardingFlow
  navigation.reset({ index: 0, routes: [{ name: 'OnboardingFlow', params: { startAtStep: 'celebration' } }] });
}
```

Se o usuário fechasse o modal sem assinar (ou houvesse um erro), era redirecionado para o OnboardingFlow — comportamento incorreto para quem acabou de fazer login.

**Depois (inlineado em `loadOffering`):**
```tsx
if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
  await finishAsSubscriber();
} else if (result === PAYWALL_RESULT.ERROR) {
  setError('Ocorreu um erro ao processar. Tente novamente.');
  setLoading(false);
} else {
  // CANCELLED — mantém tela de paywall com botão de retry
  setLoading(false);
}
```

- **ERROR**: exibe mensagem de erro na tela com botão "Tentar novamente".
- **CANCELLED**: exibe botão "Tentar novamente" sem mensagem de erro, permitindo que o usuário reabra o paywall.
- Nenhum caso redireciona para o OnboardingFlow.

A função `presentAndroidPaywall` foi eliminada — sua lógica foi consolidada dentro de `loadOffering`, removendo a dependência circular que existia entre os dois `useCallback`.

---

### Bug 6 — `useEffect` de `isPremium` sem `finishAsSubscriber` nas dependências

**Antes:**
```tsx
useEffect(() => {
  if (isPremium) {
    void finishAsSubscriber();
  }
}, [isPremium]); // finishAsSubscriber ausente das deps
```

**Depois:**
```tsx
useEffect(() => {
  if (isPremium) {
    void finishAsSubscriber();
  }
}, [isPremium, finishAsSubscriber]);
```

`finishAsSubscriber` foi encapsulado em `useCallback` com deps corretas (`navigation`, `refresh`, `setFromCustomerInfo`), todas referências estáveis, tornando o callback estável e seguro para incluir nas deps do `useEffect`.

---

## O que NÃO foi alterado e por quê

### `src/storage/subscriptionStore.ts` — `refresh()` ainda absorve erros internamente

O comportamento de `refresh()` não foi alterado: ele captura exceções de `getCustomerInfo()` sem propagar. Mudar isso quebraria o expiration guard em `App.tsx` (que chama `refresh()` dentro de um `setTimeout` sem try/catch).

Com as correções acima, `refresh()` só é chamado pelo `finishAsSubscriber()` quando não há `customerInfo` disponível (fluxo Android com `presentPaywall()`). Nesse caminho, o Alert para `isPremium = false` garante feedback ao usuário mesmo que `getCustomerInfo()` falhe silenciosamente.

### `src/services/revenueCat.ts` — `ENTITLEMENT_ID = 'Bethunter Premium'`

O identificador do entitlement **não foi alterado** pois é um dado de configuração que deve corresponder exatamente ao que está cadastrado no dashboard do RevenueCat. Qualquer divergência de capitalização (`'BetHunter Premium'`, `'bethunter_premium'`, etc.) causa falha silenciosa em **todos** os caminhos. Verificar e corrigir este valor diretamente no dashboard do RevenueCat se necessário.

---

## Causa Raiz do Problema Original

O botão **"Já sou assinante"** executa `Purchases.restorePurchases()` internamente via SDK nativo. O `customerInfo` resultante era entregue ao callback `onRestoreCompleted`, mas o código descartava esse dado e fazia uma segunda chamada de rede (`getCustomerInfo()`). Se essa segunda chamada falhava ou retornava entitlements sem a chave `'Bethunter Premium'`, o `isPremium` permanecia `false` e o app saía silenciosamente — sem navegação, sem feedback ao usuário.

Com as correções, o fluxo passou a ser:

```
Toque em "Já sou assinante"
↓
SDK nativo: Purchases.restorePurchases()
↓
onRestoreCompleted({ customerInfo })  ← customerInfo já tem os entitlements pós-restore
↓
finishAsSubscriber(customerInfo)
↓
setFromCustomerInfo(customerInfo)     ← sincronamente, sem segunda chamada de rede
↓
isPremium = !!entitlements.active['Bethunter Premium']
↓
[true]  → navigation.reset → Home ✅
[false] → Alert: "Assinatura não encontrada" ✅
```
