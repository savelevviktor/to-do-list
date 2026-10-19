import { Storage } from './storage/localStorage.js';
import { AuthService } from './auth/auth-service.js';
import { AuthUI } from './auth/auth-ui.js';
import { TaskService } from './tasks/task-service.js';
import { TaskManager } from './tasks/task-manager.js';
import { TaskRenderer } from './tasks/task-renderer.js';
import { $ } from './utils/helpers.js';
import { validators } from './utils/validators.js';

class App {
  constructor() {
    this.storage = new Storage();
    this.auth = new AuthService(this.storage);
    this.authUI = new AuthUI(this.auth, { onAuth: (user) => this.#enter(user) });
    this.renderer = new TaskRenderer();
    this.manager = null;

    this.#bindGlobalEvents();
    this.#initTheme();

    const user = this.auth.getCurrentUser();
    user ? this.#enter(user) : this.#leave();
  }

  #enter(user) {
    this.manager = new TaskManager(new TaskService(this.storage, user.id));
    this.manager.subscribe((m) => this.renderer.render(m));
    this.renderer.render(this.manager);

    $('#user-name').textContent = `👤 ${user.name}`;
    $('#search').value = '';
    this.#toggleView(true);
  }

  #leave() {
    this.manager = null;
    this.#toggleView(false);
  }

  #toggleView(loggedIn) {
    $('#tasks-view').hidden = !loggedIn;
    $('#user-name').hidden = !loggedIn;
    $('#logout-btn').hidden = !loggedIn;
    loggedIn ? this.authUI.hide() : this.authUI.show();
  }

  #bindGlobalEvents() {
    $('#logout-btn').addEventListener('click', () => { this.auth.logout(); this.#leave(); });
    $('#theme-toggle').addEventListener('click', () => this.#toggleTheme());

    $('#task-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = e.target.elements.title;
      const error = validators.taskTitle(input.value);
      $('#task-error').textContent = error;
      input.classList.toggle('is-invalid', Boolean(error));
      if (error) return;
      this.manager.addTask(input.value);
      e.target.reset();
      input.focus();
    });

    $('#search').addEventListener('input', (e) => this.manager?.setQuery(e.target.value));
    $('#filters').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (btn) this.manager.setFilter(btn.dataset.filter);
    });
    $('#clear-completed').addEventListener('click', () => this.manager.clearCompleted());

    // Делегирование событий для списка задач
    const list = $('#task-list');
    list.addEventListener('click', (e) => {
      const li = e.target.closest('.task');
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (!li || !action) return;
      const { id } = li.dataset;
      if (action === 'toggle') this.manager.toggleTask(id);
      if (action === 'delete') {
        e.stopPropagation();
        li.classList.add('is-removing');
        setTimeout(() => this.manager?.deleteTask(id), 180);
      }
    });
    list.addEventListener('dblclick', (e) => {
      const title = e.target.closest('[data-action="edit"]');
      const li = e.target.closest('.task');
      if (title && li) this.#edit(li);
    });
  }

  #edit(li) {
    const { id } = li.dataset;
    const task = this.manager.tasks.find((t) => t.id === id);
    const input = this.renderer.startEdit(li, task.title);
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      if (save && !validators.taskTitle(input.value)) this.manager.editTask(id, input.value);
      else this.renderer.render(this.manager);
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
  }

  #initTheme() {
    const saved = this.storage.get('theme');
    const dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }

  #toggleTheme() {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    this.storage.set('theme', next);
  }
}

new App();
