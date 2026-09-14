import fs from 'fs';
import path from 'path';

/**
 * Guard de regressão do fim do check-in diário.
 *
 * O contador agora é calculado pelo backend a partir de `bet_free_since_at`. Se
 * qualquer um destes símbolos voltar ao código, o app voltou a participar da
 * conta — seja chamando uma rota que não existe mais, seja mantendo um contador
 * paralelo que diverge do servidor.
 */
const PROIBIDOS = [
  'canCheckIn',
  'nextCheckInAt',
  'BetCheckInUseCase',
  'BetCheckInStatus',
  'BetCheckInResult',
  'updateAfterCheckIn',
  'getGetBetStreakStatusUseCase',
  'MOCK_SHARE_CARD',
];

const SRC = path.resolve(__dirname, '..');

/**
 * O guard olha código, não prosa. Sem isso um comentário que **explica** por que
 * um campo antigo foi descartado seria lido como o campo tendo voltado.
 */
function semComentarios(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

function arquivosDeCodigo(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' ? [] : arquivosDeCodigo(full);
    }
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

describe('o fluxo de check-in não voltou', () => {
  const arquivos = arquivosDeCodigo(SRC);

  it('encontra código para varrer', () => {
    expect(arquivos.length).toBeGreaterThan(50);
  });

  it.each(PROIBIDOS)('nenhum arquivo menciona %s', (termo) => {
    const culpados = arquivos.filter((f) =>
      semComentarios(fs.readFileSync(f, 'utf8')).includes(termo),
    );

    expect(culpados.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  it('a rota consultada é /users/bet-streak', () => {
    const api = fs.readFileSync(
      path.join(SRC, 'infrastructure/services/BetStreak.api.ts'),
      'utf8',
    );

    expect(api).toContain("'/users/bet-streak'");
    expect(api).toContain("'/users/bet-reset'");
  });

  /**
   * A rota antiga sobrevive só como leitura de emergência, num arquivo só. Se
   * ela reaparecer em qualquer outro lugar, o fluxo de check-in está voltando.
   */
  it('a rota antiga só é citada pela camada de API', () => {
    const culpados = arquivos.filter(
      (f) =>
        semComentarios(fs.readFileSync(f, 'utf8')).includes('bet-checkin') &&
        path.relative(SRC, f) !== 'infrastructure/services/BetStreak.api.ts',
    );

    expect(culpados.map((f) => path.relative(SRC, f))).toEqual([]);
  });

  it('a rota antiga nunca é usada para escrever', () => {
    const api = fs.readFileSync(
      path.join(SRC, 'infrastructure/services/BetStreak.api.ts'),
      'utf8',
    );

    // O check-in era um POST. Aqui a rota velha só pode aparecer em leitura.
    expect(api).not.toMatch(/post\([^)]*bet-checkin/);
  });
});
