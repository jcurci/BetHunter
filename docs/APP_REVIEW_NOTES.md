# App Review — textos prontos (iOS)

Toda submissão iOS dispara a análise de VPN da Apple (o app tem `NEPacketTunnelProvider`).
Os textos abaixo vão **no App Store Connect**: resposta no Resolution Center e campo
*App Review Information › Notes*. Editar este arquivo não muda nada na Apple.

Fatos técnicos conferidos no código em 2026-09-14. Se o túnel mudar, revise o §2.

---

## 1. Resposta à rejeição 2.1(a) — tela preta no iPad (02/09/2026)

> Enviar **só depois** que o build passar nos testes de boot (instalação limpa, Release) em iPad.

```
Hello,

Thank you for the detailed report. We made the following changes in version 1.2.0 (5):

1. The app now supports iPad natively. The previously reviewed build was iPhone-only
   and ran in iPhone compatibility mode on iPad; it is now a universal app with an
   iPad-specific configuration.
2. We hardened the app's startup sequence so that an optional feature can no longer
   prevent the interface from loading.
3. We tested a clean install (no previous versions) of the release build on iPad Pro
   11-inch and 13-inch running iPadOS 26, and on iPhone.

If the issue still occurs on your device, we would greatly appreciate any crash or
device logs, so that we can investigate further.

Thank you,
The BetHunter team
```

## 2. Divulgação de dados da VPN (as 3 perguntas da Apple)

Responder na mensagem do Resolution Center **e** repetir em *App Review Information › Notes*.

```
BetHunter includes an on-device VPN (NEPacketTunnelProvider) that is used exclusively
as a DNS filter to block gambling and betting websites. It is enabled only by the user,
to support recovery from gambling addiction.

1) What user data does the VPN collect?
None. The tunnel captures only DNS queries. The default route is explicitly excluded;
only 20 host routes enter the tunnel (the local resolver address, IPv4 and IPv6, plus
18 routes to known public encrypted-DNS resolvers, which are dropped so that the filter
cannot be bypassed). No browsing traffic passes through the tunnel. Domain names are
evaluated in memory against a local blocklist and are never stored, logged or sent to
our servers.

2) For what purpose?
Blocking gambling and betting domains. A blocked domain receives a local NXDOMAIN
response. The blocklist is downloaded from a public list; this is a download only, and
no user data is sent.

3) Is any data shared with third parties?
We do not sell or share user data. DNS queries for domains that are not blocked are
forwarded unchanged to the public DNS resolver Quad9 (9.9.9.9 / 149.112.112.112), only
so that they can be resolved, as with any DNS resolver. To prevent circumvention, while
the blocker is active the app also blocks known encrypted-DNS providers and the iCloud
Private Relay setup hostnames (mask.icloud.com, mask-h2.icloud.com,
mask-api.icloud.com), which may degrade Private Relay. Users can turn the blocker off
at any time.
```

## 3. Notas da review (App Review Information)

```
Demo account:
  Email:    [PREENCHER]
  Password: [PREENCHER]

After login, users without a subscription are shown the coupon/paywall screen.
Purchases can be completed with a sandbox account. The gambling blocker (on-device
DNS filter, see VPN disclosure above) is enabled from the Home screen.
```

## 4. Diagnóstico do túnel (só em build DEBUG)

`PacketTunnelProvider` conta `queriesSeen`/`queriesBlocked` e registra o nome consultado
**apenas em `#if DEBUG`**. Se `queriesSeen` fica em zero enquanto você navega, o iOS não
está entregando o DNS ao resolver falso. O build Release não registra nada sobre os
domínios acessados, e é isso que sustenta a resposta 1 do §2.
