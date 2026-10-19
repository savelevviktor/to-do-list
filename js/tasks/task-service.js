import { uid } from '../utils/helpers.js';

/** Репозиторий: хранение задач конкретного пользователя. Без бизнес-логики и UI. */
export class TaskService {
  constructor(storage, userId) {
    this.storage = storage;
    this.key = `tasks:${userId}`;
  }

  getAll() { return this.storage.get(this.key, []); }

  save(tasks) { this.storage.set(this.key, tasks); }

  create(title) {
    return { id: uid(), title: title.trim(), completed: false, createdAt: Date.now() };
  }
}
