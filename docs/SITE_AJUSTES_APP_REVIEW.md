# Ajustes no site bethunter.com.br — exigidos pela App Review (iOS)

**Contexto para quem for executar:** a submissão do app iOS está travada. A Apple
detectou automaticamente funcionalidade de VPN no binário (o bloqueador de
apostas no iOS usa uma extensão `NEPacketTunnelProvider`) e exige divulgação
formal de quais dados a VPN processa. Isso coloca o app sob a diretriz **5.4**,
que obriga a política de privacidade a descrever esse tratamento.

Hoje o site trabalha contra a submissão em dois pontos: a home afirma
literalmente que não há VPN, e a política publicada não menciona VPN, DNS ou
rede em nenhum lugar. **A review não destrava enquanto isso não for corrigido.**

Tudo abaixo é conteúdo/copy. Não há mudança de arquitetura, build do app ou
backend. Ordem de prioridade: 1 e 2 são bloqueantes; 3 a 5 evitam a próxima
rejeição.

Referência técnica completa, se precisar: `PRIVACY_POLICY.md` (seção 3) do
repositório do **app** (`jcurci/BetHunter`), já corrigido.

---

## Regras de execução (vale para pessoa ou agente de IA)

1. **Faça só as 5 mudanças abaixo.** Nada de refatorar, reformatar, renomear,
   atualizar dependência, mexer em outra página ou "melhorar" o que está perto.
   Este site está no caminho crítico de uma submissão travada na Apple: qualquer
   mudança extra vira risco sem upside.
2. **As strings de busca foram extraídas do bundle de produção.** No código-fonte
   o texto pode estar quebrado em pedaços ou dentro de um array/objeto de
   conteúdo. Se a busca exata falhar, busque um trecho menor (`Sem VPN`,
   `Supabase`, `Dados de Dispositivo`, `terceiAros`).
3. **A página `/privacidade` é renderizada por JavaScript** (SPA em Vite/React,
   componente carregado sob demanda, provavelmente via um shell de página legal).
   O conteúdo novo tem de entrar na estrutura de dados/JSX que a página já usa —
   mantenha o padrão de títulos e parágrafos existente, não invente componente
   novo.
4. **Editar o fonte não muda nada sozinho: é preciso buildar e publicar.** Os
   assets são versionados com hash (`index-<hash>.js`), então enquanto o deploy
   não sair, a URL continua servindo o conteúdo antigo. A verificação do final
   deste documento é feita **na URL pública**, não em localhost.
5. **Preserve a acentuação.** Os textos abaixo têm acentos e o caractere `·`;
   confira que o arquivo continua em UTF-8 e que nada virou `Ã§`.
6. **Em caso de dúvida, não adivinhe:** mande o diff de volta antes de publicar.

---

## 1. Home — remover o badge "Sem VPN" (BLOQUEANTE)

**Onde:** hero da home. Procure a string exata `Bloqueio local · Sem VPN`.

**Trocar por:** `Bloqueio local · Sem servidor remoto`

**Por quê:** o app iOS usa, sim, uma VPN — local, no próprio aparelho. Afirmar
"Sem VPN" numa página que o revisor da Apple abre, no mesmo momento em que a
Apple acabou de detectar VPN no binário, lê como contradição direta e derruba a
credibilidade de toda a resposta. A versão nova preserva a mensagem real (o
tráfego não passa por servidor nosso) sem afirmar algo falso.

## 2. Política de privacidade — inserir a seção sobre o bloqueio (BLOQUEANTE)

**Onde:** página `/privacidade`. Inserir como **nova seção 3**, logo após
"2. Como Usamos Suas Informações", e renumerar as seguintes (a atual 3 vira 4,
e assim até a 9 virar 10). Se renumerar der trabalho no componente, inserir como
seção 10, imediatamente antes de "Contato e Encarregado de Dados" — o
importante é o conteúdo existir na página.

**Texto para colar** (mesmo tom das outras seções; os subtítulos em negrito
seguem o padrão já usado):

