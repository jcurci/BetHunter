# Política de Privacidade — BetHunter

**Última atualização:** 29 de julho de 2026

A BetHunter ("nós", "nosso" ou "Empresa") opera o aplicativo móvel BetHunter ("Aplicativo"), disponível para dispositivos Android e iOS. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos, compartilhamos e protegemos as informações pessoais dos usuários ("você" ou "Usuário") do Aplicativo.

Ao instalar, acessar ou utilizar o BetHunter, você concorda com as práticas descritas nesta Política de Privacidade. Caso não concorde, por favor não utilize o Aplicativo.

---

## 1. Informações que Coletamos

### 1.1. Informações fornecidas diretamente por você

Ao criar sua conta e utilizar o Aplicativo, coletamos:

- **Dados de cadastro:** nome completo, nome de usuário, endereço de e-mail e número de telefone celular.
- **Credenciais de acesso:** senha (armazenada de forma criptografada em nossos servidores).
- **Perfil de jogo:** indicação voluntária sobre se você se considera apostador ("gambler"), utilizada para personalizar sua experiência.
- **Dados financeiros:** categorias financeiras, registros de receitas e despesas (valores, descrições e datas) inseridos por você na funcionalidade "Meu Assessor".
- **Foto de perfil:** imagem escolhida por você, armazenada localmente no dispositivo.

### 1.2. Informações coletadas automaticamente

- **Dados de uso:** registros de check-in diário (streak de dias sem apostas), pontuação de energia, progresso em cursos e interações com funcionalidades do Aplicativo.
- **Token de autenticação:** identificador de sessão gerado no login, armazenado localmente para manter você autenticado.
- **Dados de assinatura:** informações relacionadas ao status de sua assinatura, processadas pelo RevenueCat (detalhes na Seção 5).
- **Consultas DNS (Android e iOS):** quando a funcionalidade de bloqueio de sites de apostas está ativada, o Aplicativo intercepta consultas DNS no dispositivo exclusivamente para verificar se o domínio solicitado consta na lista de sites bloqueados. As consultas são comparadas em memória e descartadas: **não são registradas, não são armazenadas e não são enviadas aos servidores da BetHunter** (detalhes na Seção 3).

### 1.3. Informações que NÃO coletamos

- **Não** coletamos seu histórico de navegação. A funcionalidade de bloqueio compara as consultas DNS em memória, no aparelho, e as descarta (Seção 3.5).
- **Não** rastreamos sua localização geográfica.
- **Não** acessamos sua lista de contatos, SMS ou histórico de chamadas.
- **Não** coletamos identificadores de publicidade (Advertising ID) para fins de rastreamento.
- **Não** utilizamos ferramentas de analytics de terceiros (como Firebase Analytics, Google Analytics ou similares).
- O Aplicativo **não** realiza tracking entre apps conforme definido pela Apple (ATT — App Tracking Transparency). O campo `NSPrivacyTracking` está definido como `false`.

---

## 2. Como Usamos Suas Informações

Utilizamos os dados coletados para as seguintes finalidades:

| Finalidade | Dados utilizados |
|---|---|
| Criar e gerenciar sua conta | Nome, e-mail, telefone, senha |
| Autenticar seu acesso | E-mail, senha, token de sessão |
| Exibir e personalizar a experiência | Perfil de jogo, energia, streak, betcoins |
| Funcionalidade "Meu Assessor" (controle financeiro) | Categorias, entradas financeiras |
| Sistema de check-in e streak (dias sem apostas) | Registros de check-in |
| Bloqueio de sites de apostas (VPN local) | Consultas DNS processadas localmente (Android e iOS) |
| Bloqueio de aplicativos de aposta (apenas iOS) | Seleção de apps feita por você, representada por tokens opacos do sistema |
| Gerenciar assinaturas e compras | ID do usuário, status de entitlements |
| Recuperação de senha | E-mail, código de verificação |
| Enviar notificações (quando autorizado) | Token de push notification |
| Melhorar o Aplicativo | Dados de uso agregados e anônimos |

