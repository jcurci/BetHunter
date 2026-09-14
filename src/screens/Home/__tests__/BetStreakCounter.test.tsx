import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

import BetStreakCounter from '../BetStreakCounter';

const noop = () => {};

describe('BetStreakCounter', () => {
  it('mostra somente os dias — horas e minutos não aparecem na tela principal', () => {
    // A API devolve {days: 6, hours: 5, minutes: 28}; a Home mostra só o 6.
    render(<BetStreakCounter days={6} statsReady onPress={noop} />);

    expect(screen.getAllByText('6').length).toBeGreaterThan(0);
    expect(screen.getAllByText(' dias').length).toBeGreaterThan(0);
    expect(screen.queryByText(/hora/i)).toBeNull();
    expect(screen.queryByText(/min/i)).toBeNull();
    expect(screen.queryByText('5')).toBeNull();
    expect(screen.queryByText('28')).toBeNull();
  });

  it('exibe o número exato do backend, sem somar um dia', () => {
    render(<BetStreakCounter days={6} statsReady onPress={noop} />);

    expect(screen.queryByText('7')).toBeNull();
  });

  it('mostra zero dias após o reset, não um', () => {
    render(<BetStreakCounter days={0} statsReady onPress={noop} />);

    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    expect(screen.getAllByText(' dias').length).toBeGreaterThan(0);
    expect(screen.queryByText('1')).toBeNull();
  });

  it('usa o singular no primeiro dia', () => {
    render(<BetStreakCounter days={1} statsReady onPress={noop} />);

    expect(screen.getAllByText(' dia').length).toBeGreaterThan(0);
  });

  it('mostra o skeleton enquanto carrega, nunca um zero enganoso', () => {
    render(<BetStreakCounter days={0} statsReady={false} onPress={noop} />);

    expect(screen.getByTestId('bet-streak-skeleton')).toBeTruthy();
    expect(screen.queryByText('0')).toBeNull();
  });

  it('o toque leva à confirmação de reset', () => {
    const onPress = jest.fn();
    render(<BetStreakCounter days={6} statsReady onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('não dispara nada enquanto os dados não chegaram', () => {
    const onPress = jest.fn();
    render(<BetStreakCounter days={0} statsReady={false} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
