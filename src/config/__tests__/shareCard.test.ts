import { buildShareText } from '../shareCard';

describe('buildShareText', () => {
  it('usa os três componentes da consulta, não só os dias', () => {
    const texto = buildShareText({ days: 6, hours: 5, minutes: 28 });

    expect(texto).toContain('6 dias');
    expect(texto).toContain('5 horas');
    expect(texto).toContain('28 min');
  });

  it('mantém os três componentes mesmo zerados, logo após um reset', () => {
    const texto = buildShareText({ days: 0, hours: 0, minutes: 0 });

    expect(texto).toContain('0 dias');
    expect(texto).toContain('0 horas');
    expect(texto).toContain('0 min');
  });

  it('concorda no singular', () => {
    const texto = buildShareText({ days: 1, hours: 1, minutes: 1 });

    expect(texto).toContain('1 dia');
    expect(texto).toContain('1 hora');
  });
});
