import { StyleSheet } from 'react-native';

export const quizStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#2A2435',
    marginBottom: 16,
  },
  progressBarFill: {
    backgroundColor: '#D783D8',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  stepIndicator: {
    color: '#8A8595',
    fontSize: 13,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#16141F',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2B2737',
  },
  question: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    lineHeight: 26,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B2A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#2B2737',
  },
  optionSelected: {
    borderColor: '#7456C8',
    backgroundColor: '#231D35',
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#444',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: '#7456C8',
    backgroundColor: '#7456C8',
  },
  optionText: {
    fontSize: 15,
    color: '#C7C3D1',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomBar: {
    paddingBottom: 36,
    paddingTop: 16,
  },
  gradientButton: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientButtonDisabled: {
    opacity: 0.35,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#1E1B2A',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#2B2737',
  },
  chipSelected: {
    borderColor: '#7456C8',
    backgroundColor: '#231D35',
  },
  chipText: {
    fontSize: 14,
    color: '#C7C3D1',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  subQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 12,
  },
});
