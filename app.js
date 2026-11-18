(() => {
  'use strict';

  const STORAGE_KEY = 'daylist.tasks.v1';
  const form = document.querySelector('#task-form');
  const input = document.querySelector('#task-input');
  const list = document.querySelector('#task-list');
  const count = document.querySelector('#task-count');
  const remaining = document.querySelector('#remaining-count');
  const emptyState = document.querySelector('#empty-state');
  const clearCompletedButton = document.querySelector('#clear-completed');
  const storageMessage = document.querySelector('#storage-message');
  const filterButtons = [...document.querySelectorAll('.filter-button')];
  let tasks = loadTasks();
  let activeFilter = 'all';
  let storageAvailable = true;

  function loadTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((task) => task && typeof task.id === 'string' && typeof task.text === 'string')
        .map((task) => ({ id: task.id, text: task.text, completed: Boolean(task.completed), createdAt: Number(task.createdAt) || Date.now() }));
    } catch (error) {
      storageAvailable = false;
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      storageAvailable = true;
    } catch (error) {
      storageAvailable = false;
    }
    storageMessage.hidden = storageAvailable;
  }

  function makeId() {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function render() {
    const visibleTasks = tasks.filter((task) => {
      if (activeFilter === 'active') return !task.completed;
      if (activeFilter === 'completed') return task.completed;
      return true;
    });

    list.replaceChildren();
    visibleTasks.forEach((task) => {
      const row = document.createElement('li');
      row.className = `task-row${task.completed ? ' completed' : ''}`;
      row.dataset.id = task.id;

      const checkbox = document.createElement('input');
      checkbox.className = 'task-check';
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', `${task.completed ? 'Mark' : 'Complete'}: ${task.text}`);
      checkbox.dataset.action = 'toggle';

      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;

      const remove = document.createElement('button');
      remove.className = 'delete-button';
      remove.type = 'button';
      remove.setAttribute('aria-label', `Delete: ${task.text}`);
      remove.title = 'Delete task';
      remove.dataset.action = 'delete';
      remove.textContent = '×';

      row.append(checkbox, text, remove);
      list.append(row);
    });

    const left = tasks.filter((task) => !task.completed).length;
    count.textContent = String(tasks.length);
    remaining.textContent = `${left} ${left === 1 ? 'task' : 'tasks'} left`;
    emptyState.classList.toggle('visible', visibleTasks.length === 0);
    emptyState.querySelector('.empty-title').textContent = tasks.length === 0
      ? 'Nothing on the list yet'
      : activeFilter === 'active' ? 'You’re all caught up' : 'No completed tasks yet';
    emptyState.querySelector('.empty-copy').textContent = tasks.length === 0
      ? 'Add your first task above and get started.'
      : activeFilter === 'active' ? 'Enjoy the breathing room, or add another task.' : 'Completed tasks will show up here.';
    clearCompletedButton.disabled = !tasks.some((task) => task.completed);
    clearCompletedButton.style.opacity = clearCompletedButton.disabled ? '.5' : '1';
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    tasks.unshift({ id: makeId(), text, completed: false, createdAt: Date.now() });
    saveTasks();
    activeFilter = 'all';
    setActiveFilterButton();
    render();
    form.reset();
    input.focus();
  });

  list.addEventListener('change', (event) => {
    const checkbox = event.target.closest('[data-action="toggle"]');
    if (!checkbox) return;
    const row = checkbox.closest('[data-id]');
    const task = tasks.find((item) => item.id === row?.dataset.id);
    if (!task) return;
    task.completed = checkbox.checked;
    saveTasks();
    render();
  });

  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="delete"]');
    if (!button) return;
    const row = button.closest('[data-id]');
    tasks = tasks.filter((task) => task.id !== row?.dataset.id);
    saveTasks();
    render();
  });

  function setActiveFilterButton() {
    filterButtons.forEach((button) => {
      const active = button.dataset.filter === activeFilter;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      setActiveFilterButton();
      render();
    });
  });

  clearCompletedButton.addEventListener('click', () => {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    render();
  });

  const todayLabel = document.querySelector('#today-label');
  todayLabel.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
  storageMessage.hidden = storageAvailable;
  render();
})();
