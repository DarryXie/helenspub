import type { UserSummary } from '@cocktail/shared-types';
import type { AuthSession, CurrentUserResponse, LoginPayload, LoginResponse } from '../features/auth/types';
import { apiRequest } from './http';

function toUserSummary(user: LoginResponse['user'] | CurrentUserResponse): UserSummary & { roleName: string } {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    roleCode: user.role.code,
    roleName: user.role.name,
  };
}

export async function loginWithPassword(payload: LoginPayload) {
  const response = await apiRequest<LoginResponse>('/app/auth/login', {
    auth: false,
    body: JSON.stringify(payload),
    method: 'POST',
  });

  const session: AuthSession = {
    accessToken: response.accessToken,
    tokenType: response.tokenType,
    expiresIn: response.expiresIn,
    user: toUserSummary(response.user),
  };

  return session;
}

export function fetchCurrentUser() {
  return apiRequest<CurrentUserResponse>('/app/auth/me');
}

export function logoutRequest() {
  return apiRequest<{ success: boolean }>('/app/auth/logout', {
    method: 'POST',
  });
}