> ### 3. Funcionalidade de Bloqueio de Sites de Apostas (VPN local)
>
> O bloqueio é opcional, ativado por você, para o seu próprio aparelho, e pode
> ser desativado por você a qualquer momento. Está disponível no Android e no
> iOS.
>
> Em ambas as plataformas a VPN é **inteiramente local**: ela existe apenas como
> o mecanismo que o sistema operacional oferece para que o aplicativo receba as
> consultas DNS do próprio aparelho. **Nenhum tráfego de internet é roteado por
> servidores do Bethunter.** Não operamos servidores de VPN e não temos como
> observar sua navegação.
>
> **O que é processado.** Quando o bloqueio está ativo, o aplicativo recebe as
> consultas DNS do aparelho e compara cada domínio, em memória, com uma lista
> pública de sites de apostas. Os domínios da lista recebem uma resposta de
> "domínio inexistente"; todos os demais são encaminhados sem modificação. As
> consultas são descartadas imediatamente após serem respondidas.
>
> **O que não é feito.** Nenhuma consulta DNS, dado de navegação ou tráfego de
> rede é registrado, armazenado ou enviado para os servidores do Bethunter, nem
> para ferramentas de publicidade ou análise. Não existe histórico de navegação
> a ser guardado, vendido ou compartilhado, porque ele não é criado. O
> aplicativo não inspeciona nem redireciona o conteúdo do seu tráfego
> (HTTP/HTTPS): apenas pacotes DNS são analisados.
>
> **Apenas no iOS.** Além do filtro de DNS, o aplicativo usa o Tempo de Uso
> (Family Controls) para que você bloqueie os seus próprios aplicativos de
> aposta. A seleção é feita pelo seletor do próprio sistema da Apple e o
> Bethunter não tem acesso à identidade dos aplicativos escolhidos: recebemos
> apenas identificadores opacos gerados pelo sistema, guardados localmente no
> aparelho e nunca transmitidos.
>
> **Terceiros envolvidos.** As consultas que não são bloqueadas são encaminhadas,
> sem qualquer identificador seu, a resolvedores DNS públicos — Cloudflare
> (1.1.1.1) e Google (8.8.8.8) no Android, Quad9 (9.9.9.9) no iOS — exatamente
> como qualquer resolvedor DNS configurado no aparelho faria. A lista de
> domínios bloqueados é pública e baixada por HTTPS de um repositório no GitHub;
> é um download somente leitura, que não carrega dados seus. Não há acordo de
> compartilhamento de dados com nenhum desses provedores.
>
> **Medidas contra contorno.** Como a ferramenta existe para sustentar uma
> decisão de autoexclusão que você mesmo tomou, enquanto o bloqueio está ativo o
> aplicativo também impede as formas mais comuns de burlá-lo: serviços públicos
> de DNS criptografado (DoH/DoT) ficam inacessíveis e o resolvedor próprio do
> Firefox é desativado. No iOS, isso inclui os domínios do iCloud Private Relay,
> o que **pode degradar o funcionamento do Private Relay** enquanto a proteção
> estiver ligada. Desativar a proteção restaura tudo.
>
> **Como desativar.** Pelo próprio aplicativo, ou removendo a configuração de
> VPN em Ajustes › VPN (iOS) / Configurações › Rede (Android).

