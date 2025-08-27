/**
 * Универсальный обработчик выбора файла и drag&drop.
 * @param {string} dropZoneId - id drop-зоны
 * @param {string} fileInputId - id input[type=file]
 * @param {function} onFileSelected - callback при выборе файла
 */
function setupFileInput(dropZoneId, fileInputId, onFileSelected) {
    const dropZone = document.getElementById(dropZoneId);
    const fileInput = document.getElementById(fileInputId);

    // Назначаем обработчик только если он еще не назначен
    if (!dropZone.hasAttribute('data-click-handler')) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.setAttribute('data-click-handler', 'true');
    }

    // Предотвращаем стандартное поведение для drag&drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // Подсветка
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'));
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
    });

    // Обработка drop
    dropZone.addEventListener('drop', e => {
        const files = e.dataTransfer.files;
        if (files.length) {
            fileInput.files = files;
            onFileSelected(files[0]);
        }
    });

    // Обработка выбора через input
    fileInput.addEventListener('change', e => {
        const files = e.target.files;
        if (files.length) {
            onFileSelected(files[0]);
        }
    });
}
