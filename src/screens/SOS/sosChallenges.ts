/**
 * Bancos de desafios do módulo SOS.
 * Textos curtos e imperativos: a pessoa em fissura não deve precisar pensar.
 */

/** Desafio Relâmpago — aterramento cognitivo (tarefas imediatas, sem timer). */
export const LIGHTNING_CHALLENGES: string[] = [
  "Encontre 5 objetos azuis ao seu redor agora.",
  "Conte de 100 a 0 diminuindo de 7 em 7.",
  "Murmure uma música da sua infância por 20 segundos.",
  "Diga em voz alta 5 coisas que você está vendo agora.",
  "Escreva seu nome completo de trás para frente.",
  "Toque em 4 texturas diferentes e descreva cada uma.",
  "Liste mentalmente 6 cidades que começam com a letra S.",
  "Beba um copo de água inteiro prestando atenção em cada gole.",
  "Nomeie 3 sons que você consegue ouvir neste momento.",
  "Organize 5 objetos da mesa por ordem de tamanho.",
];

export interface PhysicalChallenge {
  instruction: string;
  detail: string;
}

/** Choque Fisiológico — reset corporal (ação física + timer de 1 minuto). */
export const PHYSICAL_CHALLENGES: PhysicalChallenge[] = [
  {
    instruction: "Lave o rosto com a água mais gelada possível",
    detail: "O choque térmico ativa o nervo vago e reduz a taquicardia.",
  },
  {
    instruction: "Faça 15 polichinelos sem parar",
    detail: "Descarrega a adrenalina acumulada da fissura.",
  },
  {
    instruction: "Segure um cubo de gelo na mão até derreter",
    detail: "O frio intenso redireciona o foco do cérebro.",
  },
  {
    instruction: "Suba e desça um lance de escada 3 vezes",
    detail: "Movimento intenso interrompe o loop de ansiedade.",
  },
  {
    instruction: "Faça 10 agachamentos com pausa de 2s embaixo",
    detail: "Esforço muscular libera a tensão do corpo.",
  },
  {
    instruction: "Aperte e solte os punhos com força 20 vezes",
    detail: "Contração e relaxamento desarmam a resposta de luta.",
  },
];

export function pickRandom<T>(list: readonly T[], exclude?: T): T {
  if (list.length <= 1) return list[0];
  let next: T;
  do {
    next = list[Math.floor(Math.random() * list.length)];
  } while (next === exclude);
  return next;
}
