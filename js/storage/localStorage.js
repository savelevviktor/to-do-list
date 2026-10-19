/** Тонкая обёртка над localStorage с JSON и защитой от ошибок. */
export class Storage {
  constructor(prefix = 'todo-app:') {
    this.prefix = prefix;
  }

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('Storage write failed', err);
      return false;
    }
  }

  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }
}
