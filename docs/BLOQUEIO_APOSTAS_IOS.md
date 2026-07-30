# Bloqueio de Apostas — iOS

> ## ⚠️ DOCUMENTO OBSOLETO
>
> Descreve a arquitetura com **`NEDNSProxyProvider`**, que **nunca funcionou em
> nenhum iPhone de consumidor**: a Apple restringe configurações de DNS Proxy a
> aparelhos supervisionados/MDM, e `saveToPreferences` falha com
> `NEConfigurationErrorDomain` código 10 em qualquer aparelho pessoal.
>
> Substituída por um **`NEPacketTunnelProvider`** (túnel local só de DNS) em
> `ios/PacketTunnel/`. Ver `docs/APP_REVIEW_NOTES.md` e o código.
>
> Além disso, dois valores aqui **já estavam errados** e vão desencaminhar quem
> depurar:
> - App Group: o correto é `group.com.bethunter.app.rick`, não `group.com.bethunterapp.ios`.
> - Blocklist: vem de `raw.githubusercontent.com/hidekiiwasa/blacklist-cassino`, não de um Gist.
>
> Mantido apenas como registro histórico.

Documentação da feature de bloqueio de apps e sites de apostas no iOS, implementada com **FamilyControls**, **ManagedSettings**, **NEDNSProxyProvider** e lista dinâmica via **GitHub Gist**.

---

## Visão Geral

A feature permite ao usuário:

1. **Bloquear apps** de apostas via Screen Time (FamilyControls + ManagedSettings)
2. **Bloquear sites** de apostas via DNS Proxy (NEDNSProxyProvider) com lista dinâmica idêntica à do Android
3. **Controlar tudo** numa tela unificada com toggle de ativar/desativar

O ponto de entrada é o botão **"Bloquear"** na tela Home do app.

---

## Arquitetura Geral

```
React Native (Home.tsx)
  │
  │  Platform.OS === "ios" → NativeModules.BetBlocking.openBlockingFlow()
  │  Platform.OS === "android" → fluxo VPN existente (inalterado)
  │
  ▼
BetBlockingModule (Swift ↔ RN Bridge)
  │
  ▼
BlockingFlowCoordinator
  │
  ├─ FamilyControls authorization
  │   ├─ Não autorizado → requestAuthorization → FamilyActivityPicker
  │   └─ Já autorizado  → BlockingControlView
  │
  ▼
BlockingManager.applyBlocking()
  │
  ├─ ManagedSettingsStore.shield     → bloqueia apps selecionados
  ├─ BlocklistSyncService.shared     → baixa lista do Gist (se desatualizada)
  └─ NEDNSProxyManager               → ativa extensão DNS
        │
        ▼ App Group (group.com.bethunterapp.ios)
        │  UserDefaults compartilhado entre app e extensão
        │
        ▼
DNSProxy Extension (NEDNSProxyProvider)
  └─ Carrega lista do App Group → intercepta DNS → NXDOMAIN para bloqueados
```

---

## Ficheiros da Feature

### App Principal — `ios/BetHunter/Blocking/`

| Ficheiro | Responsabilidade |
|---|---|
| `BetBlockingModule.swift` | Módulo nativo RN. Expõe `openBlockingFlow()` para JS. Verifica iOS 16+. |
| `BetBlockingModule.m` | Ponte Objective-C (`RCT_EXTERN_MODULE`) para registrar o módulo `BetBlocking`. |
| `BlockingFlowCoordinator.swift` | Orquestra o fluxo: verifica autorização FamilyControls, apresenta picker ou tela de controle. |
| `BlockingControlView.swift` | Tela SwiftUI com toggle de proteção, lista de apps e contagem dinâmica de domínios bloqueados. |
| `BlockingManager.swift` | Gerencia `ManagedSettingsStore` (apps) e `NEDNSProxyManager` (DNS proxy). Dispara o sync da blocklist. |
| `BlocklistSyncService.swift` | Baixa a lista do Gist, normaliza domínios, persiste no App Group. Equivalente iOS do `BlocklistManager.kt`. |
| `AppGroupHelper.swift` | Helper de `UserDefaults` compartilhado. Persiste: flag de proteção, FamilyActivitySelection, lista de domínios e timestamp. |
| `BlockedDomains.swift` | Lista estática de fallback (5 domínios). Usada quando o App Group ainda está vazio (primeira execução). |

### Extensão DNS — `ios/DNSProxy/`

| Ficheiro | Responsabilidade |
|---|---|
| `DNSProxyProvider.swift` | `NEDNSProxyProvider`. Em `startProxy()` carrega a lista do App Group. Intercepta queries DNS e retorna NXDOMAIN para domínios bloqueados. |
| `Info.plist` | `NSExtensionPointIdentifier = com.apple.networkextension.dns-proxy`. Classe principal: `DNSProxyProvider`. |
| `DNSProxy.entitlements` | Network Extension (dns-proxy) + App Group. |

---

## Como Funciona: Fluxo Completo

### 1 — Usuário ativa a proteção

