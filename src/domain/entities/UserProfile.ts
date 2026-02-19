/**
 * Perfil do usuário retornado por GET /users/:id (espelha UserResponse do backend).
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  cellphone: string;
  betcoins: number;
  ranking_points: number;
  gambler: boolean;
}
