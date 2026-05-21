# Fullscreen Audit — BetHunter Android

**Data:** 2026-05-21  
**Executado por:** Claude Code (claude-sonnet-4-6)  
**Escopo:** Sistema UI Android — Status Bar, Navigation Bar, Safe Areas, Insets  
**Versões auditadas:** RN 0.81.5 · Expo 54 · expo-status-bar 3.0.7 · expo-navigation-bar 5.0.10 · react-native-safe-area-context 5.6.0 · Target SDK 34

---

## Contexto

O app BetHunter já ocultava a Navigation Bar via `expo-navigation-bar` (correto), mas a auditoria identificou que a **Status Bar nunca foi ocultada**, que **25 telas usavam o `SafeAreaView` do package errado** e que o **Paywall — tela de compra — não tinha nenhuma proteção de safe area**.

---

## Problemas encontrados e corrigidos

### 1. Status Bar nunca ocultada (Crítico)

**Arquivo:** `App.tsx:193`

O componente `<StatusBar style="auto" />` do `expo-status-bar` apenas adapta a cor dos ícones ao tema do sistema. Não oculta a barra. Relógio, bateria e notificações ficavam visíveis em todas as telas.

**Correção aplicada:**
```tsx
// Antes
<StatusBar style="auto" />

// Depois
<StatusBar hidden={true} translucent={true} />
```

---

### 2. Status Bar visível durante a splash (Crítico)

**Arquivo:** `src/components/AppLoadingScreen.tsx`

A tela de loading inicial não controlava a Status Bar, causando um "flash" da barra no momento da abertura do app — antes do `App.tsx` montar o `<StatusBar hidden />` global.

**Correção aplicada:**
```tsx
import { StatusBar } from "expo-status-bar";

return (
  <>
    <StatusBar hidden={true} translucent={true} />
    <LinearGradient ...>
      {/* conteúdo */}
    </LinearGradient>
  </>
);
```

---

### 3. Paywall sem proteção de Safe Area (Crítico)

**Arquivo:** `src/screens/Paywall/Paywall.tsx`

A tela de paygate — a mais crítica do app — usava um `<View>` puro como container raiz. Sem `SafeAreaView`, o componente `RevenueCatUI.Paywall` e os botões de estado de erro podiam ser cortados pela zona de gesture do sistema na base do dispositivo.

**Correção aplicada:**
```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

// Antes
<View style={styles.container}>

// Depois
<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
```

---

### 4. `SafeAreaView` do package errado em 25 telas (Crítico)

**Telas afetadas (25):**

| Arquivo |
|---|
| `src/screens/Account/AccountHistory.tsx` |
| `src/screens/Account/AccountOverview.tsx` |
| `src/screens/Account/TransactionForm.tsx` |
| `src/screens/Acessor/HistoryList.tsx` |
| `src/screens/Config/Config.tsx` |
| `src/screens/Config/Notifications.tsx` |
| `src/screens/CustomerCenter/CustomerCenter.tsx` |
| `src/screens/Educacional/MaterialReader.tsx` |
| `src/screens/Educacional/Ranking.tsx` |
| `src/screens/EmConstrucao/EmConstrucao.tsx` |
| `src/screens/Login/Login.tsx` |
| `src/screens/Meditacao/Meditacao.tsx` |
| `src/screens/MinhaConta/MinhaConta.tsx` |
| `src/screens/MinhaConta/SejaParceiro.tsx` |
| `src/screens/MinhaConta/SobreNos.tsx` |
| `src/screens/PasswordReset/PasswordResetEmail.tsx` |
| `src/screens/PasswordReset/PasswordResetMethod.tsx` |
| `src/screens/PasswordReset/PasswordResetNewPassword.tsx` |
| `src/screens/PasswordReset/PasswordResetVerification.tsx` |
| `src/screens/PersonalityTest/PersonalityTestIntro.tsx` |
| `src/screens/PersonalityTest/PersonalityTestQuestion.tsx` |
| `src/screens/Profile/ChangePassword.tsx` |
| `src/screens/Profile/DetalhesPessoais.tsx` |
| `src/screens/Profile/Profile.tsx` |
| `src/screens/Quiz/QuizResult.tsx` |