```
Toca "Bloquear" na Home
        │
        ▼
   iOS >= 16?
   ├─ Não → Alerta "Requer iOS 16+"
   └─ Sim ▼
        FamilyControls autorizado?
        ├─ Não → requestAuthorization()
        │        ├─ Aceita → FamilyActivityPicker (seleciona apps)
        │        │           └─ Salva seleção → BlockingControlView
        │        └─ Recusa → Alerta "Vá em Ajustes > Tempo de Uso"
        └─ Sim → BlockingControlView direto

BlockingControlView.Toggle ON
        │
        ▼
BlockingManager.applyBlocking(selection)
        │
        ├─ ManagedSettingsStore.shield.applications = tokens selecionados
        │       → apps recebem "shield" nativo do iOS (não abrem)
        │
        ├─ BlocklistSyncService.shared.refreshIfNeeded()
        │       → se lista vazia ou > 24h: baixa do Gist
        │       → salva em App Group (UserDefaults shared)
        │
        └─ NEDNSProxyManager.shared().saveToPreferences(enabled: true)
                → iOS ativa a extensão DNSProxy
                → DNSProxyProvider.startProxy() carrega lista do App Group
```

### 2 — Usuário tenta acessar um site bloqueado

```
Safari → dns resolve("bet365.com")
        │
        ▼
iOS entrega query DNS para DNSProxyProvider.handleNewFlow()
        │
        ├─ extractDomain(packet) → "bet365.com"
        │
        ├─ shouldBlock("bet365.com")
        │       → activeDomains.contains { lowered == blocked
        │                               || lowered.hasSuffix("." + blocked) }
        │       → true (está na lista do Gist)
        │
        └─ makeNXDOMAIN(query)
                → QR=1, RCODE=3 (Name Error)
                → Safari recebe "Não foi possível encontrar o servidor"
                → site não carrega ✅
```

### 3 — Atualização automática da lista

```
BlocklistSyncService.refreshIfNeeded()
        │
        ├─ lastFetch < 24h E cache não vazio?
        │   └─ completion(false) — nada a fazer
        │
        └─ isStale → forceRefresh()
                │
                └─ URLSession GET → Gist raw URL
                        │
                        ├─ linha a linha → normalizeDomain()
                        │       ├─ ignora comentários (# e //)
                        │       ├─ trata "0.0.0.0 dominio.com" (hosts format)
                        │       ├─ remove https://, wildcards, paths
                        │       └─ valida RFC 1035 (chars, labels, tamanho)
                        │
                        └─ AppGroupHelper.saveBlockedDomains(domains)
                           AppGroupHelper.blockedDomainsLastFetch = now
```

---

## Lista de Domínios — Gist Compartilhado com Android

Ambas as plataformas usam **o mesmo Gist**:

```
https://gist.github.com/hidekiiwasa/2fb62fe5fa9781f30a369b1fc41e204f/raw/latin_america_blacklist_bets_cassino_brazil.txt
```

O arquivo está no formato hosts file:
```
0.0.0.0 bet365.com
0.0.0.0 blaze.com
# comentário ignorado
betfair.com
```

O `BlocklistSyncService.normalizeDomain()` é um espelho direto do `BlockedDomainsRepository.normalizeDomain()` do Android — aceita os mesmos formatos e aplica as mesmas regras de validação.

### Fallback para primeira execução

Se o App Group ainda estiver vazio (app instalado mas nunca conectou ao Gist), o `DNSProxyProvider` cai no `BlockedDomains.all` — 5 domínios estáticos definidos em `BlockedDomains.swift`. Após o primeiro download, a lista estática é substituída pela lista do Gist.

---

## App Group — Chaves do UserDefaults Compartilhado

Suite name: `group.com.bethunterapp.ios`

| Chave | Tipo | Quem escreve | Quem lê | Descrição |
|---|---|---|---|---|
| `protectionEnabled` | `Bool` | App principal | App principal | Se a proteção está ativa |
| `familyActivitySelectionData` | `Data` | App principal | App principal | `FamilyActivitySelection` em JSON |
| `blocked_domains_list` | `[String]` | `BlocklistSyncService` | `DNSProxyProvider` | Lista de domínios do Gist |
| `blocked_domains_last_fetch` | `Double` | `BlocklistSyncService` | `BlocklistSyncService` | Timestamp Unix da última busca |

---

## Identificadores

| Item | Valor |
|---|---|
| Bundle ID da app | `com.bethunter.app.rick` |
| Bundle ID da extensão DNS | `com.bethunter.app.rick.DNSProxy` |
| App Group | `group.com.bethunterapp.ios` |
| Módulo React Native | `BetBlocking` |

---

## Como o DNS Proxy Intercepta Tráfego

A extensão `NEDNSProxyProvider` recebe cada fluxo DNS do sistema operacional. Diferente do Android (que cria um túnel TUN e parseia pacotes IPv4/UDP brutos), no iOS o sistema entrega os fluxos já como `NEAppProxyUDPFlow` — não é necessário implementar parsing de cabeçalhos IP/UDP.

