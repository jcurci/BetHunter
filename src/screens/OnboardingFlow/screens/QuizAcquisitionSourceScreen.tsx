import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useOnboarding } from '../OnboardingContext';
import { quizStyles } from './quizStyles';
import { OnboardingLayout } from './OnboardingLayout';
import { OnboardingChip } from './OnboardingChip';
import { QuizContinueButton } from './QuizContinueButton';
import { Container } from '../../../infrastructure/di/Container';

const OPTIONS = [
  { id: 'instagram', label: 'Instagram', icon: 'instagram' },
  // MaterialCommunityIcons não tem glifo de TikTok (só FontAwesome5/6, sem
  // precedente de font-linking neste app).
  { id: 'tiktok', label: 'TikTok', icon: 'music-note' },
  { id: 'youtube', label: 'YouTube', icon: 'youtube' },
  { id: 'google', label: 'Busca no Google', icon: 'google' },
  { id: 'indicacao', label: 'Indicação de alguém', icon: 'account-heart-outline' },
  { id: 'grupo', label: 'Grupo ou comunidade', icon: 'account-group-outline' },
  { id: 'anuncio', label: 'Anúncio', icon: 'bullhorn-outline' },
  { id: 'podcast', label: 'Podcast ou notícia', icon: 'podcast' },
  { id: 'loja', label: 'Loja de apps', icon: 'store-outline' },
  { id: 'outro', label: 'Outro', icon: 'dots-horizontal' },
];

type Props = {
  currentStep: number;
  totalSteps: number;
  quizStep: number;
  quizTotal: number;
  onNext: () => void;
  onBack: () => void;
};

export const QuizAcquisitionSourceScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  quizStep,
  quizTotal,
  onNext,
  onBack,
}) => {
  const { answers, setAnswer, setAcquisitionSourceSynced } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(answers.acquisitionSource);
  const [otherText, setOtherText] = useState(answers.acquisitionSourceOther ?? '');

  const isOther = selected === 'outro';
  const canContinue = !!selected && (!isOther || otherText.trim().length > 0);

  const submit = (source: string, other: string | null) => {
    setAnswer('acquisitionSource', source);
    setAnswer('acquisitionSourceOther', other ?? '');

    // Fire-and-forget: nunca bloqueia a navegação e nunca mostra erro. A resposta
    // já está no rascunho do AsyncStorage, e a CelebrationScreen re-tenta se
    // este envio falhar (usuário offline, por exemplo).
    Container.getInstance()
      .getSubmitAcquisitionSourceUseCase()
      .execute({ source, sourceOther: other })
      .then(() => setAcquisitionSourceSynced(true))
      .catch((error) =>
        console.warn('[ONBOARDING] Falha ao registrar origem', error),
      );

    onNext();
  };

  const handleContinue = () => {
    if (canContinue && selected) {
      submit(selected, isOther ? otherText.trim() : null);
    }
  };

  const handleSkip = () => submit('nao_informado', null);

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      stepLabel={`${quizStep} de ${quizTotal} — Origem`}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={quizStyles.title}>Onde você nos conheceu?</Text>
          <Text style={quizStyles.subtitle}>
            Isso nos ajuda a levar o BetHunter para mais gente como você.
          </Text>

          <View style={quizStyles.chipGrid}>
            {OPTIONS.map((opt, i) => (
              <OnboardingChip
                key={opt.id}
                label={opt.label}
                isSelected={selected === opt.id}
                onPress={() =>
                  setSelected((prev) => (prev === opt.id ? null : opt.id))
                }
                index={i}
                groupOffset={80}
                compact
                pressScaleTo={0.975}
                icon={
                  <MaterialCommunityIcons
                    name={opt.icon}
                    size={16}
                    color={selected === opt.id ? '#FFFFFF' : '#A09BAE'}
                  />
                }
              />
            ))}
          </View>

          {isOther && (
            <TextInput
              style={quizStyles.otherInput}
              value={otherText}
              onChangeText={setOtherText}
              maxLength={60}
              placeholder="Conte pra gente de onde você veio"
              placeholderTextColor="#6F6A80"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[quizStyles.bottomBar, quizStyles.bottomBarRow]}>
        <TouchableOpacity
          onPress={handleSkip}
          style={quizStyles.skipLink}
          activeOpacity={0.7}
        >
          <Text style={quizStyles.skipLinkText}>Prefiro não dizer</Text>
        </TouchableOpacity>

        {/* QuizContinueButton não tem flex na raiz — sem o wrapper ele colapsa
            na largura do texto. */}
        <View style={{ flex: 1 }}>
          <QuizContinueButton enabled={canContinue} onPress={handleContinue} />
        </View>
      </View>
    </OnboardingLayout>
  );
};
