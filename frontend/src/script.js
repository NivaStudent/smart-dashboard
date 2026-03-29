// ==================== Хранилище данных ====================
let tasks = [];
let habits = [];
let notes = [];
let user = {
    name: 'Иван',
    points: 0
};

// Предустановленные привычки
const DEFAULT_HABITS = [
    { id: 'habit_1', name: '💧 Выпить воду', category: 'Здоровье', points: 5 },
    { id: 'habit_2', name: '💊 Принять витамины', category: 'Здоровье', points: 10 },
    { id: 'habit_3', name: '🚶 Прогулка', category: 'Активность', points: 15 },
    { id: 'habit_4', name: '😴 Сон 8 часов', category: 'Здоровье', points: 10 },
    { id: 'habit_5', name: '🧘 Медитация', category: 'Ментальное', points: 15 }
];

// ==================== Инициализация ====================
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initDefaults();
    registerServiceWorker();
    initNavigation();
    initThemeToggle();
    updateOnlineStatus();
    loadModule('tracker');
});

function loadData() {
    const savedTasks = localStorage.getItem('smart_tasks');
    const savedHabits = localStorage.getItem('smart_habits');
    const savedNotes = localStorage.getItem('smart_notes');
    const savedUser = localStorage.getItem('smart_user');
    
    if (savedTasks) tasks = JSON.parse(savedTasks);
    if (savedHabits) habits = JSON.parse(savedHabits);
    if (savedNotes) notes = JSON.parse(savedNotes);
    if (savedUser) user = JSON.parse(savedUser);
}

function initDefaults() {
    if (habits.length === 0) {
        habits = DEFAULT_HABITS.map(h => ({
            ...h,
            completed: false,
            completedDate: null,
            streak: 0
        }));
        saveData();
    }
}

function saveData() {
    localStorage.setItem('smart_tasks', JSON.stringify(tasks));
    localStorage.setItem('smart_habits', JSON.stringify(habits));
    localStorage.setItem('smart_notes', JSON.stringify(notes));
    localStorage.setItem('smart_user', JSON.stringify(user));
    updatePointsDisplay();
}

function updatePointsDisplay() {
    const pointsSpan = document.getElementById('user-points');
    if (pointsSpan) pointsSpan.textContent = `🏆 ${user.points}`;
}

// ==================== PWA ====================
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('SW registered:', reg))
            .catch(err => console.error('SW failed:', err));
    }
}

// ==================== Тема ====================
function initThemeToggle() {
    const savedTheme = localStorage.getItem('theme');
    const toggleBtn = document.getElementById('theme-toggle');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleBtn.textContent = '☀️';
    }
    
    toggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            toggleBtn.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            toggleBtn.textContent = '☀️';
        }
    });
}

// ==================== Онлайн статус ====================
function updateOnlineStatus() {
    const statusSpan = document.getElementById('online-status');
    const syncSpan = document.getElementById('last-sync');
    
    const updateStatus = () => {
        if (navigator.onLine) {
            statusSpan.textContent = '● Онлайн';
            statusSpan.className = 'status-online';
            syncSpan.textContent = `Синхр.: ${new Date().toLocaleTimeString()}`;
        } else {
            statusSpan.textContent = '● Офлайн';
            statusSpan.className = 'status-offline';
        }
    };
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}

// ==================== Навигация ====================
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const route = btn.dataset.route;
            loadModule(route);
            document.querySelectorAll('.nav-btn').forEach(b => {
                b.dataset.active = 'false';
            });
            btn.dataset.active = 'true';
        });
    });
}

function loadModule(module) {
    const main = document.getElementById('app-main');
    switch(module) {
        case 'tracker': renderTracker(main); break;
        case 'tasks': renderTasks(main); break;
        case 'habits': renderHabits(main); break;
        case 'notes': renderNotes(main); break;
    }
}

