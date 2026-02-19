# Correções de erros na tela Home (Home.tsx)

Este documento descreve as alterações feitas em `src/screens/Home/Home.tsx` para corrigir os erros de TypeScript/lint (marcados em vermelho no editor).

---

## Resumo

Foram corrigidos **5 erros**:

1. Tipo de `user`: propriedade `name` não existia no tipo `string`.
2. Estilo inexistente: `freeOfBetDaysClickable`.
3. Estilo inexistente: `freeOfBetDaysHint`.
4. Tipo inexistente: `Article` usado em `renderArticleCard`.
5. JSX: `<View>` na caixa da roleta sem tag de fechamento.

---

## 1. Tipo do estado `user` (linha ~248)

**Problema:** O estado era `useState<string | null>(null)`, mas no JSX era usado como objeto: `user?.name` e em outro trecho `user?.betcoins`. O TypeScript acusava: _"A propriedade 'name' não existe no tipo 'string'"_.

**Solução:**

- Criado o tipo `HomeUser` para o usuário exibido na Home:
  ```ts
  type HomeUser = { name?: string; betcoins?: number } | null;
  ```
- Alterado o estado de `user` para usar esse tipo:
  ```ts
  const [user, setUser] = useState<HomeUser>(null);
  ```

Assim, `user?.name` e `user?.betcoins` passam a ser válidos. Quando integrar com API de usuário, basta popular `setUser({ name: '...', betcoins: ... })`.

---

## 2. Estilo `freeOfBetDaysClickable` (linha ~294)

**Problema:** O estilo `styles.freeOfBetDaysClickable` era usado no bloco "X dias" (feedback visual quando `canCheckIn === true`), mas não existia no `StyleSheet.create`, gerando erro de tipo.

**Solução:** Incluído no `StyleSheet.create` o estilo:

- `freeOfBetDaysClickable`: borda tracejada, cantos arredondados e padding para indicar que o número de dias é clicável quando o usuário pode marcar check-in.

---

## 3. Estilo `freeOfBetDaysHint` (linha ~299)

**Problema:** O texto "Toque para marcar" usava `styles.freeOfBetDaysHint`, que não existia no `StyleSheet.create`.

**Solução:** Incluído no `StyleSheet.create` o estilo:

- `freeOfBetDaysHint`: cor suave, fonte menor e alinhamento central para a dica exibida quando `canCheckIn === true`.

---

## 4. Tipo `Article` (linha ~352)

**Problema:** A função `renderArticleCard` estava tipada como `(article: Article)`, mas o tipo `Article` não estava definido nem importado, gerando _"Não é possível encontrar o nome 'Article'"_.

**Solução:** Definida no próprio arquivo a interface `Article`:

```ts
interface Article {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}
```

Isso está alinhado ao uso em `renderArticleCard` e em `getArticleImage(article)` (que usa `article.imageUrl`).

---

## 5. Tag JSX `<View>` sem fechamento (linha ~523)

**Problema:** O `<View style={styles.rouletteBox}>` que envolve os gradientes da caixa "Betcoins Roulette" não tinha uma tag de fechamento `</View>` correspondente. O único `</View>` que fecharia essa `View` estava dentro de um bloco comentado, então o parser acusava _"O elemento JSX 'View' não tem uma marcação de fechamento correspondente"_.

**Solução:** Inserida a tag `</View>` logo após o último `LinearGradient` (overlay direito) e antes do bloco comentado, fechando corretamente o `View` da `rouletteBox`.

Estrutura após a correção:

```jsx
<TouchableOpacity ...>
  <View style={styles.rouletteBox}>
    <LinearGradient ... />
    <LinearGradient ... />
    <LinearGradient ... />
  </View>
  {/* conteúdo comentado ... */}
</TouchableOpacity>
```

---

## Arquivos alterados

- **`BetHunter/src/screens/Home/Home.tsx`**
  - Tipos: `HomeUser`, `Article`.
  - Estado: `user` com tipo `HomeUser`.
  - Estilos: `freeOfBetDaysClickable`, `freeOfBetDaysHint`.
  - JSX: `</View>` na seção da roleta.

Nenhum outro arquivo foi modificado.

---

## Verificação

Após as alterações, o arquivo `Home.tsx` foi verificado com o linter: **nenhum erro restante** nas linhas e propriedades citadas.
