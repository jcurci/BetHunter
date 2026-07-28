# Notas para a App Review — BetHunter

Este documento reúne o que precisa ser colado no App Store Connect e as
pendências externas do lançamento do bloqueador iOS.

---

## 1. Pré-requisitos que dependem da Apple

Resolver **antes** de submeter. Os dois primeiros levam semanas.

| # | Item | Onde | Estado |
|---|---|---|---|
| P1 | Entitlement **Family Controls (Distribution)** para `com.bethunter.app.rick` | developer.apple.com/contact/request/family-controls-distribution | ⬜ |
| P2 | App ID `com.bethunter.app.rick`: Network Extensions + App Groups + Family Controls + Push | Certificates, IDs & Profiles | ⬜ |
| P3 | **Novo App ID** `com.bethunter.app.rick.PacketTunnel` com Network Extensions + App Groups | idem | ⬜ |
| P4 | App Group `group.com.bethunter.app.rick` associado aos **dois** App IDs | idem | ⬜ |
| P5 | `eas credentials -p ios` para gerar o profile da extensão | terminal | ⬜ |
| P6 | Desmarcar disponibilidade em **Mac Apple Silicon** | App Store Connect › Pricing and Availability | ⬜ |

`packet-tunnel-provider` no iOS **não** exige o formulário de solicitação da
Apple — esse formulário é para `content-filter-provider` e system extensions de
macOS. Basta o toggle de capability no App ID.

