# Sistema de Quiz - BetHunter

## 🎯 Funcionalidades Implementadas

### ✅ **Quiz Padrão Criado**

- **Tela**: `QuizScreen.jsx`
- **Dados**: `quizData.js`
- **Navegação**: Integrada ao AppNavigator
- **Funcionalidades**: Timer, pontuação, explicações, resultados

## 📱 Como Funciona

### 1. **Acesso ao Quiz**

- Vá para a tela "Aprender"
- Clique no card "Fundamentos"
- Será direcionado para o quiz

### 2. **Funcionalidades do Quiz**

- ⏱️ **Timer**: 30 segundos por questão
- 🎯 **Pontuação**: Contagem de acertos
- ✅ **Feedback**: Mostra se acertou ou errou
- 📝 **Explicações**: Explica a resposta correta
- 📊 **Resultado Final**: Mostra pontuação total

### 3. **Interface**

- Design moderno e responsivo
- Cores consistentes com o app
- Animações e feedback visual
- Navegação intuitiva

## 🔧 Como Personalizar

### **Substituir Dados do Quiz**

1. **Edite o arquivo**: `src/features/learn/quizData.js`

2. **Estrutura dos dados**:

```javascript
export const QUIZ_DATA = {
  fundamentos: {
    title: "Seu Título",
    description: "Sua Descrição",
    questions: [
      {
        id: 1,
        question: "Sua pergunta?",
        options: ["Opção A", "Opção B", "Opção C", "Opção D"],
        correctAnswer: 1, // Índice da resposta correta (0-3)
        explanation: "Explicação da resposta correta",
      },
    ],
  },
};
```

### **Adicionar Novos Quizzes**

1. **Adicione no `quizData.js`**:

```javascript
export const QUIZ_DATA = {
  fundamentos: {
    /* dados existentes */
  },
  novoQuiz: {
    title: "Novo Quiz",
    description: "Descrição do novo quiz",
    questions: [
      /* suas questões */
    ],
  },
};
```

2. **Atualize a navegação** na tela Aprender:

```javascript
onPress={() => {
  if (module.title === "Fundamentos") {
    navigation.navigate("QuizScreen", { quizType: 'fundamentos' });
  } else if (module.title === "Novo Módulo") {
    navigation.navigate("QuizScreen", { quizType: 'novoQuiz' });
  }
}}
```

### **Personalizar Timer**

- Edite a linha: `const [timeLeft, setTimeLeft] = useState(30);`
- Mude o valor para o tempo desejado em segundos

### **Personalizar Estilos**

- Edite o arquivo `QuizScreen.jsx`
- Modifique o objeto `styles` para cores e layout desejados

## 📊 Estrutura de Dados

### **Questão**

```javascript
{
  id: 1,                    // ID único
  question: "Pergunta?",    // Texto da pergunta
  options: [                // Array com 4 opções
    "Opção A",
    "Opção B",
    "Opção C",
    "Opção D"
  ],
  correctAnswer: 1,         // Índice da resposta correta (0-3)
  explanation: "Explicação" // Texto explicativo
}
```

### **Quiz Completo**

```javascript
{
  title: "Título do Quiz",
  description: "Descrição do quiz",
  questions: [ /* array de questões */ ]
}
```

## 🚀 Próximos Passos

### **Para Implementar**:

1. **Dados Reais**: Substitua os dados padrão pelos seus
2. **Mais Quizzes**: Adicione quizzes para outros módulos
3. **Persistência**: Salvar progresso do usuário
4. **Certificados**: Gerar certificados de conclusão
5. **Ranking**: Sistema de pontuação global

### **Funcionalidades Extras**:

- **Modo Hard**: Sem timer
- **Modo Practice**: Sem pontuação
- **Revisão**: Revisar questões erradas
- **Progresso**: Salvar progresso por módulo

## 🎨 Personalização Visual

### **Cores Disponíveis**:

- Primária: `#7456C8`
- Sucesso: `#4CAF50`
- Erro: `#F44336`
- Aviso: `#FF9800`
- Fundo: `#000000`
- Superfície: `#1A1A1A`

### **Componentes Customizáveis**:

- Timer
- Barra de progresso
- Botões de opção
- Tela de resultado
- Explicações

## 📝 Exemplo de Uso

```javascript
// Para acessar o quiz
navigation.navigate("QuizScreen", {
  quizType: "fundamentos",
});

// Para adicionar novo quiz
const novoQuiz = {
  title: "Meu Quiz",
  questions: [
    {
      question: "Minha pergunta?",
      options: ["A", "B", "C", "D"],
      correctAnswer: 0,
      explanation: "Explicação",
    },
  ],
};
```

O sistema está **100% funcional** e pronto para receber seus dados específicos! 🎉