// ==================== Трекер ====================
function renderTracker(container) {
    const today = new Date().toDateString();
    const completedHabits = habits.filter(h => h.completed && h.completedDate === today).length;
    const totalHabits = habits.length;
    const progress = totalHabits > 0 ? (completedHabits / totalHabits * 100) : 0;
    
    const completedTasks = tasks.filter(t => t.completed && t.completedDate === today).length;
    const totalTodayTasks = tasks.filter(t => !t.completed || t.completedDate === today).length;
    
    const weeklyData = getWeeklyActivity();
    const streak = calculateStreak();
    
    container.innerHTML = `
        <div class="tracker-module">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${user.points}</div>
                    <div class="stat-label">Всего баллов</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">🔥 ${streak}</div>
                    <div class="stat-label">Дней подряд</div>
                </div>
            </div>
            
            <div class="progress-section">
                <div class="progress-circle">
                    <div class="circle-bg"></div>
                    <div class="circle-progress" id="circle-progress"></div>
                    <div class="circle-inner">${Math.round(progress)}%</div>
                </div>
                <div class="progress-text">
                    ${completedHabits} из ${totalHabits} привычек выполнено
                </div>
            </div>
            
            <div class="chart-section">
                <h3>📈 Активность за неделю</h3>
                <div class="chart-bars" id="chart-bars"></div>
                <div class="chart-labels" id="chart-labels"></div>
            </div>
            
            <div class="mascot-card">
                <div class="mascot">🦊</div>
                <div class="mascot-message">${getMascotMessage(progress, streak)}</div>
            </div>
            
            <div class="achievements-section">
                <h3>🏅 Достижения</h3>
                <div class="achievements-list" id="achievements-list"></div>
            </div>
        </div>
    `;
    
    const circleProgress = document.getElementById('circle-progress');
    if (circleProgress) {
        circleProgress.style.background = `conic-gradient(var(--primary-color) ${progress * 3.6}deg, transparent 0deg)`;
    }
    
    renderChart(weeklyData);
    renderAchievements(streak, progress);
}

function getWeeklyActivity() {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        const habitCount = habits.filter(h => h.completed && h.completedDate === dateStr).length;
        const taskCount = tasks.filter(t => t.completed && t.completedDate === dateStr).length;
        
        let dayIndex = date.getDay();
        dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
        
        result.push({
            day: days[dayIndex],
            count: habitCount + taskCount,
            date: dateStr
        });
    }
    return result;
}

function renderChart(data) {
    const maxCount = Math.max(...data.map(d => d.count), 1);
    const barsContainer = document.getElementById('chart-bars');
    const labelsContainer = document.getElementById('chart-labels');
    
    if (!barsContainer || !labelsContainer) return;
    
    barsContainer.innerHTML = '';
    labelsContainer.innerHTML = '';
    
    data.forEach(item => {
        const height = (item.count / maxCount) * 120;
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        bar.style.height = `${Math.max(height, 8)}px`;
        bar.title = `${item.day}: ${item.count} действий`;
        barsContainer.appendChild(bar);
        
        const label = document.createElement('span');
        label.textContent = item.day;
        labelsContainer.appendChild(label);
    });
}

function calculateStreak() {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toDateString();
        
        const hasHabit = habits.some(h => h.completed && h.completedDate === dateStr);
        const hasTask = tasks.some(t => t.completed && t.completedDate === dateStr);
        
        if (hasHabit || hasTask) streak++;
        else if (i > 0) break;
    }
    return streak;
}

function getMascotMessage(progress, streak) {
    if (progress === 100) return '🎉 Поздравляю! Ты выполнил все привычки сегодня! Ты супер! ⭐';
    if (progress >= 75) return '🌟 Отлично! Осталось совсем немного, ты почти закончил!';
    if (progress >= 50) return '👍 Хороший прогресс! Продолжай в том же духе!';
    if (progress >= 25) return '💪 Ты на верном пути! Давай выполним еще несколько привычек!';
    if (streak > 0) return `🔥 У тебя ${streak}-дневный стрик! Не прерывай его!`;
    return '👋 Привет! Давай начнем с выполнения первой привычки!';
}

