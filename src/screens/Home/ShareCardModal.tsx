/**
 * Modal de compartilhamento do contador.
 *
 * Mostra o preview do card e deixa trocar o fundo. A captura sai de uma segunda
 * cópia do card, renderizada fora da tela em resolução cheia.
 *
 * A mensagem que acompanha a imagem é FIXA e NÃO aparece na interface: ela é
 * montada por `buildShareText` a partir do contador e vai junto no envio. Já foi
 * um campo editável; saiu da tela para todo compartilhamento sair com o mesmo
 * texto e com o CTA intacto, sem virar mais uma decisão para o usuário.
 *
 * Não há seletor de "aparecer com o nome": a arte entregue pelo design não tem
 * espaço para nome nenhum, então o card é sempre anônimo. Ver
 * docs/share-card-contador.md.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import * as Clipboard from 'expo-clipboard';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { BetStreakDuration } from '../../domain/entities/BetStreakDuration';
import Modal from '../../components/common/Modal/Modal';
import { ShareCardTemplate } from '../../components/ShareCard/ShareCardTemplate';
import {
  FUNDO_IDS,
  FundoId,
  sortearFundo,
} from '../../components/ShareCard/backgrounds';
import {
  buildShareLink,
  buildShareMessage,
  buildShareText,
} from '../../config/shareCard';
import {
  captureHeightDp,
  captureWidthDp,
  generateCardImage,
  saveToGallery,
  shareToInstagram,
  shareToWhatsApp,
} from '../../services/shareCard';

type Destino = 'whatsapp' | 'fotos' | 'instagram';

// Fixos: a View da captura precisa de largura E altura explícitas. Deixar a
// altura ser deduzida do filho é o que fazia o card sair achatado em paisagem.
const CAPTURE_W = captureWidthDp();
const CAPTURE_H = captureHeightDp();

/** Padding horizontal que o Modal comum aplica no conteúdo (Modal.tsx:357). */
const MODAL_PADDING = 20;
/** Vão entre os cards. */
const GAP = 10;
/** Espessura do anel de seleção, reservada em volta de cada card. */
const RING = 2;

const NOME_DO_FUNDO: Record<FundoId, string> = {
  bgColorido: 'Colorido',
  bgPreto: 'Preto',
  bgBranco: 'Branco',
};

/**
 * Cor de cada bolinha do seletor.
 *
 * Amostrada dos próprios PNGs (o fundo médio na faixa do texto), então
 * representa a peça de verdade em vez de ser escolhida no olho.
 */
const COR_DO_FUNDO: Record<FundoId, string> = {
  bgColorido: '#5C4457',
  bgPreto: '#3B3B3B',
  bgBranco: '#B9B8B7',
};

const COR_SELECAO = '#7456C8';

interface ShareCardModalProps {
  visible: boolean;
  onClose: () => void;
  duracao: BetStreakDuration;
  /** `user.id` — UUID anônimo usado no `ref` do link. */
  userId: string | null;
  /**
   * Disparado quando o envio de fato aconteceu — imagem entregue a um app ou
   * salva na galeria. `cancelado` e `falhou` NÃO contam: quem abriu o seletor e
   * desistiu continua sendo alvo do convite recorrente.
   */
  onShared?: () => void;
}

