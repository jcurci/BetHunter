# Bloqueio de Apostas — Android

Como o BetBlocker funciona no Android: uma **VPN local** que intercepta DNS e responde
NXDOMAIN para domínios de aposta, mais uma camada de rotas para casas acessadas por IP cru.

> Contraparte do `docs/BLOQUEIO_APOSTAS_IOS.md`. As duas plataformas compartilham a mesma
> blocklist remota, mas **não** compartilham implementação: o iOS usa `NEPacketTunnelProvider`
> + Family Controls; o Android é 100% Kotlin próprio, sem biblioteca de terceiros.

---

## O que é e o que não é

**É** uma `VpnService` local. Nada de tráfego sai do aparelho para um servidor nosso — não há
servidor. O túnel existe só para o Android entregar as consultas de DNS ao nosso processo.

**Não é** um filtro de conteúdo, nem um proxy. Só duas coisas são interceptadas:

| Camada | O que pega | Como |
|---|---|---|
| **A — DNS** | qualquer domínio da blocklist | responde NXDOMAIN (o nome "não existe") |
| **B — IP** | casas acessadas por IP cru, sem nome | rota `/32` para dentro da tun, onde o pacote é descartado |

Todo o resto do tráfego sai direto pela rede normal. Se o bloqueador cair, o aparelho continua
funcionando — o desenho inteiro é **fail-open**.

---

## Mapa de arquivos

```
android/app/src/main/java/com/bethunter/app/
├── vpn/
│   ├── BetBlockerVpnService.kt   # o serviço: túnel, laço de pacotes, guardas, watchdog
│   ├── VpnConsent.kt             # consentimento (prepare() é a verdade, flag é cache)
│   ├── VpnStatus.kt              # a interface de VPN existe? (ConnectivityManager)
│   ├── RestartBackoff.kt         # 2s → 4s → … → 5min
│   ├── BlockerNotifications.kt   # alertas de reativação (com throttle)
│   ├── PacketReader.kt / PacketWriter.kt
├── dns/
│   ├── DnsInterceptor.kt         # bloqueia ou encaminha
│   ├── DnsPacketParser.kt        # parse de query + leitura de TTL
│   ├── DnsResponseBuilder.kt     # NXDOMAIN e SERVFAIL
│   ├── DnsResponseCache.kt       # cache de respostas encaminhadas
│   └── UpstreamDnsProvider.kt    # resolvers da rede subjacente
├── domain/
│   ├── DomainMatcher.kt          # decide bloqueio (cache → SQLite → keywords)
│   ├── DomainSuffixes.kt         # a.b.x.com → [x.com, b.x.com, a.b.x.com]
│   ├── DecisionCache.kt          # LRU de decisões
│   └── KeywordMatcher.kt         # heurística p/ mirrors não mapeados
├── repository/
│   ├── BlockedDomainsDb.kt       # SQLite: domains, blocked_ips, kv, events
│   ├── BlockedDomainsRepository.kt
│   └── BlocklistManager.kt       # download, ingestão e pisos de sanidade
├── work/
│   ├── VpnHealthWorker.kt        # health check a cada 15 min
│   ├── BlocklistRefreshWorker.kt # refresh a cada 1 h
│   └── SubscriptionEnforcementWorker.kt
├── diagnostics/VpnEventLog.kt    # timeline de eventos (SQLite, cross-process)
├── reactnative/BetBlockerModule.kt  # ponte NativeModules.BetBlocker
├── MainActivity.kt / MainApplication.kt / BootReceiver.kt
└── admin/BetHunterDeviceAdminReceiver.kt
```

Único consumidor no JS: `src/screens/Home/Home.tsx`, pela superfície tipada em
`src/infrastructure/native/blockerModule.ts`.

---

## Dois processos