function renderAchievements(streak, progress) {
    const container = document.getElementById('achievements-list');
    if (!container) return;
    
    const achievements = [];
    if (streak >= 7) achievements.push('🏆 Мастер стрика (7 дней)');
    else if (streak >= 3) achievements.push('⭐ Начинающий стрик (3 дня)');
    if (progress === 100) achievements.push('🎯 Идеальный день');
    if (tasks.length >= 10) achievements.push('📋 10+ задач создано');
    if (user.points >= 100) achievements.push('💰 100+ баллов');
    if (habits.filter(h => h.completed).length >= 50) achievements.push('💪 50+ привычек выполнено');
    
    if (achievements.length === 0) {
        achievements.push('🌟 Выполняй привычки, чтобы получать достижения!');
    }
    
    container.innerHTML = achievements.map(a => `<span class="achievement-badge">${a}</span>`).join('');
}

function isToday(dateStr) {
    return dateStr === new Date().toDateString();
}

// ==================== Задачи ====================
function renderTasks(container) {
    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    
    container.innerHTML = `
        <div class="tasks-module">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>✅ Задачи</h2>
                <button class="btn-primary" id="add-task-btn">+ Добавить</button>
            </div>
            <div class="filter-buttons">
                <button class="filter-btn active" data-filter="all">Все</button>
                <button class="filter-btn" data-filter="active">Активные</button>
                <button class="filter-btn" data-filter="completed">Выполненные</button>
            </div>
            <div id="tasks-list"></div>
        </div>
    `;
    
    renderTasksList(activeTasks, completedTasks);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasksList(activeTasks, completedTasks);
        });
    });
    
    document.getElementById('add-task-btn').onclick = showAddTaskModal;
}

