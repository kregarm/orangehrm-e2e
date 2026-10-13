/**
 * Assignable user roles (ohrm_user_role.name where is_assignable = 1). The
 * other predefined roles (Supervisor, HiringManager, Interviewer, ...) are
 * not assigned; OrangeHRM derives them from data, e.g. being a vacancy's
 * hiring manager.
 */
export const UserRole = {
  Admin: 'Admin',
  ESS: 'ESS',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** ohrm_user_role.id of each assignable role (predefined by the installer) */
const roleIds: Record<UserRole, number> = {
  [UserRole.Admin]: 1,
  [UserRole.ESS]: 2,
};

/**
 * A login-capable user of the app. Instances live in ./index.ts; pass one
 * wherever credentials are needed (UI login, api.session.loginAs, ...).
 */
export class User {
  constructor(
    readonly username: string,
    readonly password: string,
    readonly fullName: string,
    readonly role: UserRole,
  ) {}

  /** userRoleId for POST /api/v2/admin/users */
  get roleId(): number {
    return roleIds[this.role];
  }

  get isAdmin(): boolean {
    return this.role === UserRole.Admin;
  }

  get firstName(): string {
    return this.fullName.split(' ')[0];
  }

  get lastName(): string {
    return this.fullName.split(' ').slice(1).join(' ');
  }
}