A conta já é Organização, então a diretriz **5.4.1** ("apps de VPN só podem ser
oferecidos por desenvolvedores inscritos como organização") está satisfeita.

O App ID `com.bethunter.app.rick.DNSProxy` pode ser aposentado.

---

## 2. Notas de revisão (colar no campo "Notes" da submissão)

### Português

> O BetHunter é uma ferramenta de autoexclusão para pessoas em recuperação de
> vício em apostas no Brasil. Seu recurso central é um **filtro de DNS local, no
> próprio aparelho**, que o usuário ativa voluntariamente para si mesmo.
>
> **A VPN é inteiramente local. Nenhum tráfego sai do aparelho por servidor
> nosso.** Usamos `NEPacketTunnelProvider` apenas como mecanismo para receber as
> consultas DNS do dispositivo. As `includedRoutes` do túnel contêm **somente
> duas rotas de host** — os endereços do resolver interno `198.18.0.2/32` e
> `fd6e:a81b:704f:1211::2/128`. Todo o restante do tráfego (`0.0.0.0/0` e `::/0`)
> está em `excludedRoutes` e nunca entra no túnel. Não fazemos proxy, não
> inspecionamos, não registramos, não armazenamos e não transmitimos tráfego do
> usuário.
>
> Cada consulta DNS é comparada, no próprio aparelho, contra uma blocklist
> pública de casas de aposta. As que casam recebem um NXDOMAIN sintético; todas as
> outras são encaminhadas sem modificação a um resolver público (Quad9). Nenhum
> nome consultado é registrado, persistido ou enviado a servidores nossos.
>
> **Family Controls / ManagedSettings** é usado com autorização `.individual`: o
> usuário bloqueia os *próprios* aplicativos de aposta no *próprio* aparelho,
> escolhidos pelo `FamilyActivityPicker` da Apple. Nunca vemos quais aplicativos
> foram selecionados — recebemos apenas tokens opacos, guardados no App Group do
> próprio app.
>
> **Para testar:** entre com a conta de demonstração abaixo (já com assinatura
> ativa), abra Início › "Bloquear Apostas", conceda o acesso ao Tempo de Uso,
> selecione qualquer aplicativo e ative o botão. O iOS apresentará o alerta padrão
> de configuração de VPN. Com o túnel conectado, `bet365.com` e sites semelhantes
> deixam de resolver no Safari; toda a navegação restante segue normal.
>
> Conta de demonstração: `<email>` / `<senha>` (premium ativo)
> Política de privacidade: `<URL>`

### English

> BetHunter is a gambling self-exclusion tool for people recovering from betting
> addiction in Brazil. Its core feature is a **local, on-device DNS filter** that
> the user voluntarily enables for themselves.
>
> **The VPN is entirely local. No traffic leaves the device through any server we
> operate.** We use `NEPacketTunnelProvider` purely as a mechanism to receive the
> device's DNS queries. The tunnel's `includedRoutes` contain **only two host
> routes** — the internal resolver addresses `198.18.0.2/32` and
> `fd6e:a81b:704f:1211::2/128`. All other traffic (`0.0.0.0/0`, `::/0`) is in
> `excludedRoutes` and never enters the tunnel. We do not proxy, inspect, log,
> store, or transmit any user traffic.
>
> Each DNS query is compared on-device against a public gambling blocklist.
> Matches receive a synthetic NXDOMAIN; everything else is forwarded unmodified to
> a public resolver (Quad9). No query names are ever logged, persisted, or sent to
> our servers.
>
> **Family Controls / ManagedSettings** is used with `.individual` authorization:
> the user shields *their own* betting apps on *their own* device, chosen through
> Apple's `FamilyActivityPicker`. We never see which apps are selected — only
> opaque tokens, stored in the app's own App Group.
>
> **To test:** sign in with the demo account below (already provisioned with an
> active subscription), open Início › "Bloquear Apostas", grant Screen Time
> access, select any app, and enable the toggle. iOS will present the standard VPN
> configuration prompt. Once connected, `bet365.com` and similar sites fail to
> resolve in Safari; all other browsing is unaffected.
>
> Demo account: `<email>` / `<password>` (premium enabled)
> Privacy policy: `<URL>`

---

## 3. Privacidade

- **Não** marcar "Browsing History" na nutrition label. Não coletamos: as
  consultas são comparadas em memória e descartadas.
- `ios/BetHunter/PrivacyInfo.xcprivacy` e `ios/PacketTunnel/PrivacyInfo.xcprivacy`
  declaram `NSPrivacyCollectedDataTypes: []`. Extensões precisam do próprio
  manifesto; a ausência já é warning automático no upload.
- Acrescentar à política de privacidade uma seção "Filtro de DNS local": o que o
  túnel enxerga, que o processamento é só em memória no aparelho, que nada é
  registrado ou transmitido, e como desativar.

**Anexar uma gravação de tela** com: ativação → site de aposta bloqueado →
navegação normal funcionando. Isso resolve a maior parte do vai-e-vem de 5.4 numa
única rodada.

---

## 4. Verificação antes de submeter

```bash
./scripts/verify-ios-blocking.sh   # lógica, sem aparelho
npx tsc --noEmit
```

O que **só um iPhone físico** verifica (simulador não roda packet tunnel):

1. `dig @198.18.0.2 bet365.com` → `NXDOMAIN`; `dig google.com` → resposta normal.
   Repetir em Safari, Chrome, Edge e Firefox.
2. `dig -t HTTPS bet365.com` → NXDOMAIN (regressão do qtype 65 / ECH).
3. **Rede IPv6-only / NAT64** — o modo de falha que quebra em silêncio no Brasil,
   onde Vivo, Claro e TIM usam IPv6 amplamente.
4. Handoff Wi-Fi → LTE no meio da navegação: a resolução continua.
5. Reboot com on-demand: o túnel sobe antes do primeiro desbloqueio e a blocklist
   carrega (valida o `FileProtectionType.none`).
6. Instruments na extensão + flood de consultas: bem abaixo de 15 MB.
7. "Desconectar" em Ajustes › VPN → on-demand religa.
8. Pausa por assinatura → o túnel **fica** caído; retomada → volta com os shields.

---

## 5. Rollout

Subir atrás da flag `ios_tunnel_enabled` do backend, lida no `didBecomeActive`:
TestFlight interno → 5% → geral. O kill switch permite estancar um bug em campo
sem esperar review da Apple.

Métrica de parada: qualquer relato de "sem internet", ou taxa de passthrough do
disjuntor acima de zero.
