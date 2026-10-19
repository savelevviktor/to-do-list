import { uid, hashPassword } from '../utils/helpers.js';

export class AuthError extends Error {}

/** Только логика авторизации: пользователи и сессия. */
export class AuthService {
  constructor(storage) {
    this.storage = storage;
  }

  get #users() { return this.storage.get('users', []); }

  async register({ name, email, password }) {
    const normalized = email.trim().toLowerCase();
    if (this.#users.some((u) => u.email === normalized)) {
      throw new AuthError('Пользователь с таким email уже существует');
    }
    const salt = uid();
    const user = {
      id: uid(), name: name.trim(), email: normalized,
      salt, passwordHash: await hashPassword(password, salt), createdAt: Date.now(),
    };
    this.storage.set('users', [...this.#users, user]);
    this.#startSession(user);
    return this.#publicUser(user);
  }

  async login({ email, password }) {
    const user = this.#users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.passwordHash !== (await hashPassword(password, user.salt))) {
      throw new AuthError('Неверный email или пароль');
    }
    this.#startSession(user);
    return this.#publicUser(user);
  }

  logout() {
    this.storage.remove('session');
  }

  /** Восстановление сессии после перезагрузки страницы. */
  getCurrentUser() {
    const session = this.storage.get('session');
    const user = session && this.#users.find((u) => u.id === session.userId);
    return user ? this.#publicUser(user) : null;
  }

  #startSession(user) {
    this.storage.set('session', { userId: user.id, startedAt: Date.now() });
  }

  #publicUser({ id, name, email }) {
    return { id, name, email };
  }
}