---

## 3. Funcionalidade de Bloqueio de Sites de Apostas (VPN Local)

O BetHunter é uma ferramenta de **autoexclusão**: o bloqueio é opcional, ativado por você, para o seu próprio dispositivo, e pode ser desativado por você a qualquer momento. A funcionalidade está disponível **no Android e no iOS**.

Em ambas as plataformas, a VPN é **inteiramente local**: ela existe apenas como o mecanismo que o sistema operacional oferece para que o Aplicativo receba as consultas DNS do próprio aparelho. **Nenhum tráfego de internet é roteado por servidores da BetHunter.** Não operamos servidores de VPN, não intermediamos sua navegação e não temos como observá-la.

### 3.1. Como funciona (Android)

Ao ativar o bloqueio, o Aplicativo cria um **serviço de VPN local** (`VpnService`) que:

1. Intercepta **exclusivamente consultas DNS** (protocolo UDP, porta 53).
2. Verifica se o domínio solicitado está na lista de sites bloqueados.
3. Bloqueia o acesso a domínios identificados como plataformas de apostas (ex.: bet365.com, betfair.com, blaze.com, pokerstars.com, 1xbet.com, entre outros).
4. Encaminha as demais consultas DNS, sem modificação, para resolvedores públicos (Cloudflare 1.1.1.1 e Google 8.8.8.8).

O próprio Aplicativo é excluído do túnel (`addDisallowedApplication`), para que a comunicação com nossa API não dependa do filtro.

### 3.2. Como funciona (iOS)

Ao ativar o bloqueio, o Aplicativo configura uma extensão de rede do sistema (`NEPacketTunnelProvider`, exibida em Ajustes › VPN). O iOS apresenta o alerta padrão de configuração de VPN e a ativação só ocorre com a sua autorização explícita. A extensão:

1. Recebe **apenas consultas DNS**. As rotas incluídas no túnel (`includedRoutes`) contêm somente os endereços do resolvedor interno do próprio aparelho (`198.18.0.2/32` e `fd6e:a81b:704f:1211::2/128`) e um conjunto de rotas de host descrito no item 3.4. As rotas padrão (`0.0.0.0/0` e `::/0`) estão explicitamente em `excludedRoutes` — **seu tráfego HTTP/HTTPS nunca entra no túnel.**
2. Compara cada domínio consultado, em memória, com a lista local de sites bloqueados.
3. Responde com um NXDOMAIN sintético aos domínios bloqueados.
4. Encaminha as demais consultas, sem modificação, ao resolvedor público **Quad9** (9.9.9.9 / 149.112.112.112 / 2620:fe::fe).

### 3.3. Bloqueio de aplicativos de aposta (apenas iOS)

No iOS, o Aplicativo também usa o **Tempo de Uso** (frameworks Family Controls / ManagedSettings) com autorização individual, para que você bloqueie os *seus próprios* aplicativos de aposta no *seu próprio* aparelho. A seleção é feita pelo seletor do próprio sistema operacional da Apple, e o BetHunter **não tem acesso à identidade dos aplicativos escolhidos**: recebemos apenas tokens opacos gerados pelo sistema, guardados localmente no contêiner do Aplicativo. Esses tokens nunca são transmitidos.

### 3.4. Medidas contra contorno do bloqueio

Como a finalidade da ferramenta é sustentar uma decisão de autoexclusão que você mesmo tomou, o Aplicativo também impede as formas mais comuns de burlar o próprio bloqueio enquanto ele está ativo:

