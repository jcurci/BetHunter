# Bloqueio de Apostas — iOS

Documentação da feature de bloqueio de apps e sites de apostas no iOS, implementada com **FamilyControls**, **ManagedSettings** e **NEDNSProxyProvider**.

---

## Visão Geral

A feature permite ao usuário:

1. **Bloquear apps** de apostas no dispositivo via Screen Time (FamilyControls + ManagedSettings)
2. **Bloquear sites** de apostas via DNS Proxy (NEDNSProxyProvider)
3. **Controlar tudo** numa tela unificada com toggle de ativar/desativar

O ponto de entrada é o botão **"Bloquear"** que já existia na tela Home do app.

---

## Arquitetura

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
BlockingFlowCoordinator (Swift)
  │
  ├─ AuthorizationCenter.shared (FamilyControls)
  │   ├─ Não autorizado → requestAuthorization → FamilyActivityPicker
  │   └─ Já autorizado → BlockingControlView
  │
  ▼
BlockingControlView (SwiftUI)
  │
  ├─ ManagedSettingsStore → bloqueia apps selecionados
  ├─ NEDNSProxyManager → ativa/desativa extensão DNS
  └─ AppGroupHelper → persiste estado no App Group
        │
        ▼
DNSProxy Extension (NEDNSProxyProvider)
  └─ Intercepta DNS → NXDOMAIN para domínios bloqueados
```

---

## Ficheiros Criados

### App Principal — `ios/BetHunter/Blocking/`

| Ficheiro                        | Responsabilidade                                                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BetBlockingModule.swift`       | Módulo nativo React Native. Expõe `openBlockingFlow()` para o JS. Verifica iOS 16+ antes de iniciar.                                                       |
| `BetBlockingModule.m`           | Ponte Objective-C (`RCT_EXTERN_MODULE`) para registar o módulo `BetBlocking` no React Native.                                                              |
| `BlockingFlowCoordinator.swift` | Singleton que orquestra o fluxo: verifica autorização FamilyControls, apresenta o picker ou a tela de controle.                                            |
| `BlockingControlView.swift`     | Tela SwiftUI principal com toggle de proteção, seção de apps bloqueados, seção de sites bloqueados, e botão para desativar tudo.                           |
| `AppGroupHelper.swift`          | Helper para ler/escrever no `UserDefaults` do App Group (`group.com.bethunterapp.ios`). Persiste a `FamilyActivitySelection` e a flag `protectionEnabled`. |
| `BlockingManager.swift`         | Gerencia o `ManagedSettingsStore` (bloqueio de apps) e o `NEDNSProxyManager` (ativação/desativação do DNS Proxy).                                          |
| `BlockedDomains.swift`          | Lista estática de domínios de apostas a bloquear. Compartilhado com a extensão DNS (compilado em ambos os targets).                                        |

### Extensão DNS — `ios/DNSProxy/`

| Ficheiro                 | Responsabilidade                                                                                                                                                            |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DNSProxyProvider.swift` | Subclasse de `NEDNSProxyProvider`. Intercepta consultas DNS, verifica contra a lista de domínios bloqueados, e retorna NXDOMAIN ou encaminha para o DNS upstream (8.8.8.8). |
| `Info.plist`             | Metadata da extensão: `NSExtensionPointIdentifier = com.apple.networkextension.dns-proxy`, classe principal, idioma pt-BR.                                                  |
| `DNSProxy.entitlements`  | Entitlements: Network Extension (dns-proxy) + App Group.                                                                                                                    |

### Ficheiros Alterados

| Ficheiro                                  | O que mudou                                                                                                                                                                              |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/screens/Home/Home.tsx`               | `onPress` do botão "Bloquear": no iOS chama `BetBlocking.openBlockingFlow()`; no Android mantém `setShowBlockModal(true)`. Adicionado `BetBlocking` ao destructure de `NativeModules`.   |
| `ios/BetHunter/BetHunter.entitlements`    | Adicionados: `com.apple.developer.family-controls`, `com.apple.developer.networking.networkextension` (dns-proxy), `com.apple.security.application-groups` (group.com.bethunterapp.ios). |
| `ios/BetHunter/Info.plist`                | `LSMinimumSystemVersion` → 16.0. Adicionada chave `NSFamilyControlsUsageDescription` em português.                                                                                       |
| `ios/Podfile.properties.json`             | Adicionado `ios.deploymentTarget: "16.0"`.                                                                                                                                               |
| `ios/BetHunter.xcodeproj/project.pbxproj` | Deployment target 16.0, grupo "Blocking" com 7 ficheiros, novo target "DNSProxy", build phases, "Embed Foundation Extensions", target dependency.                                        |

---

## Fluxo do Usuário

```
Toca "Bloquear" na Home
         │
         ▼
    iOS >= 16?
    ├─ Não → Alerta "Requer iOS 16+"
    └─ Sim ▼
         FamilyControls autorizado?
         ├─ Não → Solicita permissão
         │        ├─ Aceita → FamilyActivityPicker (seleciona apps)
         │        │           └─ Salva → Abre BlockingControlView
         │        └─ Recusa → Alerta "Permissão necessária"
         └─ Sim → Abre BlockingControlView direto
                   │
                   ├─ Toggle proteção ON/OFF
                   ├─ Alterar seleção de apps
                   └─ Desativar tudo
```

