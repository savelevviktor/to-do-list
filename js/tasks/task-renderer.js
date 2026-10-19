import { $, escapeHtml, formatDate, pluralize } from '../utils/helpers.js';

/** Только отображение. Не знает о хранилище и бизнес-правилах. */
export class TaskRenderer {
  constructor() {
    this.list = $('#task-list');
    this.counter = $('#task-counter');
    this.clearBtn = $('#clear-completed');
    this.filters = $('#filters');
  }

  render(manager) {
    const tasks = manager.visibleTasks;
    this.list.innerHTML = tasks.length
      ? tasks.map((t) => this.renderTaskItem(t, manager.query)).join('')
      : `<li class="empty">${this.#emptyText(manager)}</li>`;

    const { active, done } = manager.stats;
    this.counter.textContent =
      `Осталось: ${active} ${pluralize(active, ['задача', 'задачи', 'задач'])}`;
    this.clearBtn.hidden = done === 0;
    this.filters.querySelectorAll('[data-filter]').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.filter === manager.filter));
  }

  renderTaskItem(task, query = '') {
    return `
      <li class="task ${task.completed ? 'is-done' : ''}" data-id="${task.id}">
        <input class="task__check" type="checkbox" data-action="toggle" ${task.completed ? 'checked' : ''}
          aria-label="Выполнено">
        <div class="task__body">
          <span class="task__title" data-action="edit" title="Двойной клик — редактировать">${this.#highlight(task.title, query)}</span>
          <time class="task__date">${formatDate(task.createdAt)}</time>
        </div>
        <button class="task__delete" data-action="delete" type="button" aria-label="Удалить">✕</button>
      </li>`;
  }

  /** Превращает заголовок в поле ввода; возвращает input. */
  startEdit(li, title) {
    const span = $('.task__title', li);
    const input = Object.assign(document.createElement('input'), {
      type: 'text', value: title, className: 'task__edit', maxLength: 200,
    });
    span.replaceWith(input);
    input.focus();
    input.select();
    return input;
  }

  #highlight(title, query) {
    const safe = escapeHtml(title);
    if (!query) return safe;
    const q = escapeHtml(query).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(`(${q})`, 'gi'), '<mark>$1</mark>');
  }

  #emptyText({ tasks, query }) {
    if (!tasks.length) return 'Задач пока нет. Добавьте первую!';
    return query ? 'Ничего не найдено' : 'В этой категории пусто';
  }
}
