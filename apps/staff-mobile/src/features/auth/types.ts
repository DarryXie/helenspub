import type { RoleCode, UserSummary } from '@cocktail/shared-types';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: UserSummary & {
    roleName: string;
  };
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: {
    id: number;
    username: string;
    displayName: string;
    role: {
      id: number;
      code: RoleCode;
      name: string;
    };
  };
}

export interface CurrentUserResponse {
  id: number;
  username: string;
  displayName: string;
  role: {
    id: number;
    code: RoleCode;
    name: string;
  };
  status: string;
}
