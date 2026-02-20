# Sistema de Bloqueio de Apostas (BetHunter)

Documentação do que foi implementado para o sistema de bloqueio de sites e aplicativos de apostas no app BetHunter.

---

## Visão geral

O sistema permite ativar/desativar o bloqueio de domínios de apostas, atualizar a lista de bloqueio (Hagezi Gambling) e persistir configuração. A parte em TypeScript/React Native está implementada; a camada nativa (VPN Android, Content Blocker iOS) será usada quando existir após `expo prebuild` e implementação dos módulos nativos.

---

## O que foi feito

### 1. Configuração do projeto (Fase 0)

- **app.json**
  - Adicionado `ios.bundleIdentifier`: `com.bethunter.app` (necessário para extensões e entitlements no iOS).
  - JSON formatado para leitura.

### 2. Interface TypeScript e persistência (Fase 1.1)

- **`src/native/GamblingBlocker.types.ts`**
  - Tipos: `BlockerConfig`, `BlockAttempt`, `BlockerStatus`, `PermissionStatus`.
  - Constante `BLOCKER_STORAGE_KEYS` com chaves AsyncStorage: `@BetHunter:blocker:enabled`, `blocked_domains_cache`, `blocked_apps_list`, `blocklist_updated_at`.

- **`src/native/GamblingBlocker.ts`**
  - Interface unificada que usa `NativeModules.GamblingBlocker` quando disponível (dev build com código nativo).
  - Quando o módulo nativo não existe (Expo Go ou sem prebuild), usa stubs e AsyncStorage.
  - Funções exportadas:
    - **Ativação:** `enableBlocker(config)`, `disableBlocker()`.
    - **Status:** `getStatus()` → `{ active, layers }`.
    - **Listas:** `updateBlocklist()`, `addCustomDomain(domain)`, `addCustomApp(identifier)`.
    - **Cache de domínios:** `setBlockedDomainsCache(domains)`, `getBlockedDomainsCache()`, `getBlocklistUpdatedAt()`.
    - **Logs:** `getBlockedAttempts()`.
    - **Permissões:** `requestPermissions()`, `checkPermissions()`.
    - **Utilitário:** `isNativeBlockerAvailable()`.

- **`src/native/index.ts`**
  - Reexporta todas as funções e tipos do módulo de bloqueio.

### 3. Blocklist Hagezi (Fase 1.2)