**Por quê:** é literalmente o que a Apple está pedindo. As três perguntas que
temos de responder ("que dados a VPN coleta / para quê / compartilha com
terceiros") precisam ter resposta correspondente na política pública.

## 3. Política — corrigir a seção 1.1 (autenticação)

**Onde:** seção "1.1 Informações de Cadastro". Texto atual:
`Nome completo e e-mail coletados via autenticação de terceiros (Google, Apple ou Supabase) para criação e segurança da sua conta.`

**Trocar por:** `Nome completo, e-mail e telefone, informados por você no cadastro ou obtidos com sua autorização ao entrar com o Google. A senha, quando você cria uma, é armazenada de forma criptografada.`

**Por quê:** o app tem cadastro próprio por e-mail e senha na nossa API, mais
login com Google. Não há Supabase no produto, e não há "Entrar com a Apple"
implementado. Citar provedores que não existem é declaração falsa numa política
que a Apple lê linha por linha.

## 4. Política — corrigir a seção 1.4 (dados de dispositivo)

**Onde:** seção "1.4 Dados de Dispositivo". Texto atual:
`Modelo do aparelho, sistema operacional e identificadores técnicos para garantir a estabilidade das ferramentas de bloqueio (Blindagem).`

**Ação:** **remover a seção 1.4 inteira** (e renumerar, se necessário).

**Por quê:** o aplicativo não envia modelo do aparelho, sistema operacional nem
identificadores técnicos para os nossos servidores — verificado no código do app
e da API. Enquanto isso, os manifestos de privacidade do app declaram à Apple
que nenhum dado é coletado. A Apple cruza a política com esse questionário; uma
política que declara coleta a mais que o app faz é inconsistência que gera
rejeição. Se algum dia passarmos a coletar telemetria de verdade, a seção volta
— junto com a atualização do questionário no App Store Connect.

## 5. Política — corrigir a seção 3 (onde os dados ficam armazenados)

**Onde:** seção "3. Compartilhamento de Informações". Texto atual:
`Provedores de Infraestrutura: Ferramentas essenciais para o funcionamento do app (como Supabase para banco de dados ou processadores de pagamento das lojas oficiais).`

**Trocar por:** `Provedores de Infraestrutura: hospedagem da nossa API e banco de dados PostgreSQL (Railway), gestão de assinaturas (RevenueCat, que recebe apenas o identificador interno do usuário e o status da assinatura), envio de notificações (Expo) e processamento de pagamentos pelas lojas oficiais (Apple e Google).`

**Por quê:** não usamos Supabase. E esta seção tem peso extra agora: a terceira
pergunta da Apple é literalmente *"onde essas informações serão armazenadas?"*.
Responder a ela com a política pública apontando um provedor que não existe é
inconsistência direta com o que vamos declarar. RevenueCat e Expo são terceiros
reais que recebem dados e hoje não estão citados.

## 6. Política — remover a alegação de criptografia de ponta a ponta

**Onde:** seção "4. Armazenamento, Segurança e Criptografia". Texto atual:
`Criptografia: Seus dados financeiros e de comportamento são protegidos por protocolos de segurança de ponta a ponta.`

**Trocar por:** `Criptografia: todo o tráfego entre o aplicativo e nossos servidores é protegido por HTTPS/TLS, e as senhas são armazenadas de forma criptografada.`

**Por quê:** "ponta a ponta" significa que nem nós conseguimos ler os dados — e
não é o caso: os registros financeiros são armazenados no nosso banco e são
legíveis pela aplicação, que os usa para gerar os gráficos. É uma afirmação falsa
sobre segurança, o tipo de coisa que cria problema com a LGPD e com o Procon
independentemente da Apple. O texto novo descreve a proteção real, que é boa.

## 7. Política — alinhar a seção 7 (menores de idade)

**Onde:** seção "7. Menores de Idade". Texto atual:
`Usuários menores de 18 anos devem utilizar o aplicativo sob supervisão de seus pais ou responsáveis.`

**Trocar por:** `O Bethunter não é destinado a menores de 18 anos e não coletamos intencionalmente dados de crianças e adolescentes. Caso identifiquemos que dados de um menor foram coletados, tomaremos medidas para excluí-los prontamente.`

**Por quê:** é um app sobre vício em apostas, com classificação etária alta na
loja. A redação atual admite uso por menores, o que conflita com a classificação
declarada na App Store e com o próprio posicionamento do produto.

## 8. Correções menores

- **Typo na seção 3 atual** ("Compartilhamento de Informações"): `terceiAros` → `terceiros`.
- **Home:** `Disponível na Google Play para Android · iOS em breve` — precisa ser
  atualizado no dia da aprovação na App Store. Se o lançamento iOS for iminente,
  já vale trocar por algo neutro como `Disponível para Android · iOS em breve`,
  para não reforçar ao revisor a impressão de que o iOS não é suportado.
- **Canonical:** a tag `<link rel="canonical" href="https://bethunter.app/">` do
  `index.html` aponta para outro domínio. Deve apontar para
  `https://www.bethunter.com.br/`, e cada página legal idealmente para a própria
  URL.

---

## Como verificar quando terminar

Tudo na **URL pública, depois do deploy** — não em localhost, e não conferindo só
o diff.

1. Abrir `https://www.bethunter.com.br/privacidade` e conferir que a seção nova
   está visível na página renderizada (não só no código).
2. Buscar "VPN" na página: tem de aparecer.
3. Buscar "Sem VPN" na home: **não** pode aparecer.
4. Buscar "Supabase" no site inteiro: não pode aparecer (são duas ocorrências,
   seções 1.1 e 3).
5. Buscar "ponta a ponta": não pode aparecer.
6. Confirmar que `/privacidade` responde 200 sem redirecionar para a home.

**Fora do escopo deste documento, mas relacionado:** a seção 5 da política afirma
que a exclusão de conta é feita "diretamente pela Aplicação, de forma
automatizada". Hoje o app abre um Google Forms e o botão se chama "Desativar
conta". Isso é problema no **app**, não no site — está registrado no plano
(`docs/PLANO_APP_REVIEW_IOS.md`, item 27) e não deve ser "resolvido" mudando o
texto da política.

Avisar quando estiver no ar — a resposta à Apple depende disso, e o campo
*Privacy Policy URL* no App Store Connect já aponta para essa página
(`https://www.bethunter.com.br/privacidade`), então o link não muda.