```
com.bethunter.app          com.bethunter.app:vpn
┌──────────────────┐       ┌──────────────────────┐
│ React Native     │       │ BetBlockerVpnService │
│ MainActivity     │       │ (SEM React Native)   │
│ BetBlockerModule │       │ laço de pacotes      │
│ Workers          │       │ pool de DNS          │
└────────┬─────────┘       └──────────┬───────────┘
         │                            │
         └────────► SQLite ◄──────────┘
              (fonte de verdade compartilhada)
```

O serviço roda em `android:process=":vpn"` (manifesto). Um crash da UI ou do JS **não derruba a
proteção**. `MainApplication.onCreate` faz `if (!isMainProcess()) return` — o RN nunca sobe no
`:vpn`.

Consequência importante: **SharedPreferences não é confiável entre processos.** Todo estado que
os dois lados precisam enxergar mora numa tabela chave-valor no SQLite (`kv`).

---

## Caminho de um pacote DNS

```
app do usuário faz uma consulta DNS
        │
        ▼
Android entrega ao 10.0.0.1 (nosso DNS falso) ──► tun
        │
        ▼
runLoop (1 thread)  ── lê, faz parse IPv4/UDP, filtra porta 53
        │
        ▼
pool de DNS (6 threads, fila de 256)
        │
        ▼
DomainMatcher.isBlocked(domínio)
   1. DecisionCache (LRU 2000, TTL 30 min)      ─ acerto? devolve
   2. SELECT 1 FROM domains WHERE domain IN (sufixos)
   3. KeywordMatcher (regex de "bet", marcas)
        │
   ┌────┴─────────────────────┐
   ▼                          ▼
BLOQUEADO                 LIBERADO
NXDOMAIN                  DnsResponseCache ─ acerto? devolve (com o ID novo)
                              │ erro
                              ▼
                          upstream: DNS da rede → 1.1.1.1 → 8.8.8.8
                          (2 s cada, socket protect()'d)
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
                 respondeu         ninguém respondeu
                 cacheia + devolve  SERVFAIL
        │
        ▼
PacketWriter (@Synchronized) escreve de volta na tun
```

Pontos que não são detalhe:

- **O laço de leitura nunca espera pela rede.** Ele só classifica e despacha; a espera acontece
  no pool. Uma fila de thread única fazia uma consulta lenta segurar o DNS de **todos** os apps.
- **O upstream é o resolver da própria rede**, com os públicos só de reserva. Fixar 8.8.8.8
  deixava o aparelho sem internet em Wi-Fi corporativo, portal cativo e operadora que filtra DNS
  público.
- **Falha de upstream responde SERVFAIL**, não silêncio. Descartar o pacote fazia o app cliente
  esperar o próprio timeout — o usuário lê isso como "a internet travou".
- **O app fica FORA do túnel** (`addDisallowedApplication`). O DNS do próprio BetHunter
  (RevenueCat, API, Google Sign-In) não pode depender do nosso interceptador.

---

## A blocklist

**Origem:** `raw.githubusercontent.com/hidekiiwasa/blacklist-cassino/…` — hoje ~302 mil domínios
e ~19 IPs (5 MB). A mesma lista alimenta o iOS.

**Onde vive:** SQLite (`domains` e `blocked_ips`). **Nunca em memória.** Uma trie de 300k
domínios custava 150-200 MB de heap e fazia do `:vpn` o primeiro alvo do matador de memória do
Android — era a causa mais provável do "cai e volta" que os usuários relatavam.

**Quando atualiza:** laço horário dentro do serviço, `BlocklistRefreshWorker` (1 h) e um
`refreshIfStale` (24 h) no start do túnel. Fetch condicional por `ETag`.

**Proteções da ingestão** (todas em `BlocklistManager`):

- **IP é classificado ANTES de domínio.** `normalizeDomain` aceita `15.229.221.132` como domínio
  válido; sem essa ordem, os IPs iam parar na tabela de domínios e nunca bloqueavam nada (ninguém
  faz consulta DNS de um IP literal).
- **Piso de sanidade:** recusa uma lista que encolheu para menos da metade — fetch truncado não
  pode substituir uma lista boa.
