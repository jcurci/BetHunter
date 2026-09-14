import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { BetStreakDuration } from "../../domain/entities/BetStreakDuration";
import { useDashboardStore } from "../../storage/dashboardStore";
import { isMilestone, scheduleMilestoneShareInvite } from "../../services/notifications";
import { lastCelebratedMilestone } from "../../services/shareDiscovery";
import { maybeRequestReview } from "../../services/appReview";

interface UseBetStreakCounterParams {
  userId: string | null;
  /** Dados do dashboard já carregados — porta de entrada dos efeitos. */
  statsReady: boolean;
  /** Abre o modal de conquista do marco recém-alcançado. */
  onMilestone: (days: number) => void;
}

interface UseBetStreakCounterResult {
  /**
   * Consulta o contador de novo e devolve o valor fresco, ou `null` se a
   * consulta falhar. Quem chama **não deve** compartilhar com `null`: um erro
   * de rede não é zero dia, e mandar o valor velho faria o card mentir.
   */
  prepararCompartilhamento: () => Promise<BetStreakDuration | null>;
  /** True enquanto o refetch pré-compartilhamento está em voo. */
  isPreparandoCompartilhamento: boolean;
}

/**
 * Orquestração do contador automático de tempo sem apostar.
 *
 * O contador roda no backend a partir de `bet_free_since_at`: começa no
 * cadastro, cresce sozinho e só volta a zero num reset. O app não participa da
 * conta — ele consulta. Por isso aqui não existe timer local, incremento nem
 * agendamento: só momentos em que vale a pena reconsultar.
 *
 * São eles: ao focar a Home, ao voltar do segundo plano e imediatamente antes
 * de gerar o card de compartilhamento. Nenhum deles dispara reset ou
 * inicialização — são todos leitura.
 */
export function useBetStreakCounter({
  userId,
  statsReady,
  onMilestone,
}: UseBetStreakCounterParams): UseBetStreakCounterResult {
  const loadBetStreak = useDashboardStore((s) => s.loadBetStreak);
  const betStreakDays = useDashboardStore((s) => s.betStreak.days);
  /**
   * Null enquanto nenhuma consulta tiver voltado. É o que separa "o usuário está
   * em zero dia" de "ainda não sabemos" — os dois têm `days === 0`.
   */
  const carregouContador = useDashboardStore((s) => s.lastFetchedBetStreak !== null);
  const [isPreparandoCompartilhamento, setIsPreparando] = useState(false);

  /** Consulta silenciosa: um erro aqui mantém o último valor conhecido. */
  const atualizar = useCallback(() => {
    void loadBetStreak().catch(() => {});
  }, [loadBetStreak]);

  // Ao focar a tela. O TTL curto do store evita rajada de requisições em
  // navegações rápidas entre abas.
  useFocusEffect(
    useCallback(() => {
      atualizar();
    }, [atualizar]),
  );

  // Ao voltar do segundo plano — é onde o valor mais tende a estar velho, já
  // que o tempo passou com o app fechado.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") atualizar();
    });
    return () => subscription.remove();
  }, [atualizar]);

  /**
   * Marco e convite de avaliação.
   *
   * Antes disparavam no sucesso do check-in. Sem check-in, o gatilho passa a ser
   * a chegada de um valor novo do contador. A troca é segura porque os dois já
   * são idempotentes e persistidos por usuário: `lastCelebratedMilestone` guarda
   * o **maior** marco comemorado (quem reseta e volta a subir não repete o mesmo
   * modal) e `maybeRequestReview` pede avaliação uma vez por usuário, para
   * sempre.
   *
   * O ref evita reprocessar o mesmo número a cada render — não é uma regra de
   * negócio, é só ruído a menos.
   */
  const ultimoAvaliado = useRef<number | null>(null);

  useEffect(() => {
    // `carregouContador` é o guard que importa: sem ele o efeito rodaria com o
    // zero do estado inicial e trataria "ainda carregando" como "zero dia".
    if (!statsReady || !userId || !carregouContador) return;
    if (ultimoAvaliado.current === betStreakDays) return;
    ultimoAvaliado.current = betStreakDays;

    let vivo = true;

    void (async () => {
      let celebrou = false;

      if (isMilestone(betStreakDays)) {
        const maiorJaComemorado = await lastCelebratedMilestone(userId);
        if (vivo && betStreakDays > maiorJaComemorado) {
          onMilestone(betStreakDays);
          await scheduleMilestoneShareInvite(betStreakDays);
          celebrou = true;
        }
      }

      // O modal de conquista já ocupa a tela; o diálogo da loja subiria por
      // cima dele. Quem cai num marco é convidado na próxima carga comum.
      if (vivo && !celebrou) {
        await maybeRequestReview(userId, betStreakDays);
      }
    })();

    return () => {
      vivo = false;
    };
  }, [statsReady, userId, carregouContador, betStreakDays, onMilestone]);

  const prepararCompartilhamento = useCallback(async () => {
    setIsPreparando(true);
    try {
      return await loadBetStreak(true);
    } catch {
      return null;
    } finally {
      setIsPreparando(false);
    }
  }, [loadBetStreak]);

  return { prepararCompartilhamento, isPreparandoCompartilhamento };
}
