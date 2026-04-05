# Política de Privacidade — BetHunter

**Última atualização:** 2 de abril de 2026

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
- **Consultas DNS (apenas Android):** quando a funcionalidade de bloqueio de sites de apostas está ativada, o Aplicativo intercepta consultas DNS no dispositivo exclusivamente para verificar se o domínio solicitado consta na lista de sites bloqueados. Nenhuma consulta DNS é enviada aos servidores da BetHunter (detalhes na Seção 3).

### 1.3. Informações que NÃO coletamos

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
| Bloqueio de sites de apostas (VPN local) | Consultas DNS locais (apenas Android) |
| Gerenciar assinaturas e compras | ID do usuário, status de entitlements |
| Recuperação de senha | E-mail, código de verificação |
| Enviar notificações (quando autorizado) | Token de push notification |
| Melhorar o Aplicativo | Dados de uso agregados e anônimos |

---

## 3. Funcionalidade de Bloqueio de Sites de Apostas (VPN Local)

### 3.1. Como funciona

No Android, o BetHunter oferece uma funcionalidade opcional de bloqueio de sites de apostas. Ao ativá-la, o Aplicativo cria um **serviço de VPN local** no dispositivo que:

1. Intercepta **exclusivamente consultas DNS** (protocolo UDP, porta 53).
2. Verifica se o domínio solicitado está na lista de sites bloqueados.
3. Bloqueia o acesso a domínios identificados como plataformas de apostas (ex.: bet365.com, betfair.com, blaze.com, pokerstars.com, 1xbet.com, entre outros).
4. Encaminha as demais consultas DNS para resolvedores públicos (Cloudflare 1.1.1.1 e Google 8.8.8.8).

### 3.2. Dados processados

- As consultas DNS são processadas **inteiramente no dispositivo local**.
- **Nenhum dado de navegação, consulta DNS ou tráfego de rede é enviado para os servidores da BetHunter.**
- A lista de domínios bloqueados é armazenada localmente via SharedPreferences do Android.
- O serviço de VPN **não** inspeciona, registra ou redireciona o conteúdo do tráfego de internet (HTTP/HTTPS). Apenas pacotes DNS são analisados.

### 3.3. Permissão necessária

A ativação desta funcionalidade requer sua autorização explícita por meio da permissão de VPN do sistema operacional Android. Você pode desativar o bloqueio a qualquer momento.

### 3.4. Disponibilidade

Esta funcionalidade está disponível **apenas no Android**. No iOS, o recurso de bloqueio via VPN não é oferecido.

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

### 5.3. Resolvedores DNS públicos (apenas Android, funcionalidade de bloqueio)

Quando o bloqueio está ativo, consultas DNS não bloqueadas são encaminhadas para:
- **Cloudflare** (1.1.1.1) — [Política de privacidade](https://www.cloudflare.com/privacypolicy/)
- **Google Public DNS** (8.8.8.8) — [Política de privacidade](https://developers.google.com/speed/public-dns/privacy)

### 5.4. Expo (Notifications)

O Aplicativo pode solicitar permissão para enviar notificações push por meio do serviço Expo Notifications.

- **Dados compartilhados:** token de push do dispositivo.
- **Finalidade:** envio de notificações relevantes ao usuário.
- **Política de privacidade da Expo:** [https://expo.dev/privacy](https://expo.dev/privacy)

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
- Lista de domínios bloqueados (Android, SharedPreferences)

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