- **Lock cross-process** (`kv.blocklist_refresh_lock_until`, TTL 2 min): um refresh por vez em
  todo o app. Dois refreshes simultâneos põem duas reescritas de 300k linhas disputando o mesmo
  arquivo.
- **`INGEST_VERSION`:** quando muda a forma de LER a lista (não o conteúdo), o ETag é zerado à
  força — senão o servidor responde 304 e a lista local fica interpretada pela regra velha para
  sempre.
- **`IP_ALLOWLIST`** filtra na leitura (ex.: um IP da Electronic Arts que a curadoria upstream
  incluiu e derrubaria jogos legítimos).

---

## Onde cada estado mora, e por quê

| Estado | Onde | Por quê |
|---|---|---|
| `enabled` (intenção do usuário) | SQLite `kv` | os dois processos precisam da mesma verdade |
| `revoked` | SQLite `kv` | idem — mas é só **cache**, ver Consentimento |
| `premium_paused`, `premium_lease_until`, `premium_lease_grace_used` | SQLite `kv` | o serviço decide sozinho, sem RN |
| `vpn_loop_running` | SQLite `kv` | deixa o laço morto visível de fora do `:vpn` |
| `vpn_restart_attempts` | SQLite `kv` | o processo pode ser recriado a cada tentativa |
| sinais de always-on | SQLite `kv` | gravado pelo `:vpn`, lido pelo principal |
| token JWT + base URL | `EncryptedSharedPreferences` | segredo, e só o processo principal usa |
| ETag, flags de bateria | SharedPreferences | uso local, um processo só |
| eventos de diagnóstico | SQLite `events` | ver Diagnóstico |

Regra que atravessa o repositório inteiro: **erro de leitura nunca derruba a proteção.**
`isBlockingEnabled()` devolve `true` num erro; `isPremiumLeaseValid()` também. A única exceção
deliberada é `isAnyDomainBlocked()`, que devolve `false` — o contrário seria responder NXDOMAIN
para tudo com o banco indisponível, ou seja, aparelho sem internet.

---

## Consentimento

`VpnService.prepare()` é a **fonte de verdade**; a flag `revoked` é só cache
(`vpn/VpnConsent.kt`). Sempre que o sistema confirma o consentimento, a flag é limpa.

Isso existe por um bug real: a flag era pegajosa. Bastava um `prepare()` não-nulo transitório —
a janela em que o app é atualizado e o `:vpn` é recriado pelo `MY_PACKAGE_REPLACED` — para ela
ficar gravada. Depois disso **nenhuma recuperação automática disparava**, porque os três pontos
que religam (start cego, health worker, sync da Home) também olhavam a flag. O bloqueador
desativava a cada atualização do app e só voltava com o usuário reativando na mão.

Dois caminhos distintos, de propósito:

- `onRevoke()` — o sistema **retirou** o consentimento (outra VPN assumiu, usuário desligou em
  Configurações). Persiste `revoked`, notifica.
- `handleConsentMissing()` — start cego encontrou `prepare() != null`. **Não persiste nada**,
  só agenda um health check, que reconsulta o sistema e decide.

**Always-on:** quando o usuário liga "VPN sempre ativa" nas configurações do Android, quem sobe
o serviço é o próprio sistema (`Intent` com action `VpnService.SERVICE_INTERFACE`). É a proteção
mais forte disponível, e o passo 4 da jornada guiada existe para conseguir isso.

---

## Premium

O bloqueio é premium-only, e o serviço impõe isso sozinho — não confia em ninguém avisar.

- **`premium_paused`** — alguém **confirmou** que a assinatura acabou (backend com
  `verified:true`, ou o RevenueCat pelo `blockerPremiumGate.ts`). Recusa filtrar.
- **Licença (`premium_lease_until`)** — prazo até quando o serviço pode filtrar sem nova
  confirmação. Calculado a partir do vencimento REAL (`expiresAt + 7 dias`, ou 1 ano para
  vitalício), nunca um cronômetro cego.