O `SafeAreaView` do `react-native` core (package errado):
- Não aceita a prop `edges`
- Não integra com o `SafeAreaProvider` definido no `App.tsx`
- No Android 14+, lê os window insets diretamente do sistema, ignorando o `expo-navigation-bar` que ocultou a nav bar
- Pode adicionar `paddingBottom` residual da altura da Navigation Bar mesmo quando ela está oculta

**Correção aplicada em cada arquivo:**
```tsx
// Antes
import { SafeAreaView, View, Text, ... } from "react-native";

// Depois
import { View, Text, ... } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
```

---

### 5. `StatusBar` legado em MaterialReader e Meditacao (Alto)

**Arquivos:**
- `src/screens/Educacional/MaterialReader.tsx`
- `src/screens/Meditacao/Meditacao.tsx`

Ambas as telas usavam a API `StatusBar` do `react-native` core com `barStyle` e `backgroundColor`. Misturar essa API com o `expo-status-bar` usado globalmente causa comportamento inconsistente entre telas.

**Correção aplicada:**
```tsx
// Antes
import { StatusBar } from "react-native";
<StatusBar barStyle="light-content" backgroundColor="#0C0A14" />

// Depois
import { StatusBar } from "expo-status-bar";
<StatusBar hidden={true} translucent={true} />
```

---

### 6. Theme Android sem configuração de transparência (Alto)

**Arquivo:** `android/app/src/main/res/values/styles.xml`

O tema do app definia `statusBarColor` com cor sólida preta mas não configurava a `navigationBarColor`. Quando a Navigation Bar reaparecia (overlay-swipe, transições), exibia a cor padrão do sistema (branco/cinza), quebrando o visual.

**Correção aplicada:**
```xml
<!-- Antes -->
<item name="android:statusBarColor">#000000</item>

<!-- Depois -->
<item name="android:statusBarColor">@android:color/transparent</item>
<item name="android:navigationBarColor">@android:color/transparent</item>
<item name="android:windowTranslucentStatus">false</item>
<item name="android:windowTranslucentNavigation">false</item>
<item name="android:windowFullscreen">true</item>
```

---

### 7. `windowSoftInputMode` incompatível com fullscreen (Médio)

**Arquivo:** `android/app/src/main/AndroidManifest.xml`

`adjustResize` redimensiona a janela da Activity quando o teclado abre. Em modo fullscreen isso pode causar um relayout momentâneo que exibe as barras do sistema, além de layout shifting visível em telas com inputs (Login, SignUp, PasswordReset).

**Correção aplicada:**
```xml
<!-- Antes -->
android:windowSoftInputMode="adjustResize"

<!-- Depois -->
android:windowSoftInputMode="adjustPan"
```

---

### 8. `MainActivity.kt` sem `WindowCompat` (Médio)

**Arquivo:** `android/app/src/main/java/com/bethunter/app/MainActivity.kt`

Sem `WindowCompat.setDecorFitsSystemWindows(window, false)`, o React Native não recebe os window insets corretamente no `SafeAreaProvider`. No Android 15 (API 35), edge-to-edge passa a ser obrigatório e forçado pelo sistema — sem essa configuração o layout pode quebrar.

**Correção aplicada:**
```kotlin
import androidx.core.view.WindowCompat

override fun onCreate(savedInstanceState: Bundle?) {
  setTheme(R.style.AppTheme)
  super.onCreate(null)
  WindowCompat.setDecorFitsSystemWindows(window, false) // adicionado
}
```

---

### 9. Splash screen não translúcida (Baixo)

**Arquivo:** `android/app/src/main/res/values/strings.xml`

