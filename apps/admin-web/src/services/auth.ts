const STORAGE_KEY = 'cocktail_admin_token';

export function getAccessToken() {
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(STORAGE_KEY, token);
}

export function clearAuth() {
  window.localStorage.removeItem(STORAGE_KEY);
}
