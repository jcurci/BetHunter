# Plano de resolução — rejeição da App Review (iOS, VPN)

**Data:** 29/07/2026
**Submissão:** BetHunter iOS, `com.bethunter.app.rick`, versão 1.1.2 build 2
**Situação:** review travada por pedido automático de informação sobre VPN.

Documentos relacionados:
- `docs/APP_REVIEW_NOTES.md` — notas de review, respostas prontas (PT/EN), checklist de testes
- `docs/SITE_AJUSTES_APP_REVIEW.md` — briefing de execução para o site
- `PRIVACY_POLICY.md` — política de referência (interna; **não** é a publicada)

---

## 0. O que a Apple efetivamente pediu

A mensagem recebida **não é** rejeição por violação de diretriz. É bloqueio de
fluxo: *"Additional information is required for review of this submission to
proceed."* A análise automática detectou VPN no binário e exige três respostas:

1. Que informação do usuário o app coleta usando a VPN?
2. Com que finalidade? (explicação completa de todos os usos planejados)
3. Os dados serão compartilhados com terceiros? Se sim, para quê e onde ficam
   armazenados?

E exige que as respostas sejam entregues em **dois lugares**: na resposta à
mensagem no App Store Connect **e** acrescentadas à seção *App Review
Information*.

A detecção está correta: o app tem VPN de verdade no iOS (target
`ios/PacketTunnel/`, `NEPacketTunnelProvider`, entitlement
`com.apple.developer.networking.networkextension: packet-tunnel-provider`).

**Consequência permanente:** o app está sob a diretriz **5.4**, que exige conta de
organização (já satisfeita), proíbe vender ou compartilhar os dados, e obriga a
divulgação desse tratamento na política de privacidade. Toda submissão futura
tende a disparar a mesma checagem.

### Origem de cada item deste plano

Para não confundir exigência com prevenção, cada item abaixo está marcado:

| Marca | Significado |
|---|---|
| **[APPLE]** | Pedido literal da mensagem recebida |
| **[5.4]** | Não foi pedido na mensagem, mas é exigência da diretriz que agora se aplica |
| **[RISCO]** | Achado da nossa auditoria; ninguém cobrou, mas causa a próxima rejeição se ficar |
| **[BUG]** | Defeito técnico encontrado no caminho, independente da review |

---

## 1. Concluído

| # | Item | Origem |
|---|---|---|
| 1 | Diagnóstico: pedido de informação, não violação; detecção de VPN confere | [APPLE] |
| 2 | Política de referência corrigida — iOS incluído, rotas, Quad9, Family Controls, anti-contorno, cláusula de não-compartilhamento (`PRIVACY_POLICY.md`) | [5.4] |
| 3 | Notas de review corrigidas — removida a afirmação falsa de "somente duas rotas de host" (são ~20), divulgado o blackhole de DoH e a degradação do iCloud Private Relay (`docs/APP_REVIEW_NOTES.md`) | [RISCO] |
| 4 | Crash no launch corrigido: `com.bethunter.app.blocklistRefresh` ausente de `BGTaskSchedulerPermittedIdentifiers` fazia `BGTaskScheduler.register` levantar exceção | [BUG] |
| 5 | Conta demo validada em produção: login HTTP 200, `isPremium: true`, `verified: true`, `onboarding_completed: true` | [APPLE] |
| 6 | Auditoria do site: a política publicada é **outro documento**, sem nenhuma menção a VPN/DNS; e a home exibe o badge "Bloqueio local · Sem VPN" | [RISCO] |
| 7 | Briefing de execução do site, com regras para agente de IA (`docs/SITE_AJUSTES_APP_REVIEW.md`) | [5.4] |
| 8 | As 3 respostas redigidas e conferidas contra o código (rotas, upstreams, logging, terceiros) | [APPLE] |
| 9 | Credenciais da conta demo mantidas fora do repositório (é público) | [RISCO] |

## 2. Bloqueante

| # | Item | Responsável | Origem |
|---|---|---|---|
| 10 | Site no ar com as 5 mudanças do briefing | resp. do site | [5.4] + [RISCO] |
| 11 | Verificar a URL pública após o deploy (checklist de 5 itens do briefing) | Claude | [5.4] |

Nada da seção 3 deve ir antes destes dois. Responder à Apple com a política
publicada silenciosa sobre VPN é divulgação incompleta; e com a home dizendo
"Sem VPN", é contradição pública.

## 3. App Store Connect

| # | Item | Origem |
|---|---|---|
| 12 | Responder a mensagem com as 3 respostas **e** colá-las em App Review Information | [APPLE] |
| 13 | Preencher Sign-In Information com a conta demo (campos próprios, não texto livre) | [APPLE] |
| 14 | Colar o bloco em inglês do `APP_REVIEW_NOTES.md` §2 no campo Notes | [RISCO] |
| 15 | Anexar gravação de tela: ativação → site de aposta bloqueado → navegação normal | [RISCO] |
| 16 | Conferir App Privacy: *Browsing History* desmarcado, coerente com `NSPrivacyCollectedDataTypes: []` | [5.4] |
| 17 | Desmarcar disponibilidade em Mac Apple Silicon | [RISCO] |
| 18 | Trocar a senha `123` da conta demo por uma forte | [RISCO] |
| 19 | Atualizar a política no Play Console | [5.4] |

## 4. Build novo

O item 4 só vale em binário novo.

| # | Item | Origem |
|---|---|---|
| 20 | Bump do `CFBundleVersion` (hoje `2`), build e upload | [BUG] |
| 21 | `./scripts/verify-ios-blocking.sh` + `npx tsc --noEmit` | [BUG] |
| 22 | Testes que só iPhone físico pega (`APP_REVIEW_NOTES.md` §4) — prioridade: rede IPv6-only/NAT64, e "Desconectar" em Ajustes › VPN com religamento on-demand | [RISCO] |
| 23 | Opcional: mover chaves de `Info.plist`/entitlements para `ios.infoPlist` no `app.config.ts`, para sobreviverem a `expo prebuild --clean` | [BUG] |

## 5. Pendente de verificação (sem acesso daqui)

| # | Item | Origem |
|---|---|---|
| 24 | A descrição do app na loja menciona o bloqueio via VPN local? A 5.4 quer clareza na ficha, não só na política | [5.4] |
| 25 | Estado real dos P1–P5 das notas (entitlement Family Controls de distribuição, App IDs, App Group). O build subiu, então presumivelmente resolvidos | [RISCO] |
| 26 | Revisar `NSLocalNetworkUsageDescription` (texto cita servidor de desenvolvimento) junto com `NSAllowsLocalNetworking: true` antes do build de loja | [RISCO] |

---

## Caminho crítico

```
10 (site no ar)
  └─> 11 (verificação na URL pública)
        └─> 12 + 13 (responder à Apple)  ← destrava a review

Em paralelo, sem bloquear a resposta: 14–19, 20–23
```

A resposta à mensagem **não** depende do build novo. O build novo (item 20) pode
ir depois, ou junto, conforme a Apple responder.