- **`src/services/BlocklistService.ts`**
  - **URL:** lista Gambling do repositório [hagezi/dns-blocklists](https://github.com/hagezi/dns-blocklists) (domains/gambling.txt).
  - **Download e parse:** uma linha por domínio, ignora comentários (`#`) e linhas vazias, remove duplicatas, normaliza em minúsculas.
  - **Persistência:** salva via `setBlockedDomainsCache(domains)` (AsyncStorage + timestamp).
  - **Funções:**
    - `updateBlocklist()` – baixa, parseia e persiste; retorna array de domínios.
    - `getBlocklistAsDomainArray()` – retorna domínios em cache (para Android VPN / uso geral).
    - `getBlocklistAsContentBlockerRules(domains)` – converte para regras Safari Content Blocker (JSON), limite 50.000 regras (iOS).
    - `getCachedBlocklistAsContentBlockerRules()` – regras a partir do cache.
    - `getLastUpdateTimestamp()` – timestamp da última atualização (ms) ou `null`.
    - `updateBlocklistWithFallback()` – tenta atualizar; em falha usa cache se existir.

### 4. UI e navegação (Fase 1.5)

- **`src/screens/Blocker/BlockerSetup.tsx`**
  - Tela principal do bloqueio:
    - Toggle **Ativar bloqueio** (chama `enableBlocker` / `disableBlocker` com `BlockerConfig`).
    - Botão **Atualizar lista de bloqueio** (chama `updateBlocklistWithFallback()` + `updateBlocklist()` do bridge; exibe quantidade de domínios e data da última atualização).
    - Mensagem quando o módulo nativo não está disponível (Expo Go / sem prebuild).
    - No **iOS:** texto explicando ativação da extensão no Safari + botão **Abrir Ajustes** (`Linking.openSettings()`).
  - Carrega estado inicial com `getStatus()`, `getBlockedDomainsCache()`, `getLastUpdateTimestamp()`.

- **`src/screens/Blocker/BlockerConfig.tsx`**
  - Tela placeholder “Configuração avançada” (Em breve).

- **`src/screens/Blocker/BlockerLogs.tsx`**
  - Tela placeholder “Logs de bloqueio” (Em breve).

- **Navegação**
  - Em `src/types/navigation.ts`: rotas `BlockerSetup`, `BlockerConfig`, `BlockerLogs`.
  - Em `App.tsx`: as três telas registradas no `Stack.Navigator`.
  - Na **Home:** o botão **Bloquear** (card Meditar / Resetar / Bloquear) navega para `BlockerSetup` em vez de abrir o modal de bloqueio.

---

## Arquivos criados ou alterados

| Arquivo                                 | Descrição                                      |
| --------------------------------------- | ---------------------------------------------- |
| `app.json`                              | `ios.bundleIdentifier` e formatação            |
| `src/native/GamblingBlocker.types.ts`   | Tipos e chaves de storage                      |
| `src/native/GamblingBlocker.ts`         | Bridge + stubs + persistência                  |
| `src/native/index.ts`                   | Reexportações                                  |
| `src/services/BlocklistService.ts`      | Download/parse/cache da blocklist Hagezi       |
| `src/screens/Blocker/BlockerSetup.tsx`  | Tela de ativação e atualização da lista        |
| `src/screens/Blocker/BlockerConfig.tsx` | Placeholder configuração avançada              |
| `src/screens/Blocker/BlockerLogs.tsx`   | Placeholder logs                               |
| `src/screens/Blocker/index.ts`          | Export das telas Blocker                       |
| `src/types/navigation.ts`               | Rotas BlockerSetup, BlockerConfig, BlockerLogs |
| `App.tsx`                               | Registro das telas Blocker no Stack            |
| `src/screens/Home/Home.tsx`             | Botão Bloquear → navega para BlockerSetup      |

---

## Fluxo do usuário

1. Usuário toca em **Bloquear** na Home → abre **BlockerSetup**.
2. Pode **ativar/desativar** o bloqueio (toggle); sem módulo nativo, o estado fica só em AsyncStorage.
3. Pode **Atualizar lista de bloqueio** (download Hagezi + persistência + chamada ao bridge se existir).
4. No iOS, vê instrução para ativar a extensão no Safari e pode abrir **Ajustes**.

---

## Próximos passos (nativo)

Para ter VPN no Android e Content Blocker no Safari (iOS):

1. **Expo prebuild:** rodar `npx expo prebuild` no diretório do app para gerar `android/` e `ios/`.
2. **Android:** implementar `GamblingBlockerModule` (bridge) e `LocalVpnService` (VPN local que filtra por domínios), conforme plano em `.cursor/plans/` (Fase 1.3).
3. **iOS:** criar target Content Blocker no Xcode e gerar `blockerList.json` a partir de `getBlocklistAsContentBlockerRules()`; ativação manual em Ajustes > Safari > Extensões (Fase 1.4).

O módulo TypeScript já está preparado: quando `NativeModules.GamblingBlocker` existir, as funções do bridge serão usadas automaticamente.

---

## Referências

- Plano de implementação: `.cursor/plans/sistema_bloqueio_apostas_*.plan.md`
- Lista Hagezi Gambling: [hagezi/dns-blocklists](https://github.com/hagezi/dns-blocklists) (seção Gambling)
- Arquitetura do app: `docs/ARCHITECTURE.md`