- **Resolvedores de DNS criptografado de terceiros:** os nomes de serviços públicos de DoH/DoT (Cloudflare, Google, AdGuard, NextDNS, OpenDNS, ControlD, Mullvad, CleanBrowsing, entre outros) recebem NXDOMAIN, e os IPs conhecidos desses serviços são roteados para dentro do túnel e **descartados** (sem inspeção, sem registro e sem encaminhamento). O mesmo é feito, no Android, com os IPs associados a plataformas de aposta.
- **Canário do Firefox:** o domínio `use-application-dns.net` recebe NXDOMAIN, o que desativa o resolvedor criptografado próprio do navegador.
- **iCloud Private Relay (iOS):** os domínios `mask.icloud.com`, `mask-h2.icloud.com` e `mask-api.icloud.com` recebem NXDOMAIN. Isso pode **degradar o funcionamento do iCloud Private Relay** enquanto a proteção estiver ativa. Se você usa o Private Relay e não deseja essa interferência, desative a proteção do BetHunter.

Nenhuma dessas medidas envolve coleta de dados: são decisões tomadas localmente, no aparelho, no momento da consulta.

### 3.5. Dados processados

- As consultas DNS são processadas **inteiramente no dispositivo**, em memória, e descartadas imediatamente após serem respondidas.
- **Nenhum dado de navegação, consulta DNS ou tráfego de rede é enviado para os servidores da BetHunter**, nem para qualquer ferramenta de analytics ou publicidade.
- Os aplicativos de distribuição (builds de produção) **não registram** os domínios consultados. Não existe histórico de navegação a ser guardado, consultado, vendido ou compartilhado — porque ele não é criado.
- O serviço **não** inspeciona, registra ou redireciona o conteúdo do tráfego de internet (HTTP/HTTPS). Apenas pacotes DNS são analisados.
- A lista de domínios bloqueados é pública (Seção 5.5) e fica armazenada apenas localmente: `SharedPreferences` no Android; contêiner de App Group do próprio Aplicativo no iOS.

### 3.6. Permissão necessária e como desativar

A ativação exige sua autorização explícita: a permissão de VPN do sistema no Android, e o alerta de configuração de VPN (mais o acesso ao Tempo de Uso, para o bloqueio de aplicativos) no iOS.

Você pode desativar o bloqueio a qualquer momento, pelo próprio Aplicativo, ou removendo a configuração de VPN em Ajustes › VPN (iOS) / Configurações › Rede (Android).

---

## 4. Permissões do Dispositivo

O Aplicativo pode solicitar as seguintes permissões:

### Android

| Permissão | Finalidade |
|---|---|
| `INTERNET` | Comunicação com nossos servidores (API) |
| `BIND_VPN_SERVICE` | Funcionalidade de bloqueio de sites de apostas |
| `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_SPECIAL_USE` | Manter o serviço de bloqueio ativo em segundo plano |
| `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` | Seleção de foto de perfil (galeria) |
| `MODIFY_AUDIO_SETTINGS` | Reprodução de áudio na funcionalidade de meditação |
| `VIBRATE` | Feedback tátil em interações do Aplicativo |
| `RECORD_AUDIO` | Permissão requerida por dependências do framework; o Aplicativo **não** grava áudio do usuário |
| `SYSTEM_ALERT_WINDOW` | Utilizada pelo ambiente de desenvolvimento (não aplicável em produção) |

### iOS

| Permissão | Finalidade |
|---|---|
| Câmera (`NSCameraUsageDescription`) | Captura de foto de perfil |
| Microfone (`NSMicrophoneUsageDescription`) | Permissão requerida por dependências do framework; o Aplicativo **não** grava áudio do usuário |
| Biblioteca de Fotos (`NSPhotoLibraryUsageDescription`) | Seleção de foto de perfil |
| Configuração de VPN (Network Extension, `packet-tunnel-provider`) | Filtro de DNS local para bloqueio de sites de apostas (Seção 3.2) |
| Tempo de Uso (`NSFamilyControlsUsageDescription`) | Bloqueio dos seus próprios aplicativos de aposta (Seção 3.3) |
| Notificações (`aps-environment`) | Envio de notificações relevantes, quando autorizado |
| Execução em segundo plano (`fetch` / `processing`) | Atualização diária da lista de sites bloqueados e verificação de status da assinatura |

---

## 5. Serviços de Terceiros

O Aplicativo utiliza os seguintes serviços de terceiros:

### 5.1. RevenueCat

