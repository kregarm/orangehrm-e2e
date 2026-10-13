import {User, UserRole} from './User';

/**
 * Users known to the functional tests, ported from
 * cypress/fixtures/user.json. Only `admin` exists after db.reset(); create
 * the others with `api.users.ensure(users.john)` in the spec that uses them.
 * Usernames must be at least 5 characters, hence JohnP / MikeC rather than
 * Cypress' John / Mike.
 */
export const users = {
  admin: new User(
    'Admin',
    'Jacqueline@OHRM123',
    'Jacqueline White',
    UserRole.Admin,
  ),
  john: new User('JohnP', 'John@OHRM123', 'John Perera', UserRole.ESS),
  mike: new User('MikeC', 'Mike@OHRM123', 'Mike Combas', UserRole.ESS),
} as const;

export type UserKey = keyof typeof users;

export {User, UserRole};