Com `expo_splash_screen_status_bar_translucent=false`, a splash reservava espaço físico para a Status Bar. Na transição splash → app, a barra "desaparecia" visivelmente.

**Correção aplicada:**
```xml
<!-- Antes -->
<string name="expo_splash_screen_status_bar_translucent" translatable="false">false</string>

<!-- Depois -->
<string name="expo_splash_screen_status_bar_translucent" translatable="false">true</string>
```

---

## O que estava correto (não alterado)

| Item | Detalhe |
|---|---|
| Navigation Bar hiding | `NavigationBar.setVisibilityAsync("hidden")` + `setBehaviorAsync("overlay-swipe")` + re-aplica no `AppState.change` — padrão correto |
| `SafeAreaProvider` no root | `App.tsx` — obrigatório e presente |
| `headerShown: false` | Todos os 29 routes no Stack Navigator |
| `OnboardingLayout` | Usa `useSafeAreaInsets()` corretamente com `paddingTop: insets.top + 16` |
| `Footer.tsx` | Usa `SafeAreaView edges={["bottom"]}` da lib correta |
| `android:windowLayoutInDisplayCutoutMode="shortEdges"` | Suporte a notch correto |
| `screenOrientation="portrait"` | Evita bugs de landscape |

---

## Arquivos modificados (total: 32)

```
App.tsx
src/components/AppLoadingScreen.tsx
src/screens/Paywall/Paywall.tsx
src/screens/Account/AccountHistory.tsx
src/screens/Account/AccountOverview.tsx
src/screens/Account/TransactionForm.tsx
src/screens/Acessor/HistoryList.tsx
src/screens/Config/Config.tsx
src/screens/Config/Notifications.tsx
src/screens/CustomerCenter/CustomerCenter.tsx
src/screens/Educacional/MaterialReader.tsx
src/screens/Educacional/Ranking.tsx
src/screens/EmConstrucao/EmConstrucao.tsx
src/screens/Login/Login.tsx
src/screens/Meditacao/Meditacao.tsx
src/screens/MinhaConta/MinhaConta.tsx
src/screens/MinhaConta/SejaParceiro.tsx
src/screens/MinhaConta/SobreNos.tsx
src/screens/PasswordReset/PasswordResetEmail.tsx
src/screens/PasswordReset/PasswordResetMethod.tsx
src/screens/PasswordReset/PasswordResetNewPassword.tsx
src/screens/PasswordReset/PasswordResetVerification.tsx
src/screens/PersonalityTest/PersonalityTestIntro.tsx
src/screens/PersonalityTest/PersonalityTestQuestion.tsx
src/screens/Profile/ChangePassword.tsx
src/screens/Profile/DetalhesPessoais.tsx
src/screens/Profile/Profile.tsx
src/screens/Quiz/QuizResult.tsx
android/app/src/main/res/values/styles.xml
android/app/src/main/res/values/strings.xml
android/app/src/main/AndroidManifest.xml
android/app/src/main/java/com/bethunter/app/MainActivity.kt
```

---

## Como testar

> Mudanças nos arquivos nativos (`styles.xml`, `AndroidManifest.xml`, `MainActivity.kt`) requerem rebuild nativo — hot reload não aplica.

```bash
cd BetHunter

# Rebuild completo Android
npm run android
```

**Checklist de validação manual:**

- [ ] Status Bar invisível em todas as telas (abertura, Login, Home, Paywall, Educacional, Perfil)
- [ ] Navigation Bar invisível em repouso; aparece como overlay ao arrastar da borda
- [ ] Paywall: botões de compra e restaurar completamente visíveis e clicáveis
- [ ] Splash screen → app sem flash de barra
- [ ] Teclado abre em Login/SignUp sem causar layout jump
- [ ] App minimizado e reaberto: barras permanecem ocultas
- [ ] Testar em gesture navigation (Android 10+) e 3-button navigation
