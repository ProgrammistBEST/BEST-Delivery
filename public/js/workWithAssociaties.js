// Элементы
const openFormButton = document.getElementById('open-form-button');
const closeFormButton = document.getElementById('close-form-button');
const formContainer = document.getElementById('form-container');
const articleForm = document.getElementById('article-form');
const articleList = document.getElementById('article-list');
const notificationContainer = document.getElementById('notification-container');

// Открыть форму
openFormButton.addEventListener('click', () => {
    formContainer.classList.remove('hidden');
});

// Закрыть форму
closeFormButton.addEventListener('click', () => {
    formContainer.classList.add('hidden');
    articleForm.reset();
    delete articleForm.dataset.editIndex; // Убираем режим редактирования
});

// Обновление списка
async function updateArticleList() {
    try {
        const response = await fetch('/api/associations');
        if (response.ok) {
            const associations = await response.json();
            articleList.innerHTML = ''; // Очищаем список

            associations.forEach((assoc) => {
                const li = document.createElement('li');
                li.textContent = `${assoc.simple} → ${assoc.full}`;

                const buttonsContainer = document.createElement('div');

                const editButton = document.createElement('button');
                editButton.textContent = 'Изменить';
                editButton.className = 'edit-button';
                editButton.addEventListener('click', () => openEditForm(assoc));

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Удалить';
                deleteButton.className = 'delete-button';
                deleteButton.addEventListener('click', () => deleteAssociation(assoc.simple));

                buttonsContainer.appendChild(editButton);
                buttonsContainer.appendChild(deleteButton);
                li.appendChild(buttonsContainer);

                articleList.appendChild(li);
            });
        } else {
            throw new Error('Ошибка загрузки данных');
        }
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

// Открытие формы для редактирования
function openEditForm(assoc) {
    document.getElementById('simpleArticle').value = assoc.simple;
    document.getElementById('fullArticle').value = assoc.full;

    articleForm.dataset.editIndex = assoc.simple; // Храним оригинальный артикул
    formContainer.classList.remove('hidden');
}

// Добавить/изменить ассоциацию
articleForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Остановка перезагрузки

    const simpleArticle = document.getElementById('simpleArticle').value.trim();
    const fullArticle = document.getElementById('fullArticle').value.trim();

    if (!simpleArticle || !fullArticle) {
        alert('Оба поля обязательны.');
        return;
    }

    const editIndex = articleForm.dataset.editIndex;

    if (editIndex !== undefined) {
        // Редактирование существующей ассоциации
        await editAssociation(editIndex, simpleArticle, fullArticle);
        delete articleForm.dataset.editIndex;
    } else {
        // Добавление новой ассоциации
        await addAssociation(simpleArticle, fullArticle);
    }

    articleForm.reset(); // Сброс значений формы
    updateArticleList(); // Обновление списка без перезагрузки
});

// Добавление ассоциации
async function addAssociation(simple, full) {
    try {
        const response = await fetch('/api/associations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ simple, full }),
        });

        if (response.ok) {
            showNotification(`Добавлена ассоциация ${simple} → ${full}`);
        } else {
            const error = await response.json();
            showNotification(error.error, 'error');
        }
    } catch {
        showNotification('Ошибка добавления ассоциации', 'error');
    }
}

// Редактирование ассоциации
async function editAssociation(originalSimple, newSimple, newFull) {
    try {
        const response = await fetch(`/api/associations/${originalSimple}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newSimple, newFull }),
        });

        if (response.ok) {
            showNotification(`Ассоциация изменена: ${originalSimple} → ${newSimple}`);
        } else {
            const error = await response.json();
            showNotification(error.error, 'error');
        }
    } catch {
        showNotification('Ошибка изменения ассоциации', 'error');
    }
}

// Удаление ассоциации
async function deleteAssociation(simple) {
    try {
        const response = await fetch(`/api/associations/${simple}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            showNotification(`Удалена ассоциация ${simple}`);
            updateArticleList();
        } else {
            const error = await response.json();
            showNotification(error.error, 'error');
        }
    } catch {
        showNotification('Ошибка удаления ассоциации', 'error');
    }
}

// Инициализация
updateArticleList();