export default function ShareCardModal({
  visible,
  onClose,
  duracao,
  userId,
  onShared,
}: ShareCardModalProps) {
  const captureRef = useRef<View>(null);
  const { width: larguraTela } = useWindowDimensions();

  // Os três cards dividem a largura útil do modal. É a largura que limita o
  // tamanho deles, não a altura — em 360dp de tela sobram ~96dp por card.
  const cardW = Math.floor(
    (larguraTela - MODAL_PADDING * 2 - GAP * 2 - RING * 6) / 3,
  );

  const [fundoId, setFundoId] = useState<FundoId>('bgColorido');
  const texto = useMemo(() => buildShareText(duracao), [duracao]);
  // Qual destino está em andamento — o spinner aparece só no ícone tocado.
  const [enviando, setEnviando] = useState<Destino | null>(null);
  const ocupado = enviando !== null;

  const link = useMemo(() => buildShareLink(userId), [userId]);

  // Sorteia o fundo a cada abertura.
  useEffect(() => {
    if (!visible) return;
    setFundoId(sortearFundo());
  }, [visible]);

  /**
   * Tronco comum dos três destinos: gera a imagem uma vez e entrega ao handler.
   * Erro de geração é tratado aqui, para nenhum destino precisar repetir isso.
   */
  const comImagem = async (
    destino: Destino,
    acao: (uri: string) => Promise<void>,
  ) => {
    setEnviando(destino);
    try {
      const uri = await generateCardImage(captureRef);
      await acao(uri);
    } catch {
      Alert.alert(
        'Não foi possível gerar a imagem',
        'Tente novamente em alguns instantes.',
      );
    } finally {
      setEnviando(null);
    }
  };

  const handleWhatsApp = () =>
    comImagem('whatsapp', async (uri) => {
      const resultado = await shareToWhatsApp(
        uri,
        buildShareMessage(texto, link),
      );
      // 'cancelado' = o usuário fechou o seletor. Não é erro: o modal fica onde
      // está, sem alerta, para ele tentar outro destino.
      if (resultado === 'cancelado') return;
      if (resultado === 'falhou') {
        offerSaveFallback(uri);
      } else {
        onShared?.();
        onClose();
      }
    });

  const handleSalvar = () =>
    comImagem('fotos', async (uri) => {
      const salvou = await saveToGallery(uri);
      Alert.alert(
        salvou ? 'Imagem salva' : 'Não foi possível salvar',
        salvou
          ? 'A imagem está na sua galeria.'
          : 'Verifique a permissão de acesso à galeria nas configurações.',
      );
      if (salvou) {
        onShared?.();
        onClose();
      }
    });

  const handleInstagram = () =>
    comImagem('instagram', async (uri) => {
      // O Instagram não aceita legenda por intent (ver services/shareCard.ts).
      // Sem isto o post sai sem link e a atribuição se perde — por isso o texto
      // vai para a área de transferência antes de abrir o app.
      await Clipboard.setStringAsync(buildShareMessage(texto, link));

      const resultado = await shareToInstagram(uri);
      if (resultado === 'cancelado') return;
      if (resultado === 'falhou') {
        offerSaveFallback(uri);
        return;
      }

      Alert.alert(
        'Texto copiado',
        'O Instagram não aceita legenda pronta. Cole o texto na publicação — o link já está copiado.',
      );
      onShared?.();
      onClose();
    });

  const offerSaveFallback = (uri: string) => {
    Alert.alert(
      'Não conseguimos abrir o app',
      'Quer salvar a imagem na galeria para compartilhar do seu jeito?',
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Salvar imagem',
          onPress: async () => {
            const salvou = await saveToGallery(uri);
            if (salvou) onShared?.();
            Alert.alert(
              salvou ? 'Imagem salva' : 'Não foi possível salvar',
              salvou
                ? 'A imagem está na sua galeria.'
                : 'Verifique a permissão de acesso à galeria nas configurações.',
            );
          },
        },
      ],
    );
  };

  return (
    <>
      {/*
        Cópia em resolução cheia, fora da tela, que é o alvo da captura.
        `collapsable={false}` é obrigatório: sem ele o Android achata a View na
        hierarquia nativa e o view-shot não acha o que capturar.
      */}
      {visible && (
        <View
          style={[
            styles.offscreen,
            { width: CAPTURE_W, height: CAPTURE_H, left: -CAPTURE_W - 100 },
          ]}
          pointerEvents="none"
        >
          <View
            ref={captureRef}
            collapsable={false}
            style={{ width: CAPTURE_W, height: CAPTURE_H }}
          >
            <ShareCardTemplate
              width={CAPTURE_W}
              duracao={duracao}
              fundoId={fundoId}
            />
          </View>
        </View>
      )}

      {/*
        As ações vão dentro de `children`, não pelo prop `buttons` do Modal: a
        renderização de `buttons` está comentada em Modal.tsx (há um TODO de
        migrar para o componente Button comum), então passar o prop compila,
        tipa certo e não desenha nada. As outras telas do app já resolvem assim.
      */}
      <Modal
        visible={visible}
        onClose={onClose}
        size="bigger"
        title="Compartilhar sua conquista"
      >
        <View style={styles.content}>
          {/*
            Os três fundos lado a lado. O slot tem tamanho fixo e o card não
            selecionado encolhe por `transform: scale`, não por largura menor —
            assim a fileira não muda de altura ao trocar de opção.
          */}
          <View style={styles.cardsRow} accessibilityRole="radiogroup">
            {FUNDO_IDS.map((id) => {
              const selecionado = fundoId === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setFundoId(id)}
                  disabled={ocupado}
                  activeOpacity={0.9}
                  accessibilityRole="radio"
                  accessibilityLabel={`Fundo ${NOME_DO_FUNDO[id]}`}
                  accessibilityState={{ selected: selecionado }}
                  style={[
                    styles.cardSlot,
                    {
                      borderColor: selecionado ? COR_SELECAO : 'transparent',
                      transform: [{ scale: selecionado ? 1 : 0.88 }],
                      opacity: selecionado ? 1 : 0.55,
                    },
                  ]}
                >
                  <View style={styles.cardClip}>
                    <ShareCardTemplate
                      width={cardW}
                      duracao={duracao}
                      fundoId={id}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.swatches}>
            {FUNDO_IDS.map((id) => {
              const selecionado = fundoId === id;
              return (
                <TouchableOpacity
                  key={id}
                  onPress={() => setFundoId(id)}
                  disabled={ocupado}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityLabel={`Fundo ${NOME_DO_FUNDO[id]}`}
                  accessibilityState={{ selected: selecionado }}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: COR_DO_FUNDO[id],
                      borderColor: selecionado ? COR_SELECAO : 'rgba(255,255,255,0.18)',
                      borderWidth: selecionado ? 3 : 1,
                    },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.destinos}>
            <DestinoButton
              icone="whatsapp"
              label="WhatsApp"
              onPress={handleWhatsApp}
              carregando={enviando === 'whatsapp'}
              desabilitado={ocupado}
            />
            <DestinoButton
              icone="tray-arrow-down"
              label="Salvar"
              onPress={handleSalvar}
              carregando={enviando === 'fotos'}
              desabilitado={ocupado}
            />
            <DestinoButton
              icone="instagram"
              label="Instagram"
              onPress={handleInstagram}
              carregando={enviando === 'instagram'}
              desabilitado={ocupado}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

/** Um destino da fileira: círculo com ícone e label embaixo. */
function DestinoButton({
  icone,
  label,
  onPress,
  carregando,
  desabilitado,
}: {
  icone: string;
  label: string;
  onPress: () => void;
  carregando: boolean;
  desabilitado: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.destino}
      onPress={onPress}
      disabled={desabilitado}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Compartilhar em ${label}`}
      accessibilityState={{ disabled: desabilitado, busy: carregando }}
    >
      <View
        style={[
          styles.destinoCirculo,
          // Só o botão tocado escurece; os outros ficam opacos normais para o
          // usuário entender que estão apenas esperando, não quebrados.
          desabilitado && !carregando && styles.destinoInativo,
        ]}
      >
        {carregando ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <MaterialCommunityIcons name={icone} size={26} color="#FFFFFF" />
        )}
      </View>
      <Text style={styles.destinoLabel} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Fora da área visível, mas ainda montado e medido — é o que o view-shot
  // precisa. O deslocamento é a própria largura do card, e não um -99999
  // arbitrário: basta para sair da tela e não força o Yoga a medir com um
  // espaço disponível absurdo.
  offscreen: {
    position: 'absolute',
    top: 0,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: GAP,
    marginBottom: 18,
  },
  // A borda existe sempre, só muda de cor: com `borderWidth: 0` no não
  // selecionado o card deslocaria 2px ao trocar a seleção.
  cardSlot: {
    borderWidth: RING,
    borderRadius: 14,
    padding: 2,
  },
  cardClip: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  swatches: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 22,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  destinos: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 28,
    marginTop: 24,
  },
  destino: {
    alignItems: 'center',
    width: 72,
  },
  destinoCirculo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: '#373344',
    marginBottom: 8,
  },
  destinoInativo: {
    opacity: 0.4,
  },
  destinoLabel: {
    color: '#A09CAB',
    fontSize: 12,
    fontWeight: '500',
  },
});
