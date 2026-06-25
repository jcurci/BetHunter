# Publicacao iOS na App Store - Passo a passo

Este guia resume o que ja foi feito e o que ainda falta fazer para publicar o BetHunter no iOS, considerando o bloqueador de casas de apostas com FamilyControls e DNS Proxy.

## 1. Identifiers oficiais

Use somente estes valores para iOS:

```text
App iOS principal: com.bethunter.app.rick
Extensao DNS Proxy: com.bethunter.app.rick.DNSProxy
App Group: group.com.bethunter.app.rick
```

O Android/Play Store deve continuar assim:

```text
Android package: com.bethunter.app
```

Nao altere o package Android. Isso poderia quebrar futuras atualizacoes na Play Store.

## 2. O que ja foi feito no codigo

O projeto foi padronizado para usar o bundle iOS `.rick`.

Arquivos principais alterados:

- `app.config.ts`
- `app.json`
- `ios/BetHunter.xcodeproj/project.pbxproj`
- `ios/BetHunter/BetHunter.entitlements`
- `ios/DNSProxy/DNSProxy.entitlements`
- `ios/BetHunter/Blocking/AppGroupHelper.swift`
- `ios/DNSProxy/DNSProxyProvider.swift`
- `ios/BetHunter/Blocking/BlockingManager.swift`

Tambem existe uma documentacao tecnica em:

```text
BetHunter/docs/bundle-ios.md
```

## 3. O que ja foi feito na Apple

Pelo que foi configurado durante o processo:

- O App ID `com.bethunter.app.rick` existe.
- O App ID `com.bethunter.app.rick.DNSProxy` existe.
- O App Group `group.com.bethunter.app.rick` foi criado.
- O App Group deve ficar associado aos dois App IDs.
- Family Controls apareceu para o app principal e deve ficar marcado em Development e Distribution.

## 4. O que conferir nos App IDs

No Apple Developer, va em:

```text
Certificates, Identifiers & Profiles > Identifiers
```

### 4.1 App principal

Abra:

```text
com.bethunter.app.rick
```

Deixe marcado:

- `App Groups`
- `Network Extensions`
- `Push Notifications`
- `Family Controls (Development)`
- `Family Controls (Distribution)`

Em `App Groups`, selecione somente:

```text
group.com.bethunter.app.rick
```

Nao selecione App Groups antigos.

### 4.2 Extensao DNS Proxy

Abra:

```text
com.bethunter.app.rick.DNSProxy
```

Deixe marcado:

- `App Groups`
- `Network Extensions`

Em `App Groups`, selecione somente:

```text
group.com.bethunter.app.rick
```

Nao marque `Push Notifications` nem `Family Controls` na extensao DNS.

## 5. Certificado Apple Distribution

Para gerar profiles App Store Connect, voce precisa de um certificado de distribuicao.

### 5.1 Criar CSR correto no Mac

Abra:

```text
Acesso as Chaves / Keychain Access
```

Menu:

```text
Acesso as Chaves > Assistente de Certificado > Solicitar um Certificado de uma Autoridade Certificadora
```

Preencha:

```text
Email: email da conta Apple Developer
Nome comum: BetHunter Distribution
Email da CA: vazio
```

Marque:

```text
Salvo no disco
```

Se aparecer, marque:

```text
Permitir especificar informacoes do par de chaves
```

Use:

```text
Key Size: 2048 bits
Algorithm: RSA
```

Salve como:

```text
BetHunterDistribution.certSigningRequest
```

Importante: nao envie `.cer`, `.p12`, `.mobileprovision`, zip ou arquivo renomeado. A Apple precisa receber exatamente o arquivo `.certSigningRequest`.

### 5.2 Criar certificado na Apple

No Apple Developer:

```text
Certificates > + > Apple Distribution
```

Envie:

```text
BetHunterDistribution.certSigningRequest
```

Depois:

1. Gere o certificado.
2. Baixe o arquivo `.cer`.
3. De dois cliques no `.cer` para instalar no Keychain.

## 6. Provisioning profiles

Depois que o certificado Apple Distribution existir, va em:

```text
Profiles > +
```

Selecione:

```text
App Store Connect
```

### 6.1 Profile do app principal

Selecione o App ID:

```text
com.bethunter.app.rick
```

Selecione o certificado Apple Distribution.

Nome sugerido:

```text
BetHunter iOS App Store
```

Gere e baixe o profile.

### 6.2 Profile da extensao DNS

Repita o processo com o App ID:

