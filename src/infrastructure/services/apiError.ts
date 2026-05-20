/**
 * Converte erros Axios em mensagens amigáveis.
 *
 * Contexto: React Native (Android) reporta timeouts do Axios como ERR_NETWORK
 * em vez de ECONNABORTED — comportamento diferente do browser.
 * Railway (free tier) pode demorar 30–60 s para cold start.
 */
export function resolveNetworkErrorMessage(error: any): string {
  // Sem resposta HTTP — erro de transporte/rede
  if (!error.response) {
    const isTimeout =
      error.code === 'ECONNABORTED' ||
      error.message?.includes('timeout') ||
      error.message?.includes('Timeout');

    if (isTimeout) {
      return 'O servidor demorou para responder. Aguarde um instante e tente novamente.';
    }

    // ERR_NETWORK no Android pode ser timeout mascarado OU servidor inacessível
    return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
  }

  const status: number = error.response.status;
  const responseMessage: string | undefined = error.response.data?.message;

  // Railway retorna 404 "Application not found" quando o serviço está fora do ar
  if (status === 404 && responseMessage === 'Application not found') {
    return 'Servidor em manutenção. Tente novamente em instantes.';
  }

  if (status === 400 || status === 401) {
    return 'Email ou senha inválidos.';
  }
  if (status === 404) {
    return 'Endpoint não encontrado. Verifique a configuração.';
  }
  if (status === 500) {
    return 'Erro interno no servidor. Tente novamente mais tarde.';
  }
  if (status === 503) {
    return 'Serviço temporariamente indisponível.';
  }

  return `Erro ao processar a solicitação (${status}). Tente novamente.`;
}
