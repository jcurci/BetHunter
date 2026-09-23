/**
 * Primeiro nome para a saudação da Home.
 *
 * "Jhon Doe" → "Jhon"; "Fernando De Lima Magalhães" → "Fernando".
 * Nome vazio/ausente cai no fallback — nunca exibe o username.
 */
export function getFirstName(fullName: string | null | undefined, fallback = "Usuário"): string {
  const first = fullName?.trim().split(/\s+/)[0];
  return first ? first : fallback;
}

/** Iniciais para o avatar ("Jhon Doe" → "JD"). */
export function getInitials(fullName: string | null | undefined): string {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}