---

## Identificadores

| Item                      | Valor                                      |
| ------------------------- | ------------------------------------------ |
| Bundle ID da app          | `com.bethunter.app.rick` (conforme Xcode)  |
| Bundle ID da extensão DNS | `com.bethunter.app.rick.DNSProxy` (igual em `BlockingManager.providerBundleIdentifier`) |
| App Group                 | `group.com.bethunterapp.ios`    |
| Módulo React Native       | `BetBlocking`                   |

---

## Chaves do App Group (UserDefaults)

| Chave                         | Tipo   | Descrição                                    |
| ----------------------------- | ------ | -------------------------------------------- |
| `protectionEnabled`           | `Bool` | Se a proteção está ativa ou não              |
| `familyActivitySelectionData` | `Data` | `FamilyActivitySelection` codificada em JSON |

---

## Domínios Bloqueados (DNS)

Lista definida em `BlockedDomains.swift` (editável — basta adicionar ao array):

- `bet365.com`
- `betano.bet.br` (site BR: `www.betano.bet.br`)
- `pixbet.com`
- `esportes.betfair.com`
- `br.bwin.com`

O bloqueio inclui subdomínios automaticamente (ex: `www.bet365.com` também é bloqueado).

---

## Como o DNS Proxy Funciona

1. O sistema iOS roteia consultas DNS pela extensão quando ativada
2. A extensão lê cada pacote DNS e extrai o domínio consultado
3. Se o domínio está na lista (ou é subdomínio de um domínio da lista):
   - Retorna **NXDOMAIN** (domínio não existe) — o site não carrega
4. Se o domínio não está na lista:
   - Encaminha para o DNS upstream (Google DNS 8.8.8.8) e devolve a resposta normal

---

## Frameworks Utilizados

| Framework          | Uso                                                              |
| ------------------ | ---------------------------------------------------------------- |
| `FamilyControls`   | Autorização Screen Time + `FamilyActivityPicker`                 |
| `ManagedSettings`  | `ManagedSettingsStore` para aplicar shield nos apps selecionados |
| `NetworkExtension` | `NEDNSProxyManager` (app) + `NEDNSProxyProvider` (extensão)      |
| `SwiftUI`          | UI da `BlockingControlView` e `ActivityPickerWrapper`            |

---

## Requisitos no Apple Developer Portal

As capabilities **Family Controls** e **Network Extensions** são **restritas**. Antes de buildar em dispositivo real:

1. No [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list):
   - App ID `com.bethunter.app.rick` → ativar **Family Controls**, **Network Extensions**, **App Groups**
   - App ID `com.bethunter.app.rick.DNSProxy` → ativar **Network Extensions**, **App Groups**
2. Criar/atualizar **Provisioning Profiles** para ambos os targets
3. No Xcode → Signing & Capabilities: selecionar os profiles corretos

---

## Impacto no Android

**Zero.** O fluxo Android permanece inalterado:

- O botão "Bloquear" no Android continua a abrir o modal VPN existente (`setShowBlockModal(true)`)
- O módulo `BetBlocker` (Kotlin) e o `BetBlockerVpnService` não foram tocados
- A verificação `Platform.OS === "ios"` garante que o novo código só executa no iOS

---

## Como Adicionar Novos Domínios

Editar `ios/BetHunter/Blocking/BlockedDomains.swift`:

```swift
struct BlockedDomains {
  static let all: [String] = [
    "bet365.com",
    "betano.bet.br",
    "pixbet.com",
    "esportes.betfair.com",
    "br.bwin.com",
    // Adicionar novos domínios aqui:
    "novosite.com",
  ]
}
```

O ficheiro é compilado em ambos os targets (app + extensão), então a alteração aplica-se automaticamente aos dois.

---

## Metro (JavaScript) em Debug

Em **Debug**, o JavaScript **não** vai embutido no `.app` (`SKIP_BUNDLING`); a app carrega do **Metro**.

1. Na raiz do projeto (pasta do `package.json`), corre **antes** de abrir a app:
   ```bash
   npx expo start
   ```
2. Depois compila no Xcode ou `npx expo run:ios` / Run no simulador ou iPhone.

Se aparecer **"No script URL provided"** / `unsanitizedScriptURLString = (null)`, em geral é **Metro parado** ou o Mac ainda a iniciar o bundler. O `AppDelegate` foi ajustado para montar um URL de fallback (`localhost:8081` ou `ip.txt` no dispositivo físico), mas **o Metro tem de estar a correr** para o JS carregar.

**Simulador:** o `AppDelegate` usa **127.0.0.1:8081** (o Metro corre no Mac; não uses o IP `169.254.x.x` que o script às vezes gera — é link-local e não chega ao packager).

**iPhone físico:** iPhone e Mac na mesma rede Wi‑Fi; o build Debug gera `ip.txt` com o IP da máquina. Se o IP for **169.254.x.x**, o código ignora-o e podes definir **`RCT_METRO_HOST`** no scheme do Xcode (ex.: `192.168.1.10:8081`) ou o host manualmente no menu de desenvolvimento do React Native.