function renderTasksList(activeTasks, completedTasks) {
    const listContainer = document.getElementById('tasks-list');
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    
    let tasksToShow = [];
    if (activeFilter === 'active') tasksToShow = activeTasks;
    else if (activeFilter === 'completed') tasksToShow = completedTasks;
    else tasksToShow = [...activeTasks, ...completedTasks];
    
    if (tasksToShow.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">📭 Нет задач. Создайте первую задачу!</div>';
        return;
    }
    
    listContainer.innerHTML = tasksToShow.map(task => `
        <div class="task-card" data-id="${task.id}">
            <div class="task-checkbox">
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
            </div>
            <div class="task-content">
                <div class="task-title" style="${task.completed ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${escapeHtml(task.title)}</div>
                <div class="task-meta">${task.category || 'Без категории'}</div>
            </div>
            <div class="task-points">+${task.points || 10}</div>
            <div class="task-actions">
                <button onclick="editTask('${task.id}')">✏️</button>
                <button onclick="deleteTask('${task.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAddTaskModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>➕ Новая задача</h3>
            <input type="text" id="task-title" placeholder="Название задачи">
            <select id="task-category">
                <option value="Работа">💼 Работа</option>
                <option value="Учеба">📚 Учеба</option>
                <option value="Дом">🏠 Дом</option>
                <option value="Личное">❤️ Личное</option>
            </select>
            <input type="number" id="task-points" placeholder="Баллы" value="10">
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                <button class="btn-primary" id="save-task-btn">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('save-task-btn').onclick = () => {
        const title = document.getElementById('task-title').value;
        const category = document.getElementById('task-category').value;
        const points = parseInt(document.getElementById('task-points').value);
        if (title) addTask(title, category, points);
        modal.remove();
    };
}

function addTask(title, category, points) {
    tasks.push({
        id: Date.now().toString(),
        title, category, points: points || 10,
        completed: false, completedDate: null,
        createdAt: new Date().toISOString()
    });
    saveData();
    loadModule('tasks');
}

window.toggleTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        if (task.completed) {
            task.completedDate = new Date().toDateString();
            user.points += task.points;
        } else {
            task.completedDate = null;
            user.points -= task.points;
        }
        saveData();
        loadModule('tasks');
        loadModule('tracker');
    }
};

window.deleteTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (task && task.completed) user.points -= task.points;
    tasks = tasks.filter(t => t.id !== id);
    saveData();
    loadModule('tasks');
    loadModule('tracker');
};

window.editTask = function(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>✏️ Редактировать</h3>
            <input type="text" id="task-title" value="${escapeHtml(task.title)}">
            <select id="task-category">
                <option value="Работа" ${task.category === 'Работа' ? 'selected' : ''}>💼 Работа</option>
                <option value="Учеба" ${task.category === 'Учеба' ? 'selected' : ''}>📚 Учеба</option>
                <option value="Дом" ${task.category === 'Дом' ? 'selected' : ''}>🏠 Дом</option>
                <option value="Личное" ${task.category === 'Личное' ? 'selected' : ''}>❤️ Личное</option>
            </select>
            <input type="number" id="task-points" value="${task.points}">
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                <button class="btn-primary" id="save-edit-btn">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('save-edit-btn').onclick = () => {
        task.title = document.getElementById('task-title').value;
        task.category = document.getElementById('task-category').value;
        task.points = parseInt(document.getElementById('task-points').value);
        saveData();
        loadModule('tasks');
        modal.remove();
    };
};

// ==================== Привычки ====================
function renderHabits(container) {
    const today = new Date().toDateString();
    const todayHabits = habits.map(h => ({ ...h, completedToday: h.completed && h.completedDate === today }));
    
    container.innerHTML = `
        <div class="habits-module">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>💪 Привычки</h2>
                <button class="btn-primary" id="add-habit-btn">+ Добавить</button>
            </div>
            <div id="habits-list"></div>
        </div>
    `;
    
    renderHabitsList(todayHabits);
    document.getElementById('add-habit-btn').onclick = showAddHabitModal;
}

function renderHabitsList(habitsList) {
    const container = document.getElementById('habits-list');
    if (habitsList.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 Нет привычек. Добавьте первую привычку!</div>';
        return;
    }
    
    container.innerHTML = habitsList.map(habit => `
        <div class="habit-card" data-id="${habit.id}">
            <div class="habit-checkbox">
                <input type="checkbox" ${habit.completedToday ? 'checked' : ''} onchange="toggleHabit('${habit.id}')">
            </div>
            <div class="habit-content">
                <div class="habit-title">${habit.name}</div>
                <div class="habit-meta">${habit.category} • Стрик: ${habit.streak || 0} дней</div>
            </div>
            <div class="task-points">+${habit.points}</div>
            <div class="habit-actions">
                <button onclick="editHabit('${habit.id}')">✏️</button>
                <button onclick="deleteHabit('${habit.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.toggleHabit = function(id) {
    const habit = habits.find(h => h.id === id);
    if (habit) {
        const today = new Date().toDateString();
        const wasCompleted = habit.completed && habit.completedDate === today;
        
        if (!wasCompleted) {
            habit.completed = true;
            habit.completedDate = today;
            habit.streak = (habit.streak || 0) + 1;
            user.points += habit.points;
        } else {
            habit.completed = false;
            habit.completedDate = null;
            habit.streak = Math.max(0, (habit.streak || 0) - 1);
            user.points -= habit.points;
        }
        saveData();
        loadModule('habits');
        loadModule('tracker');
    }
};

window.deleteHabit = function(id) {
    const habit = habits.find(h => h.id === id);
    if (habit && habit.completed && habit.completedDate === new Date().toDateString()) {
        user.points -= habit.points;
    }
    habits = habits.filter(h => h.id !== id);
    saveData();
    loadModule('habits');
    loadModule('tracker');
};

window.editHabit = function(id) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>✏️ Редактировать привычку</h3>
            <input type="text" id="habit-name" value="${escapeHtml(habit.name)}">
            <select id="habit-category">
                <option value="Здоровье" ${habit.category === 'Здоровье' ? 'selected' : ''}>🏃 Здоровье</option>
                <option value="Активность" ${habit.category === 'Активность' ? 'selected' : ''}>🚶 Активность</option>
                <option value="Ментальное" ${habit.category === 'Ментальное' ? 'selected' : ''}>🧘 Ментальное</option>
            </select>
            <input type="number" id="habit-points" value="${habit.points}">
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                <button class="btn-primary" id="save-edit-btn">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('save-edit-btn').onclick = () => {
        habit.name = document.getElementById('habit-name').value;
        habit.category = document.getElementById('habit-category').value;
        habit.points = parseInt(document.getElementById('habit-points').value);
        saveData();
        loadModule('habits');
        modal.remove();
    };
};

function showAddHabitModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>➕ Новая привычка</h3>
            <input type="text" id="habit-name" placeholder="Название привычки">
            <select id="habit-category">
                <option value="Здоровье">🏃 Здоровье</option>
                <option value="Активность">🚶 Активность</option>
                <option value="Ментальное">🧘 Ментальное</option>
            </select>
            <input type="number" id="habit-points" placeholder="Баллы" value="10">
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                <button class="btn-primary" id="save-habit-btn">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('save-habit-btn').onclick = () => {
        const name = document.getElementById('habit-name').value;
        const category = document.getElementById('habit-category').value;
        const points = parseInt(document.getElementById('habit-points').value);
        if (name) {
            habits.push({
                id: Date.now().toString(),
                name, category, points: points || 10,
                completed: false, completedDate: null, streak: 0
            });
            saveData();
            loadModule('habits');
        }
        modal.remove();
    };
}

// ==================== Заметки ====================
function renderNotes(container) {
    container.innerHTML = `
        <div class="notes-module">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>📝 Заметки</h2>
                <button class="btn-primary" id="add-note-btn">+ Добавить</button>
            </div>
            <div id="notes-list"></div>
        </div>
    `;
    
    renderNotesList();
    document.getElementById('add-note-btn').onclick = showAddNoteModal;
}

function renderNotesList() {
    const container = document.getElementById('notes-list');
    if (notes.length === 0) {
        container.innerHTML = '<div class="empty-state">📭 Нет заметок. Создайте первую заметку!</div>';
        return;
    }
    
    container.innerHTML = notes.map(note => `
        <div class="note-card" data-id="${note.id}">
            <div style="flex: 1;">
                <div class="task-title">${escapeHtml(note.title)}</div>
                <div class="task-meta" style="margin-top: 8px;">${escapeHtml(note.content || '')}</div>
                <div class="task-meta" style="margin-top: 12px;">📅 ${new Date(note.createdAt).toLocaleDateString()}</div>
            </div>
            <div class="note-actions">
                <button onclick="editNote('${note.id}')">✏️</button>
                <button onclick="deleteNote('${note.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.deleteNote = function(id) {
    notes = notes.filter(n => n.id !== id);
    saveData();
    renderNotesList();
};

window.editNote = function(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>✏️ Редактировать заметку</h3>
            <input type="text" id="note-title" value="${escapeHtml(note.title)}" placeholder="Заголовок">
            <textarea id="note-content" rows="4" placeholder="Содержимое">${escapeHtml(note.content || '')}</textarea>
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                <button class="btn-primary" id="save-edit-btn">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('save-edit-btn').onclick = () => {
        note.title = document.getElementById('note-title').value;
        note.content = document.getElementById('note-content').value;
        saveData();
        renderNotesList();
        modal.remove();
    };
};

function showAddNoteModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>➕ Новая заметка</h3>
            <input type="text" id="note-title" placeholder="Заголовок">
            <textarea id="note-content" rows="4" placeholder="Содержимое"></textarea>
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                <button class="btn-primary" id="save-note-btn">Сохранить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('save-note-btn').onclick = () => {
        const title = document.getElementById('note-title').value;
        const content = document.getElementById('note-content').value;
        if (title) {
            notes.push({
                id: Date.now().toString(),
                title, content,
                createdAt: new Date().toISOString()
            });
            saveData();
            renderNotesList();
        }
        modal.remove();
    };
}