Utilizamos o RevenueCat para gerenciar assinaturas e compras dentro do aplicativo (in-app purchases).

- **Dados compartilhados:** identificador do usuário (ID interno) e status de assinatura.
- **Finalidade:** verificar e gerenciar entitlements de assinatura.
- **Política de privacidade do RevenueCat:** [https://www.revenuecat.com/privacy](https://www.revenuecat.com/privacy)

### 5.2. Apple App Store e Google Play Store

Compras e assinaturas são processadas pelas respectivas lojas de aplicativos. A BetHunter não tem acesso a dados de pagamento (cartão de crédito, dados bancários, etc.). Consulte as políticas de privacidade da [Apple](https://www.apple.com/legal/privacy/) e do [Google](https://policies.google.com/privacy).

### 5.3. Resolvedores DNS públicos (funcionalidade de bloqueio)

Quando o bloqueio está ativo, as consultas DNS que **não** são bloqueadas são encaminhadas, sem modificação e sem qualquer identificador seu, para resolvedores públicos — exatamente como qualquer resolvedor DNS configurado no aparelho faria:

- **Android** — **Cloudflare** (1.1.1.1) — [Política de privacidade](https://www.cloudflare.com/privacypolicy/) e **Google Public DNS** (8.8.8.8) — [Política de privacidade](https://developers.google.com/speed/public-dns/privacy)
- **iOS** — **Quad9** (9.9.9.9 / 149.112.112.112 / 2620:fe::fe) — [Política de privacidade](https://quad9.net/privacy/)

Não temos acordo de compartilhamento de dados com esses provedores, não enviamos nenhum dado seu junto às consultas e não recebemos deles nenhuma informação sobre você. Eles atuam apenas como resolvedores recursivos públicos.

### 5.4. Expo (Notifications)

O Aplicativo pode solicitar permissão para enviar notificações push por meio do serviço Expo Notifications.

- **Dados compartilhados:** token de push do dispositivo.
- **Finalidade:** envio de notificações relevantes ao usuário.
- **Política de privacidade da Expo:** [https://expo.dev/privacy](https://expo.dev/privacy)

### 5.5. GitHub (download da lista de sites bloqueados)

A lista de domínios de apostas usada pelo bloqueio é **pública** e é baixada, via HTTPS, de um repositório hospedado no GitHub (`raw.githubusercontent.com`).

- **Dados compartilhados:** nenhum. Trata-se de um download somente-leitura; a requisição não carrega dados seus além de um cabeçalho técnico de cache (`If-None-Match`). Como em qualquer download HTTPS, o GitHub observa o endereço IP do dispositivo.
- **Finalidade:** manter a lista de bloqueio atualizada (verificação diária).
- **Política de privacidade do GitHub:** [https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement)

---

## 6. Armazenamento e Segurança dos Dados

### 6.1. Armazenamento local (no dispositivo)

Os seguintes dados são armazenados localmente no seu dispositivo via AsyncStorage:

- Token de autenticação
- Dados básicos do perfil (nome, e-mail)
- Foto de perfil (URI local)
- Transações financeiras locais
- Estado do onboarding
- Progresso em cursos
- Lista de domínios bloqueados (`SharedPreferences` no Android; índice em arquivo no contêiner de App Group do Aplicativo no iOS)
- Estado da proteção (ligada/desligada) e metadados técnicos da lista (data da última atualização, contagem de domínios)
- Tokens opacos dos aplicativos que você escolheu bloquear (apenas iOS, Tempo de Uso)

### 6.2. Armazenamento em servidor

Dados de conta, check-in, streak, registros financeiros e dados de perfil são armazenados em nossos servidores protegidos.

### 6.3. Medidas de segurança

- Todas as comunicações entre o Aplicativo e nossos servidores são realizadas via **HTTPS** (protocolo criptografado).
- Senhas são armazenadas de forma criptografada nos servidores.
- O acesso autenticado utiliza tokens **JWT (JSON Web Token)** com tempo de expiração.
- Sessões expiradas são automaticamente encerradas, exigindo nova autenticação.
- O Aplicativo não permite tráfego de rede arbitrário em iOS (`NSAllowsArbitraryLoads` está desabilitado).

---

## 7. Compartilhamento de Dados

**Não vendemos, alugamos ou comercializamos seus dados pessoais.**

**Quanto à funcionalidade de bloqueio (VPN local):** nenhum dado obtido por meio dela é vendido, alugado, compartilhado, cedido ou divulgado a terceiros — nem para publicidade, nem para analytics, nem para qualquer outra finalidade. Não há o que compartilhar: as consultas DNS são processadas em memória no seu aparelho e descartadas, sem registro e sem transmissão para nossos servidores. O único fluxo de rede envolvido é o encaminhamento das consultas não bloqueadas aos resolvedores públicos descritos na Seção 5.3, inerente ao funcionamento do DNS.

Seus dados podem ser compartilhados apenas nas seguintes circunstâncias:

- **Provedores de serviço:** RevenueCat (gestão de assinaturas), Expo (notificações push), conforme descrito na Seção 5.
- **Obrigação legal:** quando exigido por lei, regulamento, processo judicial ou solicitação governamental aplicável.
- **Proteção de direitos:** para proteger os direitos, propriedade ou segurança da BetHunter, de nossos usuários ou do público.

---

## 8. Retenção de Dados

- **Dados de conta:** mantidos enquanto sua conta estiver ativa. Ao solicitar exclusão da conta, seus dados pessoais serão removidos em até 30 (trinta) dias.
- **Dados locais:** permanecem no dispositivo até você desinstalar o Aplicativo ou limpar os dados do app.
- **Dados de assinatura:** gerenciados pelo RevenueCat e pelas lojas de aplicativos conforme suas respectivas políticas de retenção.

---

## 9. Seus Direitos

Em conformidade com a **Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)** e regulamentações equivalentes, você tem direito a:

- **Acesso:** solicitar quais dados pessoais possuímos sobre você.
- **Correção:** solicitar a correção de dados incompletos, inexatos ou desatualizados.
- **Exclusão:** solicitar a eliminação de seus dados pessoais.
- **Portabilidade:** solicitar a transferência de seus dados a outro fornecedor de serviço.
- **Revogação de consentimento:** retirar consentimentos previamente concedidos.
- **Informação sobre compartilhamento:** saber com quais entidades públicas e privadas seus dados foram compartilhados.
- **Oposição:** opor-se ao tratamento de dados realizado sem seu consentimento.

Para exercer qualquer desses direitos, entre em contato conosco pelos canais indicados na Seção 12.

Para usuários na **União Europeia (GDPR)** e na **Califórnia (CCPA)**, direitos equivalentes se aplicam conforme a legislação local.

---

## 10. Privacidade de Crianças

O BetHunter **não** é destinado a menores de 18 (dezoito) anos. Não coletamos intencionalmente informações pessoais de crianças ou adolescentes. Se tomarmos conhecimento de que dados de um menor foram coletados inadvertidamente, tomaremos medidas para excluí-los prontamente.

---

## 11. Alterações nesta Política

Podemos atualizar esta Política de Privacidade periodicamente. Quando fizermos alterações significativas:

- A data de "Última atualização" no topo desta página será modificada.
- Notificaremos você por meio do Aplicativo ou por e-mail, conforme a relevância da alteração.
- O uso continuado do Aplicativo após a publicação de alterações constitui sua aceitação da política atualizada.

---

## 12. Contato

Se você tiver dúvidas, solicitações ou reclamações relacionadas a esta Política de Privacidade ou ao tratamento de seus dados pessoais, entre em contato conosco:

- **E-mail:** [contato@bethunter.com.br]
- **Aplicativo:** através da seção "Minha Conta"

---

## 13. Consentimento

Ao utilizar o BetHunter, você declara ter lido, compreendido e concordado com esta Política de Privacidade.

---

*BetHunter — Tecnologia para uma vida livre de apostas.*