- **Cortesia (`premium_lease_grace_used`)** — licença vencida **sem** pausa confirmada não é
  prova de nada: pode ser só falta de contato (o JWT dura 30 dias sem refresh; aparelho que
  estrangula o WorkManager; usuário que não abre o app). Nesse caso o serviço estende sozinho por
  30 dias, até 3 vezes, notificando. Zera em qualquer confirmação real.

> **Invariante:** todo ponto que decide por licença **fora** do serviço (health worker,
> `BootReceiver`, `canRestartAfterDestroy`, `checkAndSyncBlockingStatus`, `getProtectionStatus`)
> precisa testar `!isPremiumLeaseValid() && !hasLeaseGraceAvailable()`. Só com o primeiro, ele
> barra um start que o serviço concederia — e a proteção fica caída esperando um start que
> ninguém faz.

A licença é renovada por: o worker de enforcement (backend), o gate do JS no boot e no foreground
(RevenueCat, **inclusive sem sessão autenticada**) e o `startBlocking()`.

---

## O que religa a VPN quando ela cai

Em ordem de rapidez:

1. **`START_STICKY`** — o Android recria o serviço depois de um kill por memória.
2. **Alarme de watchdog** — agendado no `onDestroy`, com backoff exponencial (2 s → 5 min,
   zerado a cada `establish()`). Só é agendado se o serviço **puder** subir (premium +
   consentimento); sem essa guarda, uma pausa por assinatura virava um ciclo infinito de 2 em 2
   segundos.
3. **Recuperação do laço** — se o `runLoop` sai sem ninguém ter pedido, o serviço reergue o
   túnel. Cinco quedas rápidas seguidas entregam o caso ao watchdog em vez de virar um novo laço.
4. **`VpnHealthWorker` (15 min)** — reconcilia intenção × realidade. Detecta também o caso mais
   perigoso: **tun de pé com o laço morto** (`isVpnActive` = true, `loop_running` = false), em que
   tudo reporta "protegido" enquanto nenhuma consulta é respondida.
5. **`BootReceiver`** — `BOOT_COMPLETED` e `MY_PACKAGE_REPLACED`.
6. **Reabertura do app** — `checkAndSyncBlockingStatus` no mount, no focus e no foreground.

Limite honesto: nada disso sobrevive a um **force-stop** do usuário. Só boot ou reabrir o app.

---

## Diagnóstico

O `VpnEventLog` grava na tabela `events` do SQLite (antes era SharedPreferences, o que o deixava
**split entre os processos** — metade da história, justamente a da VPN, era invisível). Guarda
500 entradas e **coalesce repetições** em um contador, para nenhum laço apagar o histórico.

Cada evento carrega o estado de energia do momento (power save, doze, isenção de bateria,
fabricante, modelo).

```bash
# ao vivo
adb logcat -s VpnEventLog:I BetBlockerVpn:* VpnHealthWorker:* BetBlockerDns:*

# histórico persistido (build de debug)
adb exec-out run-as com.bethunter.app cat databases/bet_blocker_domains.db > /tmp/b.db
sqlite3 /tmp/b.db "select datetime(ts/1000,'unixepoch','localtime'), event, count \
  from events order by id desc limit 30;"
```

Também exposto ao JS: `BetBlocker.getVpnEventLog()`.

**Vocabulário dos eventos mais importantes:**

| Evento | Significa |
|---|---|
| `vpn_established` | túnel de pé (o "tudo certo") |
| `service_destroy_unexpected` | caiu sem ninguém pedir → watchdog agendado |
| `loop_exited_unexpectedly` | o laço de pacotes morreu sozinho |
| `health_check_loop_dead` | tun viva e laço morto — o estado silencioso |
| `consent_flag_cleared` | havia um `revoked` obsoleto; o sistema desmentiu |
| `start_blocked_needs_consent` | start cego sem consentimento |
| `start_blocked_premium_paused` | recusa por assinatura confirmada como inativa |
| `premium_lease_grace_granted` | cortesia concedida (sem contato, não sem assinatura) |
| `dns_query_dropped_queue_full` | fila do pool saturada |
| `blocklist_updated:domains=N` | refresh trocou a lista |
| `always_on_system_start` | o sistema subiu o serviço = "VPN sempre ativa" ligada |