```
handleNewFlow(flow: NEAppProxyFlow)
        │
        └─ cast para NEAppProxyUDPFlow
                │
                └─ readDatagrams → loop de leitura
                        │
                        ├─ extractDomain(packet: Data)
                        │       → lê wire format DNS (offset 12 em diante)
                        │       → extrai labels e une com "."
                        │
                        ├─ shouldBlock(domain)
                        │       → lê activeDomains (App Group)
                        │       → exact match OU hasSuffix match (subdomínios)
                        │
                        ├─ BLOQUEADO → makeNXDOMAIN()
                        │       → copia query, seta QR=1 no byte[2]
                        │       → seta RCODE=3 no byte[3]
                        │       → zera ANCOUNT, NSCOUNT, ARCOUNT
                        │
                        └─ NÃO BLOQUEADO → forward(query, endpoint: 8.8.8.8)
                                → createUDPSession(to: NWHostEndpoint("8.8.8.8", "53"))
                                → encaminha e devolve resposta real
```

O bloqueio é via **NXDOMAIN** (domínio não existe), não via IP `0.0.0.0`. Isso funciona em Safari, Chrome, Firefox, e qualquer outro app que faça resolução DNS normalmente — o site simplesmente não carrega.

---

## Frameworks Utilizados

| Framework | Versão mínima | Uso |
|---|---|---|
| `FamilyControls` | iOS 16.0 | Autorização Screen Time + `FamilyActivityPicker` |
| `ManagedSettings` | iOS 15.0 | `ManagedSettingsStore.shield` para bloquear apps |
| `NetworkExtension` | iOS 9.0 | `NEDNSProxyManager` (app) + `NEDNSProxyProvider` (extensão) |
| `SwiftUI` | iOS 13.0 | `BlockingControlView` e `ActivityPickerWrapper` |
| `Foundation` | - | `URLSession` (Gist download), `UserDefaults` (App Group) |

A feature inteira requer **iOS 16.0** por causa do `FamilyControls`.

---

## Diferenças em Relação ao Android

| Aspecto | Android | iOS |
|---|---|---|
| Mecanismo de bloqueio DNS | VPN local (TUN interface) + packet parsing manual | `NEDNSProxyProvider` (sistema gerencia) |
| Bloqueio de apps nativos | Não implementado | FamilyControls + ManagedSettings |
| Ícone de VPN na barra | Sim (chave VPN) | Não (DNS proxy é transparente) |
| Persistência do serviço | Foreground service + BootReceiver | iOS gerencia ciclo de vida da extensão |
| Auto-restart | AlarmManager (1.5s) | iOS reinicia extensão automaticamente |
| Refresh da lista em background | Thread sleepando 24h no foreground service | Ao abrir o app / ao ativar proteção |
| Notificação persistente | Sim (obrigatória para foreground service) | Não necessária |

---

## Requisitos no Apple Developer Portal

As capabilities **Family Controls** e **Network Extensions** são restritas. Antes de buildar em dispositivo real:

1. No [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list):
   - App ID `com.bethunter.app.rick` → ativar **Family Controls**, **Network Extensions** (dns-proxy), **App Groups**
   - App ID `com.bethunter.app.rick.DNSProxy` → ativar **Network Extensions** (dns-proxy), **App Groups**
2. Criar/atualizar **Provisioning Profiles** para ambos os targets
3. Xcode → Signing & Capabilities: selecionar os profiles corretos

---

## Como Atualizar a Lista de Fallback (opcional)

O arquivo `BlockedDomains.swift` só é usado quando o Gist ainda não foi baixado (primeira execução offline). Para adicionar domínios ao fallback:

```swift
struct BlockedDomains {
  static let all: [String] = [
    "bet365.com",
    "betano.bet.br",
    "pixbet.com",
    "esportes.betfair.com",
    "br.bwin.com",
    // adicionar aqui apenas se necessário
  ]
}
```

Para adicionar domínios permanentemente a todos os usuários, basta atualizar o **Gist** — nenhuma nova versão do app é necessária.

---

## Impacto no Android

**Zero.** O fluxo Android permanece completamente inalterado:

- O botão "Bloquear" no Android continua a abrir o modal VPN existente
- O módulo `BetBlocker` (Kotlin) e o `BetBlockerVpnService` não foram tocados
- A verificação `Platform.OS === "ios"` garante que o código iOS só executa no iOS

---

## Metro (JavaScript) em Debug

Em **Debug**, o JavaScript é servido pelo Metro:

1. Na raiz do projeto (pasta do `package.json`), iniciar antes de abrir o app:
   ```bash
   npx expo start
   ```
2. Compilar no Xcode ou via `npx expo run:ios`

**Simulador:** Metro em `127.0.0.1:8081`.  
**iPhone físico:** iPhone e Mac na mesma rede Wi-Fi. Se o IP gerado for `169.254.x.x` (link-local), definir `RCT_METRO_HOST` no scheme do Xcode com o IP correto da máquina (ex: `192.168.1.10:8081`).
