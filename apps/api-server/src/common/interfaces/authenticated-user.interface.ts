export interface AuthenticatedUser {
  userId: number;
  username: string;
  displayName: string;
  roleCode: 'admin' | 'staff' | 'customer';
}