---

## Limites conhecidos

- **DNS criptografado passa.** Private DNS (DoT) configurado à mão e DoH do navegador não usam o
  resolver do sistema. Resolver exige túnel completo + inspeção de SNI.
- **Só uma VPN por vez no Android.** Se o usuário liga outra, a nossa é revogada.
- **Casa por IP cru** só é pega pela Camada B, que é curada manualmente + o que a lista remota
  trouxer. Operadores rodam vários IPs — o CN do certificado de um costuma denunciar os irmãos.
- **Fabricantes agressivos** (Xiaomi/MIUI e afins) matam o processo mesmo com isenção de bateria;
  por isso a jornada pede "Início automático" e a VPN sempre ativa.
- **Force-stop** desarma tudo até o próximo boot.
- **Contenção de SQLite durante o refresh** (pendência aberta): a reescrita das 300k linhas roda
  numa transação única; durante o commit, um lookup pode estourar o `busy_timeout` de 3 s e o
  domínio passa. Janela curta e parcialmente coberta pelo `KeywordMatcher`.

---

## Como testar

```bash
# subir o build
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# bloqueio efetivo (o teste que exercita a consulta ao SQLite de ponta a ponta)
adb shell ping -c1 bet365.com        # esperado: unknown host
adb shell ping -c1 www.betano.com    # esperado: unknown host
adb shell ping -c1 google.com        # esperado: resolve
adb shell ping -c1 betterment.com    # esperado: resolve (sem over-block)

# memória do processo da VPN
adb shell dumpsys meminfo com.bethunter.app:vpn | grep -A8 "App Summary"

# estado do banco
sqlite3 /tmp/b.db "select count(*) from domains; select count(*) from blocked_ips;"
```

### Testes automatizados

```bash
cd android
./gradlew :app:testDebugUnitTest        # lógica pura: sufixos, caches, TTL de DNS, backoff, IPs
./gradlew :app:connectedDebugAndroidTest # instalação nova, com emulador/aparelho ligado
```

`ColdStartBlockerTest` (androidTest) roda **dentro do processo do app** e cobre o caminho de quem
instalou agora: banco nascendo vazio, seed dos defaults, consulta por sufixos, licença ausente
tratada como válida, persistência do KV entre instâncias, lock de refresh, coalescência do event
log e o **download + ingestão das ~300 mil linhas com o bloqueio passando a valer**. É o único
lugar onde a SQL do caminho quente é executada de verdade — rode antes de cada release.

O que nenhum teste automatizado cobre: compra no RevenueCat, jornada guiada, diálogo de
consentimento do Android, device admin e VPN sempre ativa. Isso exige aparelho e conta reais.

---

## Erros já cometidos aqui (para não repetir)

- **Reload de blocklist na main thread** → ANR. Qualquer trabalho pesado de banco vai para
  executor próprio.
- **Mutar a estrutura de match enquanto o DNS a consulta** → durante o rebuild, os domínios
  passavam. Hoje: constrói do lado e troca, ou invalida cache.
- **Tratar `revoked` como verdade** em vez do `prepare()` → bloqueador desativado a cada update.
- **Reiniciar sem checar premium** no `onDestroy` → ciclo infinito de 2 s, com download da lista
  e apagamento do log de diagnóstico a cada volta.
- **Apagar `enabled` num `catch`** → falha transitória virava desligamento permanente e silencioso.
- **`PRAGMA busy_timeout` com `execSQL`** → crash em toda abertura do banco (o pragma retorna
  valor; precisa de `rawQuery`).
- **Bump de `DB_VERSION`** dropa a tabela de domínios. Tabelas novas entram com
  `CREATE TABLE IF NOT EXISTS`.
