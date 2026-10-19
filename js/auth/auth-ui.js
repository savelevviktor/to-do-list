import { $, $$ } from '../utils/helpers.js';
import { validators, validate } from '../utils/validators.js';
import { AuthError } from './auth-service.js';

/** Форма входа/регистрации: события, валидация, показ ошибок. */
export class AuthUI {
  constructor(authService, { onAuth }) {
    this.auth = authService;
    this.onAuth = onAuth;
    this.root = $('#auth-view');
    this.forms = {
      login: $('#login-form'),
      register: $('#register-form'),
    };
    this.rules = {
      login: { email: validators.email, password: validators.required },
      register: {
        name: validators.name,
        email: validators.email,
        password: validators.password,
        confirm: (v, all) => (v !== all.password ? 'Пароли не совпадают' : ''),
      },
    };
    this.#bind();
  }

  show() { this.root.hidden = false; }
  hide() { this.root.hidden = true; }

  #bind() {
    // делегирование для вкладок
    $('.tabs', this.root).addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (tab) this.#switchTab(tab.dataset.tab);
    });
    for (const [kind, form] of Object.entries(this.forms)) {
      form.addEventListener('submit', (e) => this.#submit(e, kind));
      // убираем ошибку поля при вводе
      form.addEventListener('input', (e) => this.#setFieldError(form, e.target.name, ''));
    }
  }

  #switchTab(name) {
    $$('.tab', this.root).forEach((t) => t.classList.toggle('is-active', t.dataset.tab === name));
    for (const [kind, form] of Object.entries(this.forms)) form.hidden = kind !== name;
  }

  async #submit(event, kind) {
    event.preventDefault();
    const form = this.forms[kind];
    const values = Object.fromEntries(new FormData(form));
    $('[data-form-error]', form).textContent = '';

    const errors = validate(values, this.rules[kind]);
    for (const el of form.elements) if (el.name) this.#setFieldError(form, el.name, errors[el.name] || '');
    if (Object.keys(errors).length) return;

    try {
      const user = await this.auth[kind](values);
      form.reset();
      this.onAuth(user);
    } catch (err) {
      if (!(err instanceof AuthError)) console.error(err);
      $('[data-form-error]', form).textContent = err instanceof AuthError ? err.message : 'Что-то пошло не так';
    }
  }

  #setFieldError(form, name, message) {
    const out = $(`[data-error-for="${name}"]`, form);
    const input = form.elements[name];
    if (out) out.textContent = message;
    if (input) input.classList.toggle('is-invalid', Boolean(message));
  }
}
