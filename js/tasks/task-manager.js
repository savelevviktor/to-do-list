/** Управление задачами: добавление, удаление, переключение, фильтр и поиск. */
export class TaskManager {
  static FILTERS = {
    all: () => true,
    active: (t) => !t.completed,
    completed: (t) => t.completed,
  };

  filter = 'all';
  query = '';
  #listeners = new Set();

  constructor(service) {
    this.service = service;
    this.tasks = service.getAll();
  }

  /** Подписка на изменения состояния (паттерн Observer). */
  subscribe(fn) { this.#listeners.add(fn); return () => this.#listeners.delete(fn); }

  addTask(title) {
    this.tasks = [this.service.create(title), ...this.tasks];
    this.#commit();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.#commit();
  }

  toggleTask(id) {
    this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    this.#commit();
  }

  editTask(id, title) {
    this.tasks = this.tasks.map((t) => (t.id === id ? { ...t, title: title.trim() } : t));
    this.#commit();
  }

  clearCompleted() {
    this.tasks = this.tasks.filter((t) => !t.completed);
    this.#commit();
  }

  setFilter(filter) {
    if (!(filter in TaskManager.FILTERS)) return;
    this.filter = filter;
    this.#notify();
  }

  setQuery(query) {
    this.query = query.trim().toLowerCase();
    this.#notify();
  }

  get visibleTasks() {
    return this.tasks.filter(
      (t) => TaskManager.FILTERS[this.filter](t) && t.title.toLowerCase().includes(this.query),
    );
  }

  get stats() {
    const done = this.tasks.filter((t) => t.completed).length;
    return { total: this.tasks.length, done, active: this.tasks.length - done };
  }

  #commit() {
    this.service.save(this.tasks);
    this.#notify();
  }

  #notify() { this.#listeners.forEach((fn) => fn(this)); }
}
