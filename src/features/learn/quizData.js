// Dados padrão para quizzes - Substitua pelos dados reais quando tiver
export const QUIZ_DATA = {
  fundamentos: {
    title: "Fundamentos de Investimento",
    description: "Teste seus conhecimentos básicos sobre investimentos",
    questions: [
      {
        id: 1,
        question: "O que é um investimento?",
        options: [
          "Gastar dinheiro em algo que não gera retorno",
          "Aplicar dinheiro com o objetivo de obter lucro futuro",
          "Guardar dinheiro embaixo do colchão",
          "Pedir dinheiro emprestado",
        ],
        correctAnswer: 1,
        explanation:
          "Investimento é aplicar dinheiro com expectativa de retorno futuro.",
      },
      {
        id: 2,
        question: "Qual é a principal diferença entre poupança e investimento?",
        options: [
          "Não há diferença, são a mesma coisa",
          "Poupança rende mais que investimento",
          "Investimento tem risco, poupança é mais segura",
          "Poupança é para ricos, investimento para pobres",
        ],
        correctAnswer: 2,
        explanation:
          "Investimentos têm diferentes níveis de risco e retorno, enquanto poupança é mais conservadora.",
      },
      {
        id: 3,
        question: "O que significa diversificação?",
        options: [
          "Colocar todo dinheiro em um só lugar",
          "Distribuir investimentos em diferentes ativos",
          "Investir apenas em ações",
          "Não investir nunca",
        ],
        correctAnswer: 1,
        explanation:
          "Diversificação é distribuir investimentos para reduzir riscos.",
      },
      {
        id: 4,
        question: "Qual é o primeiro passo para começar a investir?",
        options: [
          "Comprar ações de qualquer empresa",
          "Estabelecer objetivos e reserva de emergência",
          "Pedir dinheiro emprestado",
          "Esperar ficar rico primeiro",
        ],
        correctAnswer: 1,
        explanation:
          "Primeiro é importante ter objetivos claros e uma reserva de emergência.",
      },
    ],
  },

  praticaComDinheiro: {
    title: "Prática com Dinheiro",
    description: "Aprenda a gerenciar dinheiro na prática",
    questions: [
      {
        id: 1,
        question: "Qual é a regra dos 50/30/20?",
        options: [
          "50% gastos essenciais, 30% lazer, 20% investimentos",
          "50% investimentos, 30% gastos essenciais, 20% lazer",
          "50% lazer, 30% investimentos, 20% gastos essenciais",
          "Não existe essa regra",
        ],
        correctAnswer: 0,
        explanation:
          "A regra dos 50/30/20 ajuda a organizar o orçamento de forma equilibrada.",
      },
    ],
  },

  conhecimentoAplicado: {
    title: "Conhecimento Aplicado",
    description: "Aplique o que aprendeu em situações reais",
    questions: [
      {
        id: 1,
        question: "Como você reagiria se uma ação caísse 10%?",
        options: [
          "Venderia imediatamente",
          "Compraria mais para baixar o preço médio",
          "Analisaria os fundamentos da empresa",
          "Esqueceria do investimento",
        ],
        correctAnswer: 2,
        explanation:
          "É importante analisar os fundamentos antes de tomar decisões.",
      },
    ],
  },
};

// Função para obter dados de um quiz específico
export const getQuizData = (quizType) => {
  return QUIZ_DATA[quizType] || QUIZ_DATA.fundamentos;
};

// Lista de todos os quizzes disponíveis
export const AVAILABLE_QUIZZES = [
  "fundamentos",
  "praticaComDinheiro",
  "conhecimentoAplicado",
];
