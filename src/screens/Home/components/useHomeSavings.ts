/**
 * Valor economizado exibido no estado B do contador da Home.
 *
 * TODO(integração): ainda não existe fonte de dados para este valor — nem no
 * backend nem nos stores. Quando existir, troque apenas o corpo deste hook
 * (ex.: ler de `useDashboardStore`) e devolva `null` enquanto carrega: o
 * contador já trata `null` como skeleton.
 */
export const HOME_SAVINGS_MOCK = 15672;

export function useHomeSavings(): { amount: number | null } {
  return { amount: HOME_SAVINGS_MOCK };
}

/**
 * 15672 → "15.672,00". Formatação manual de propósito: não depende do suporte
 * a Intl do Hermes, que varia entre builds Android.
 */
export function formatSavings(amount: number): string {
  const fixed = Math.abs(amount).toFixed(2);
  const [int, cents] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${amount < 0 ? "-" : ""}${grouped},${cents}`;
}
