# Documentação do Componente Modal

## Índice
1. [Visão Geral](#visão-geral)
2. [Instalação](#instalação)
3. [Props](#props)
4. [Tamanhos](#tamanhos)
5. [Animações](#animações)
6. [Ícones do Header](#ícones-do-header)
7. [Botões](#botões)
8. [Exemplos de Uso](#exemplos-de-uso)
9. [Casos de Uso Comuns](#casos-de-uso-comuns)

---

## Visão Geral

O componente `Modal` é um modal reutilizável e altamente customizável que oferece:
- 4 tamanhos responsivos (bigger, big, medium, small)
- 2 tipos de animação (slide, fade)
- Ícones configuráveis no header (esquerda e direita)
- Botões customizáveis com 4 variantes de estilo
- Conteúdo totalmente flexível via `children`
- Backdrop configurável

---

## Instalação

```typescript
import { Modal } from '../../components/common';
// ou
import Modal from '../../components/common/Modal/Modal';
```

---

## Props

### Props Obrigatórias

| Prop | Tipo | Descrição |
|------|------|-----------|
| `visible` | `boolean` | Controla a visibilidade do modal |
| `onClose` | `() => void` | Callback chamado ao fechar o modal (X ou backdrop) |
| `children` | `React.ReactNode` | Conteúdo do modal |

### Props Opcionais

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `size` | `'bigger' \| 'big' \| 'medium' \| 'small'` | `'medium'` | Tamanho do modal |
| `title` | `string` | - | Título exibido no centro do header |
| `subtitle` | `string` | - | Subtítulo exibido abaixo do título |
| `animationType` | `'slide' \| 'fade'` | `'slide'` | Tipo de animação |
| `headerActions` | `HeaderActions` | - | Ícones no header (esquerda/direita) |
| `buttons` | `ButtonConfig[]` | - | Array de botões |
| `showCloseButton` | `boolean` | `true` | Mostra/oculta o botão X de fechar |
| `backdropOpacity` | `number` | `0.5` | Opacidade do backdrop (0 a 1) |

---

## Tamanhos

O modal possui 4 tamanhos responsivos baseados na altura da tela:

| Size | Altura | Uso Recomendado |
|------|--------|-----------------|
| `bigger` | 90% da tela | Modais com muito conteúdo ou formulários longos |
| `big` | 70% da tela | Modais com conteúdo médio/longo |
| `medium` | 50% da tela | Modais padrão com conteúdo moderado |
| `small` | 30% da tela | Confirmações, alertas, mensagens curtas |

---

## Animações

### Slide (Padrão)
Modal desliza de baixo para cima com efeito de mola.

```typescript
<Modal visible={true} animationType="slide">
  {/* conteúdo */}
</Modal>
```

### Fade
Modal aparece com fade in/out.

```typescript
<Modal visible={true} animationType="fade">
  {/* conteúdo */}
</Modal>
```

---

## Ícones do Header

Os ícones podem ser posicionados à esquerda ou à direita do header (o X de fechar sempre fica à esquerda).

### Interface HeaderAction

```typescript
interface HeaderAction {
  icon: string;           // Nome do ícone (MaterialCommunityIcons)
  onPress: () => void;    // Função executada ao clicar
  color?: string;         // Cor do ícone (padrão: #FFFFFF)
  size?: number;          // Tamanho do ícone (padrão: 24)
}
```

### Interface HeaderActions

```typescript
interface HeaderActions {
  left?: HeaderAction[];   // Ícones à esquerda
  right?: HeaderAction[];  // Ícones à direita
}
```

### Exemplos

#### 1 ícone na esquerda
```typescript
<Modal
  headerActions={{
    left: [{ icon: 'arrow-left', onPress: () => console.log('Voltar') }]
  }}
>
  {/* conteúdo */}
</Modal>
```

#### 1 ícone na direita
```typescript
<Modal
  headerActions={{
    right: [{ icon: 'pencil', onPress: () => console.log('Editar') }]
  }}
>
  {/* conteúdo */}
</Modal>
```

#### 2 ícones na direita
```typescript
<Modal
  headerActions={{
    right: [
      { icon: 'pencil', onPress: handleEdit },
      { icon: 'delete', onPress: handleDelete, color: '#FF4444' }
    ]
  }}
>
  {/* conteúdo */}
</Modal>
```

#### 1 esquerda + 2 direita
```typescript
<Modal
  headerActions={{
    left: [{ icon: 'arrow-left', onPress: goBack }],
    right: [
      { icon: 'pencil', onPress: handleEdit },
      { icon: 'share-variant', onPress: handleShare }
    ]
  }}
>
  {/* conteúdo */}
</Modal>
```

---

## Botões

### Interface ButtonConfig

```typescript
interface ButtonConfig {
  label: string;                    // Texto do botão
  onPress: () => void;              // Função ao clicar
  variant?: ButtonVariant;          // Estilo do botão
  icon?: string;                    // Ícone opcional
  iconPosition?: 'left' | 'right';  // Posição do ícone
  disabled?: boolean;               // Desabilita o botão
  loading?: boolean;                // Mostra loading
  customStyle?: ViewStyle;          // Estilo customizado
  customTextStyle?: TextStyle;      // Estilo do texto customizado
}
```

### Variantes de Botão

| Variant | Aparência | Uso |
|---------|-----------|-----|
| `primary` | Fundo rosa (#FF6B9D), texto branco | Ação principal |
| `secondary` | Borda branca, fundo transparente | Ação secundária |
| `danger` | Fundo vermelho (#FF4444), texto branco | Ações destrutivas |
| `ghost` | Sem fundo, apenas texto | Ações terciárias |

### Exemplos

#### Botão simples
```typescript
<Modal
  buttons={[
    { label: 'Confirmar', onPress: handleConfirm }
  ]}
>
  {/* conteúdo */}
</Modal>
```

#### Botão com ícone
```typescript
<Modal
  buttons={[
    {
      label: 'Salvar',
      onPress: handleSave,
      icon: 'content-save',
      iconPosition: 'left'
    }
  ]}
>
  {/* conteúdo */}
</Modal>
```

#### Múltiplos botões com variantes
```typescript
<Modal
  buttons={[
    {
      label: 'Cancelar',
      onPress: handleCancel,
      variant: 'secondary'
    },
    {
      label: 'Deletar',
      onPress: handleDelete,
      variant: 'danger',
      icon: 'delete'
    }
  ]}
>
  {/* conteúdo */}
</Modal>
```

#### Botão com loading
```typescript
<Modal
  buttons={[
    {
      label: 'Salvando...',
      onPress: handleSave,
      loading: isLoading,
      disabled: isLoading
    }
  ]}
>
  {/* conteúdo */}
</Modal>
```

---

## Exemplos de Uso

### 1. Modal Básico (Sem Botões)

```typescript
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Modal } from '../../components/common';

const MyComponent = () => {
  const [visible, setVisible] = useState(false);

  return (
    <Modal
      visible={visible}
      onClose={() => setVisible(false)}
      title="Informação"
      size="small"
    >
      <Text style={{ color: '#FFF' }}>
        Este é um modal simples sem botões.
      </Text>
    </Modal>
  );
};
```

### 2. Modal de Confirmação

```typescript
const ConfirmationModal = ({ visible, onConfirm, onCancel }) => {
  return (
    <Modal
      visible={visible}
      onClose={onCancel}
      title="Confirmar ação"
      subtitle="Tem certeza que deseja continuar?"
      size="small"
      buttons={[
        {
          label: 'Cancelar',
          onPress: onCancel,
          variant: 'secondary'
        },
        {
          label: 'Confirmar',
          onPress: () => {
            onConfirm();
            onCancel();
          },
          variant: 'primary'
        }
      ]}
    >
      <Text style={{ color: '#A7A3AE', textAlign: 'center' }}>
        Esta ação não pode ser desfeita.
      </Text>
    </Modal>
  );
};
```

### 3. Modal de Edição com Ícones

```typescript
const EditModal = ({ visible, item, onClose, onSave, onDelete }) => {
  const [value, setValue] = useState(item.name);

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Editar Item"
      size="medium"
      headerActions={{
        right: [
          {
            icon: 'content-save',
            onPress: () => {
              onSave(value);
              onClose();
            }
          },
          {
            icon: 'delete',
            onPress: () => {
              onDelete();
              onClose();
            },
            color: '#FF4444'
          }
        ]
      }}
    >
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Nome do item"
        style={styles.input}
      />
    </Modal>
  );
};
```

### 4. Modal de Formulário Completo

```typescript
const FormModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Novo Cadastro"
      subtitle="Preencha os dados abaixo"
      size="big"
      animationType="slide"
      buttons={[
        {
          label: 'Cancelar',
          onPress: onClose,
          variant: 'ghost',
          disabled: loading
        },
        {
          label: loading ? 'Salvando...' : 'Salvar',
          onPress: handleSubmit,
          variant: 'primary',
          loading: loading,
          disabled: loading || !name || !email,
          icon: 'content-save',
          iconPosition: 'left'
        }
      ]}
    >
      <View style={styles.formContainer}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Nome completo"
          style={styles.input}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail"
          keyboardType="email-address"
          style={styles.input}
        />
      </View>
    </Modal>
  );
};
```

### 5. Modal sem Botão de Fechar

```typescript
const NoCloseModal = ({ visible, onForceClose }) => {
  return (
    <Modal
      visible={visible}
      onClose={onForceClose}
      title="Atenção"
      size="small"
      showCloseButton={false}
      buttons={[
        {
          label: 'Entendi',
          onPress: onForceClose,
          variant: 'primary'
        }
      ]}
    >
      <Text style={{ color: '#FFF', textAlign: 'center' }}>
        Você deve ler esta mensagem importante.
      </Text>
    </Modal>
  );
};
```

---

## Casos de Uso Comuns

### 1. Alertas e Notificações
Use `size="small"` sem botões ou com botão único.

### 2. Confirmações
Use `size="small"` ou `medium` com 2 botões (Cancelar + Confirmar).

### 3. Formulários
Use `size="big"` ou `bigger` com campos de entrada e botões de ação.

### 4. Detalhes e Visualização
Use `size="medium"` ou `big` sem botões, apenas com X de fechar.

### 5. Ações Rápidas
Use `size="small"` com múltiplos botões de ação.

### 6. Edição Inline
Use ícones no header (`pencil`, `delete`, `share`) para ações rápidas.

---

## Notas Importantes

1. **Fechamento Manual**: O modal **não fecha automaticamente** ao clicar nos botões. Você deve chamar `onClose()` ou alterar o estado `visible` dentro do `onPress` do botão.

2. **Validações**: Como o fechamento é manual, você pode implementar validações antes de fechar:
   ```typescript
   onPress: () => {
     if (isValid()) {
       handleSave();
       setVisible(false);
     } else {
       showError();
     }
   }
   ```

3. **Scroll Automático**: O conteúdo do modal é scrollável automaticamente se ultrapassar o tamanho disponível.

4. **Ícones**: Use nomes de ícones do `MaterialCommunityIcons`. Consulte: https://materialdesignicons.com/

5. **Backdrop**: Clicar no backdrop (área escura fora do modal) chama `onClose()`.

---

## Estilos Padrão

- Background: `#14121B`
- Borda do header: `#201F2A`
- Título: Branco (`#FFFFFF`), 22px, bold
- Subtítulo: Cinza (`#A7A3AE`), 14px
- Border radius: 24px (topo)
- Botão primary: `#FF6B9D`
- Botão danger: `#FF4444`

---

## Suporte

Para dúvidas ou problemas, consulte o código-fonte em:
`/src/components/common/Modal/Modal.tsx`

Para tipos e interfaces:
`/src/components/common/Modal/Modal.types.ts`






