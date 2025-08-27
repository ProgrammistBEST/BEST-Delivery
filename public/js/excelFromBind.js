document.addEventListener('DOMContentLoaded', () => {
    setupFileInput('drop-zone', 'file-input', file => {
        const fileNameDisplay = document.querySelector('.file-name-display');
        if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.type === 'application/vnd.ms-excel') {
            fileNameDisplay.textContent = `Выбранный файл: ${file.name}`;
            fileNameDisplay.style.color = '';
        } else {
            fileNameDisplay.textContent = 'Можно загружать только файлы Excel!';
            fileNameDisplay.style.color = 'red';
        }
    });
});

// Обработка кнопки "Excel из привязки" - отправка на сервер
document.getElementById('cteateExcelFromBind').addEventListener('click', async () => {
    try {
        const fileInput = document.getElementById('file-input');
        if (!fileInput.files.length) {
            throw new Error('Файл не выбран!');
        }

        const file = fileInput.files[0];
        
        // Проверяем тип файла
        if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
            file.type !== 'application/vnd.ms-excel') {
            throw new Error('Можно загружать только файлы Excel!');
        }

        // Создаем уведомление о начале процесса
        const notification = showNotification('Обработка файла началась...', 'info');

        // Создаем FormData для отправки файла
        const formData = new FormData();
        formData.append('file', file);

        // Отправляем файл на сервер
        const response = await fetch('/api/process-excel', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Ошибка при обработке файла на сервере');
        }

        // Получаем Excel файл из ответа
        const blob = await response.blob();
        
        // Создаем ссылку для скачивания
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `excel_iz_privyazki_${new Date().getTime()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        
        // Очищаем ресурсы
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);

        updateNotification(notification, 'Файл успешно обработан и скачан!', 'success');

    } catch (error) {
        console.error('Ошибка при обработке файла:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
});