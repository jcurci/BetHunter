import { QuizAnswers } from './OnboardingContext';

export type RiskLevel = 'BAIXO' | 'MODERADO' | 'ALTO' | 'CRÍTICO';

export type ProfileType =
  | 'Consciente'
  | 'Apostador Social'
  | 'Apostador de Risco'
  | 'Apostador em Recuperação'
  | 'Apostador Compulsivo';

export type ProfileResult = {
  riskLevel: RiskLevel;
  riskScore: number;
  profileType: ProfileType;
  monthlySpend: number;
  projectedSavings: number;
  profileSummary: string;
  track: string;
  focus: string;
  mainGoal: string;
};

const FREQUENCY_SCORE: Record<string, number> = {
  'Nunca apostei': 5,
  'Já parei, mas recaí': 55,
  '1–3x por semana': 70,
  'Todo dia': 100,
};

const FINANCIAL_IMPACT_SCORE: Record<string, number> = {
  'Menos de R$ 100': 10,
  'R$ 100 – R$ 500': 35,
  'R$ 500 – R$ 2.000': 65,
  'Mais de R$ 2.000': 100,
};

const MOTIVATION_SCORE: Record<string, number> = {
  'Diversão / entretenimento': 20,
  'Influência de amigos': 40,
  'Acreditei que podia ganhar dinheiro': 65,
  'Fugir de problemas': 100,
};

const FINANCIAL_SITUATION_SCORE: Record<string, number> = {
  'Estável, consigo poupar': 10,
  'No limite — gasto tudo que ganho': 45,
  'Com dívidas, mas controlando': 70,
  'Endividado e sem controle': 100,
};

const MONTHLY_SPEND_MAP: Record<string, number> = {
  'Menos de R$ 100': 33,
  'R$ 100 – R$ 500': 100,
  'R$ 500 – R$ 2.000': 420,
  'Mais de R$ 2.000': 833,
};

function getRiskLevel(score: number): RiskLevel {
  if (score >= 76) return 'CRÍTICO';
  if (score >= 56) return 'ALTO';
  if (score >= 31) return 'MODERADO';
  return 'BAIXO';
}

function getProfileType(score: number, frequency: string | null): ProfileType {
  if (frequency === 'Já parei, mas recaí') return 'Apostador em Recuperação';
  if (score >= 76) return 'Apostador Compulsivo';
  if (score >= 56) return 'Apostador de Risco';
  if (score >= 31) return 'Apostador Social';
  return 'Consciente';
}

function getProfileSummary(profileType: ProfileType): string {
  switch (profileType) {
    case 'Apostador Compulsivo':
      return 'Seu padrão indica alto envolvimento com apostas. Pessoas com esse perfil geralmente precisam de ferramentas de apoio para retomar o controle.';
    case 'Apostador em Recuperação':
      return 'Você já tentou parar — isso mostra força. O Bethunter foi feito para pessoas como você, que querem manter o controle.';
    case 'Apostador de Risco':
      return 'Você apresenta sinais de risco significativo. Sem intervenção, esse padrão tende a se intensificar com o tempo.';
    case 'Apostador Social':
      return 'Suas apostas ainda parecem controláveis, mas atenção: muitos apostadores compulsivos começaram assim.';
    case 'Consciente':
      return 'Você está no caminho certo. O Bethunter pode ajudar a manter esse controle e evitar recaídas.';
  }
}

function getTrack(profileType: ProfileType): string {
  switch (profileType) {
    case 'Apostador Compulsivo': return 'Anti-vício';
    case 'Apostador em Recuperação': return 'Anti-vício';
    case 'Apostador de Risco': return 'Prevenção';
    case 'Apostador Social': return 'Consciência';
    case 'Consciente': return 'Manutenção';
  }
}

function getFocus(financialSituation: string | null, objective: string | null): string {
  if (
    financialSituation === 'Endividado e sem controle' ||
    financialSituation === 'Com dívidas, mas controlando' ||
    objective === 'Sair das dívidas'
  ) return 'Finanças';

  if (objective === 'Ter reserva de emergência') return 'Economia';
  if (objective === 'Entender melhor meu dinheiro') return 'Educação financeira';

  return 'Controle';
}

export function calculateProfile(answers: QuizAnswers): ProfileResult {
  const freqScore = FREQUENCY_SCORE[answers.frequency ?? ''] ?? 50;
  const impactScore = FINANCIAL_IMPACT_SCORE[answers.financialImpact ?? ''] ?? 50;
  const motivScore = MOTIVATION_SCORE[answers.motivation ?? ''] ?? 50;
  const situationScore = FINANCIAL_SITUATION_SCORE[answers.financialSituation ?? ''] ?? 50;

  const riskScore = Math.round(
    freqScore * 0.3 +
    impactScore * 0.25 +
    motivScore * 0.2 +
    situationScore * 0.25
  );

  const riskLevel = getRiskLevel(riskScore);
  const profileType = getProfileType(riskScore, answers.frequency);
  const monthlySpend = MONTHLY_SPEND_MAP[answers.financialImpact ?? ''] ?? 100;
  const projectedSavings = monthlySpend * 12;
  const profileSummary = getProfileSummary(profileType);
  const track = getTrack(profileType);
  const focus = getFocus(answers.financialSituation, answers.objective);
  const mainGoal = answers.objective ?? 'Parar de apostar de vez';

  return {
    riskLevel,
    riskScore,
    profileType,
    monthlySpend,
    projectedSavings,
    profileSummary,
    track,
    focus,
    mainGoal,
  };
}
