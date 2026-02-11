document.addEventListener('DOMContentLoaded', () => {
    // Select DOM elements
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const itemsLeft = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const dateDisplay = document.getElementById('date-display');
    const themeToggle = document.getElementById('theme-toggle');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Display Current Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateDisplay.textContent = new Date().toLocaleDateString('en-US', options);

    // Load todos and theme from localStorage
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    // Initialize App
    renderTodos();

    // Event Listeners
    addBtn.addEventListener('click', addTodo);

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    themeToggle.addEventListener('click', toggleTheme);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTodos();
        });
    });

    // Functions
    function toggleTheme() {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    }

    function addTodo() {
        const text = todoInput.value.trim();

        if (text === '') {
            // Shake animation for empty input
            todoInput.style.borderColor = '#ff7675';
            todoInput.classList.add('shake');
            setTimeout(() => {
                todoInput.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                todoInput.classList.remove('shake');
            }, 500);
            return;
        }

        const newTodo = {
            id: Date.now(),
            text: text,
            completed: false
        };

        todos.push(newTodo);
        saveTodos();
        renderTodos();

        todoInput.value = '';
        todoInput.focus();
    }

    function toggleTodo(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        saveTodos();
        renderTodos();
    }

    function editTodo(id, newText) {
        if (newText.trim() === '') return;
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, text: newText.trim() };
            }
            return todo;
        });
        saveTodos();
        renderTodos();
    }

    function deleteTodo(id) {
        // Animate deletion
        const item = document.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.style.animation = 'slideOut 0.3s ease forwards';
            item.addEventListener('animationend', () => {
                todos = todos.filter(todo => todo.id !== id);
                saveTodos();
                renderTodos();
            });
        } else {
            // Fallback if element not found (rare race condition)
            todos = todos.filter(todo => todo.id !== id);
            saveTodos();
            renderTodos();
        }
    }

    function clearCompleted() {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
    }

    function saveTodos() {
        localStorage.setItem('todos', JSON.stringify(todos));
        updateStats();
    }

    function updateStats() {
        const activeCount = todos.filter(todo => !todo.completed).length;
        itemsLeft.textContent = `${activeCount} item${activeCount !== 1 ? 's' : ''} left`;
    }

    function renderTodos() {
        todoList.innerHTML = '';

        // Filter todos based on current filter
        let filteredTodos = todos;
        if (currentFilter === 'active') {
            filteredTodos = todos.filter(todo => !todo.completed);
        } else if (currentFilter === 'completed') {
            filteredTodos = todos.filter(todo => todo.completed);
        }

        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            li.setAttribute('data-id', todo.id);

            li.innerHTML = `
                <div class="todo-content" onclick="window.toggleTodoHandler(${todo.id})">
                    <div class="check-circle">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <span class="todo-text" ondblclick="window.startEditHandler(event, ${todo.id})">${escapeHtml(todo.text)}</span>
                    <input type="text" class="todo-edit-input" value="${escapeHtml(todo.text)}" data-id="${todo.id}">
                </div>
                <button class="delete-btn" onclick="window.deleteTodoHandler(event, ${todo.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;

            todoList.appendChild(li);
        });

        updateStats();
    }

    // Helper to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Expose handlers to window for onclick attributes
    window.toggleTodoHandler = (id) => {
        toggleTodo(id);
    };

    window.deleteTodoHandler = (e, id) => {
        e.stopPropagation(); // Prevent toggling when clicking delete
        deleteTodo(id);
    };

    window.startEditHandler = (e, id) => {
        e.stopPropagation(); // Prevent toggling when double-clicking
        const todoItem = document.querySelector(`[data-id="${id}"]`);
        const editInput = todoItem.querySelector('.todo-edit-input');

        todoItem.classList.add('editing');
        editInput.focus();
        editInput.select();

        // Handle Enter to save
        editInput.addEventListener('keypress', function handleEnter(e) {
            if (e.key === 'Enter') {
                editTodo(id, editInput.value);
                todoItem.classList.remove('editing');
                editInput.removeEventListener('keypress', handleEnter);
                editInput.removeEventListener('keydown', handleEscape);
            }
        });

        // Handle Escape to cancel
        editInput.addEventListener('keydown', function handleEscape(e) {
            if (e.key === 'Escape') {
                todoItem.classList.remove('editing');
                editInput.removeEventListener('keypress', handleEnter);
                editInput.removeEventListener('keydown', handleEscape);
            }
        });

        // Handle blur to save
        editInput.addEventListener('blur', function handleBlur() {
            if (todoItem.classList.contains('editing')) {
                editTodo(id, editInput.value);
                todoItem.classList.remove('editing');
            }
            editInput.removeEventListener('blur', handleBlur);
        }, { once: true });
    };
});
