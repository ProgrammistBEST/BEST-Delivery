document.addEventListener('DOMContentLoaded', () => {
    // Инициализация Select2
    // $('.form-select').select2();

    // Открытие и закрытие модального окна
    const modal = document.getElementById('modelModal');
    const openModalButton = document.getElementById('openModalButton');
    const closeModalButton = document.getElementById('closeModalButton');

    openModalButton.addEventListener('click', () => (modal.style.display = 'block'));
    closeModalButton.addEventListener('click', () => (modal.style.display = 'none'));

    // Загрузка моделей
    const companyName = document.getElementById('company').value;
    loadModels(companyName);

    // Обработчик формы обновления
    document.getElementById('updateForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const model = document.getElementById('model').value;
        const sizes = document.getElementById('sizes').value.split(',').map(s => s.trim());
        const pair = parseInt(document.getElementById('pair').value, 10);

        if (!sizes.length || isNaN(pair)) {
            alert('Заполните все поля корректно.');
            return;
        }

        try {
            const updates = sizes.map(size => ({
                Vendorcode: model,
                Size: size,
                Pair: pair,
            }));

            await Promise.all(updates.map(update =>
                fetch('/api/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(update),
                })
            ));

            showNotification('Данные успешно обновлены!', 'success');
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification('Ошибка при обновлении данных.', 'error');
        }
    });
});

// Функция загрузки моделей
async function loadModels(companyName) {
    console.log('companyName ' + companyName)
    try {
        const response = await fetch(`/${companyName.toLowerCase()}/api/articles`);
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
        const data = await response.json();

        // Сортируем модели перед выводом
        const sortedData = sortModels(data.map(item => item.vendorCode));

        // Генерируем элементы <option> с отсортированными данными
        const modelSelect = document.getElementById('model');
        modelSelect.innerHTML = sortedData.map(vendorCode => `<option value="${vendorCode}">${vendorCode}</option>`).join('');
    } catch (error) {
        console.error('Ошибка загрузки моделей:', error);
    }
}

/**
 * Функция сортировки моделей
 * @param {Array<string>} models - массив моделей для сортировки
 * @returns {Array<string>} - отсортированный массив моделей
 */
function sortModels(models) {
    return models.sort((a, b) => {
        // Функция для извлечения основного номера модели и суффикса
        const parseModel = (model) => {
            const match = model.match(/^(\d+)(.*)$/); // Ищем начало цифр и суффикс
            if (match) {
                return {
                    base: parseInt(match[1], 10), // Преобразуем основную часть в число
                    leadingZeros: match[1].length - String(parseInt(match[1], 10)).length, // Кол-во ведущих нулей
                    suffix: match[2] || "", // Оставшаяся часть модели
                };
            }
            return { base: Infinity, leadingZeros: 0, suffix: "" }; // Если не соответствует шаблону
        };

        // Разбираем модели
        const modelA = parseModel(a);
        const modelB = parseModel(b);

        // Сортировка по базовому номеру
        if (modelA.base !== modelB.base) {
            return modelA.base - modelB.base;
        }

        // Сортировка по количеству ведущих нулей (чем меньше, тем выше)
        if (modelA.leadingZeros !== modelB.leadingZeros) {
            return modelA.leadingZeros - modelB.leadingZeros;
        }

        // Лексикографическая сортировка суффиксов
        return modelA.suffix.localeCompare(modelB.suffix);
    });
}
function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.className = `alert ${type === 'success' ? 'alert-success' : 'alert-danger'}`;
    notification.style.position = 'fixed';
    notification.style.top = '10px';
    notification.style.right = '10px';
    notification.style.zIndex = '9999';

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}