```text
com.bethunter.app.rick.DNSProxy
```

Nome sugerido:

```text
BetHunter DNSProxy App Store
```

Gere e baixe o profile.

Voce precisa dos dois profiles. Um profile so para o app principal nao assina a extensao DNS.

## 7. EAS credentials

O arquivo `eas.json` usa:

```json
"credentialsSource": "local"
```

Entao o EAS vai depender dos certificados/profiles locais corretos.

Antes do build de producao, tenha em maos:

- certificado Apple Distribution instalado no Keychain;
- profile App Store do app principal;
- profile App Store da extensao DNS;
- chave privada correspondente ao certificado no Keychain.

Se o EAS pedir credenciais, informe o certificado/profile do app e da extensao.

## 8. Google Sign-In

No Google Cloud/Firebase, confira se existe OAuth Client iOS para:

```text
com.bethunter.app.rick
```

O `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` usado em `eas.json` precisa ser desse client iOS.

Se ele ainda estiver associado a outro bundle, o login com Google pode quebrar no iOS.

Android continua separado:

```text
com.bethunter.app
```

## 9. RevenueCat

No RevenueCat, configure o app iOS com:

```text
com.bethunter.app.rick
```

Tambem revise as chaves no `eas.json`.

Atencao: hoje o profile production ainda mostra chave iOS com prefixo:

```text
test_
```

Antes de publicar, troque para a chave iOS correta de producao, se aplicavel.

## 10. Politica de privacidade e review da Apple

Antes de enviar para review, atualize a politica de privacidade para mencionar:

- uso de FamilyControls / Screen Time;
- uso de DNS Proxy no iOS;
- uso de lista de dominios bloqueados;
- que DNS/listas nao sao vendidos nem usados para publicidade;
- que o app nao oferece apostas, odds, deposito, saque ou afiliacao.

Nas notas para App Review, explique:

```text
BetHunter is a responsible gambling prevention and financial wellness app. It helps users voluntarily block access to gambling-related domains and apps on their own device. The app does not offer gambling, betting, odds, deposits, withdrawals, affiliate links, or redirection to gambling operators.
```

## 11. App Store Connect

No App Store Connect, crie ou configure o app usando:

```text
Bundle ID: com.bethunter.app.rick
```

Preencha:

- nome do app;
- categoria;
- classificacao etaria;
- politica de privacidade;
- screenshots;
- descricao;
- informacoes de contato;
- App Privacy;
- Review Notes.

Nao selecione bundles antigos como `com.ricardo.bethunter`, `com.bethunterapp.ios` ou `com.bethunter.app`.

## 12. Validacao antes do build

Dentro da pasta mobile:

```bash
cd BetHunter
npx tsc --noEmit
```

Busque identifiers antigos:

```bash
rg "com\\.ricardo\\.bethunter|group\\.com\\.ricardo\\.bethunter|com\\.bethunter\\.app\\.DNSProxy" .
```

Confirme que Android continua:

```bash
rg "com\\.bethunter\\.app" app.config.ts app.json
```

## 13. Build e envio

Quando certificados, profiles e integrações externas estiverem prontos:

```bash
cd BetHunter
eas build --platform ios --profile production
```

Depois que o build passar:

```bash
eas submit --platform ios --profile production
```

Se o submit nao estiver configurado para iOS, envie o build pelo App Store Connect ou configure o submit depois.

## 14. Ordem recomendada a partir de agora

1. Corrigir o CSR e criar o certificado `Apple Distribution`.
2. Criar profile App Store Connect para `com.bethunter.app.rick`.
3. Criar profile App Store Connect para `com.bethunter.app.rick.DNSProxy`.
4. Instalar/guardar certificado e profiles.
5. Conferir Google OAuth iOS para `com.bethunter.app.rick`.
6. Conferir RevenueCat iOS para `com.bethunter.app.rick`.
7. Atualizar politica de privacidade e App Review Notes.
8. Criar app no App Store Connect com `com.bethunter.app.rick`.
9. Rodar `npx tsc --noEmit`.
10. Rodar build iOS de producao.
11. Enviar para TestFlight/App Store.

## 15. Regra simples

Para nao se perder:

- `.rick` = iOS atual.
- `.DNSProxy` = extensao DNS.
- `group.com.bethunter.app.rick` = unico App Group valido.
- `com.bethunter.app` = somente Android/Play Store.
- `com.ricardo...` e `bethunterapp.ios` = ignorar por enquanto.
