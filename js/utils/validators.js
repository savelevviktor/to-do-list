const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Каждый валидатор возвращает строку ошибки или '' если всё хорошо. */
export const validators = {
  name: (v) => (v.trim().length < 2 ? 'Имя — минимум 2 символа' : ''),
  email: (v) => (!EMAIL_RE.test(v.trim()) ? 'Введите корректный email' : ''),
  password: (v) =>
    v.length < 6 ? 'Пароль — минимум 6 символов'
      : !/\d/.test(v) || !/[a-zA-Zа-яА-Я]/.test(v) ? 'Пароль должен содержать буквы и цифры' : '',
  required: (v) => (!v ? 'Обязательное поле' : ''),
  taskTitle: (v) => (!v.trim() ? 'Введите название задачи' : v.length > 200 ? 'Максимум 200 символов' : ''),
};

/** Валидация набора полей: rules = { field: (value, all) => string } */
export function validate(values, rules) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const msg = rule(values[field] ?? '', values);
    if (msg) errors[field] = msg;
  }
  return errors;
}
