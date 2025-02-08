document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.createElement('p'); // Для отображения имени файла
    fileNameDisplay.className = 'file-name-display';
    dropZone.appendChild(fileNameDisplay);

    // Открываем окно выбора файла при клике
    dropZone.addEventListener('click', () => fileInput.click());

    // Предотвращаем стандартное поведение для событий drag и drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    // Подсвечиваем область, когда файл над ней
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'));
    });

    // Убираем подсветку, когда файл покидает область
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
    });

    // Обработка перетащенного файла
    dropZone.addEventListener('drop', e => {
        const files = e.dataTransfer.files; // Получаем файлы из события
        handleFiles(files);
        updateInputWithFile(files); // Обновляем input
    });

    // Обработка выбранного файла через input
    fileInput.addEventListener('change', e => {
        const files = e.target.files; // Получаем файлы из input
        handleFiles(files);
    });

    // Обработка файлов
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            fileNameDisplay.textContent = `Выбранный файл: ${file.name}`;
            if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.type === 'application/vnd.ms-excel') {
                console.log(`Файл принят: ${file.name}`);
            } else {
                fileNameDisplay.textContent = 'Можно загружать только файлы Excel!';
                fileNameDisplay.style.color = 'red';
            }
        });
    }

    // Функция для обновления input с помощью DataTransfer
    function updateInputWithFile(files) {
        const dataTransfer = new DataTransfer();
        Array.from(files).forEach(file => {
            dataTransfer.items.add(file); // Добавляем файл в DataTransfer
        });
        fileInput.files = dataTransfer.files; // Обновляем файлы в input
    }
});

// Обработка кнопки загрузки и обработки файла
document.getElementById('downloadDelivery').addEventListener('click', async () => {
    try {
        const fileInput = document.getElementById('file-input');
        if (!fileInput.files.length) {
            throw new Error('Файл не выбран!');
        }

        const file = fileInput.files[0];
        const data = new Uint8Array(await file.arrayBuffer());
        const workbook = XLSX.read(data, { type: 'array' });

        // Чтение первой страницы
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const notification = createNotification('Загрузка и обработка файла началась...', 'info');
        // Преобразование данных в JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Создание объектов из данных Excel (начиная с 4 строки)
        const cards = parseExcelDataToObjects(jsonData);

        // Рендеринг данных
        await renderObjects(cards);
        await fetchAndCompareJson(cards);

        // Создание кнопки "Сформировать"
        if (document.querySelector('.checked-model')) {
            addCreateButton();
        } else {
            console.warn('Контейнер для кнопки "Сформировать" не найден');
        }

        updateNotification(notification, 'Файл успешно обработан и данные добавлены!', 'success');
    } catch (error) {
        console.error('Ошибка при обработке файла:', error);
        createNotification('Ошибка при загрузке и обработке файла. Проверьте данные.', 'danger');
    }
});

// Загрузка и сравнение данных с Article.json
async function fetchAndCompareJson(cards) {
    console.log(cards + ' Картачки')
    const jsonUrl = './Article.json';
    let inputsAll = document.querySelectorAll('.sizeBox');
    const inputsArray = Array.from(inputsAll);

    try {
        const response = await fetch(jsonUrl);

        // Загрузка данных из второго JSON файла
        if (!response.ok) throw new Error('Ошибка при загрузке Article.json');
        const data = await response.json();
        
        inputsArray.forEach(input => {
            data.forEach(item1 => {
                if (input.id == item1.Vendorcode && input.placeholder == item1.Size) {
                    input.value = item1.Pair
                }
            }
        )})
    } catch (error) {
        console.error('Ошибка при загрузке Article.json:', error);
    }
}

// Скрытие элементов только при нажатии на кнопку "Создать файлы для поставки"
function hideCurrentElements() {
    const main = document.querySelector('.model');
    const checkedModel = document.querySelector('.checked-model');
    const modelModal = document.querySelector('.container-general')
    if (main) {
        main.style.display = 'none';
    }
    if (checkedModel) {
        checkedModel.style.display = 'none';
    }
    if (modelModal) {
        modelModal.style.display = 'none';
    }
}

function parseExcelDataToObjects(data) {
    const cards = [];
    let currentSizes = []; // Текущие размеры для использования, если в строке пустое значение в столбце A
    const defaultSizes = generateSizes(34, 45); // Стандартный размерный ряд (34-45)

    for (let i = 4; i < data.length; i++) { // Начинаем с 4 строки
        const row = data[i];
        const vendorCode = row[0]; // Первый столбец A - артикул
        const sizeRange = row.slice(3, 15); // Столбцы D-O

        if (!vendorCode) {
            // Если в столбце A пустое значение
            const sizes = parseSizeRange(sizeRange);
            if (sizes.length > 0) {
                currentSizes = sizes; // Обновляем текущие размеры
            } else {
                continue; // Пропускаем строки без размеров
            }
        } else {
            // Если есть артикул, определяем размеры
            const sizes = (currentSizes.length > 0 ? currentSizes : defaultSizes).map((size, index) => {
                const count = parseInt(sizeRange[index]) || 0; // Количество берется из столбца D-O
                return { techSize: size, count };
            }).filter(size => size.count > 0); // Убираем размеры с нулевым количеством

            if (sizes.length > 0) {
                cards.push({
                    vendorCode: vendorCode.trim(),
                    sizes,
                });
            }
        }
    }
    return cards;
}

// Функция для обработки диапазона размеров
function parseSizeRange(sizeRange) {
    const sizes = [];
    sizeRange.forEach(cell => {
        if (cell) {
            if (typeof cell === 'string' && cell.includes('-')) {
                // Если это диапазон, например "35-36"
                sizes.push(cell); // Добавляем строку диапазона, не разбивая
            } else if (!isNaN(cell)) {
                // Если это отдельный размер
                sizes.push(cell.toString()); // Добавляем как строку
            }
        }
    });
    return sizes;
}

// Функция для создания стандартного размерного ряда
function generateSizes(start, end) {
    const sizes = [];
    for (let i = start; i <= end; i++) {
        sizes.push(i.toString()); // Преобразуем числа в строки
    }
    return sizes;
}

// Функция для обработки размерного ряда из строки
function parseRowSizes(sizeRange) {
    const sizes = [];
    let currentSize = null;

    sizeRange.forEach(cell => {
        if (typeof cell === 'string' && cell.includes('-')) { 
            const range = cell.split('-').map(Number);
            currentSize = range[0]; // Обновляем текущий размер
        } else if (typeof cell === 'number') { 
            currentSize = cell; // Если значение числовое
        }
        sizes.push(currentSize);
        if (currentSize !== null) currentSize++; // Увеличиваем размер
    });

    return sizes;
}

async function reconciliationAssociations(cards) {
    // Загрузка данных из JSON файлов
    const companyName = document.getElementById('company').value;
    const companyModel = await fetch(`jsonModel/${companyName}-model.json`).then(res => res.json());
    const associations = await fetch('associations.json').then(res => res.json());

    // Убедимся, что companyModel.cards — массив
    if (!companyModel || !Array.isArray(companyModel.cards)) {
        console.error('Ошибка: companyModel.cards не является массивом');
        return cards; // Возвращаем исходные данные без изменений
    }

    // Преобразуем associations в объект для быстрого поиска
    const associationsMap = associations.reduce((map, assoc) => {
        map[assoc.simple] = assoc.full;
        return map;
    }, {});

    // Список артикулов, отсутствующих в обоих источниках
    const missingModels = [];

    // Обработка каждого артикула
    const filteredCards = []; // Для хранения карточек, которые можно добавить
    cards.forEach(card => {
        const existsInBestshoes = companyModel.cards.some(model => model.vendorCode.trim() === card.vendorCode.trim());

        if (existsInBestshoes) {
            // Если артикул есть в bestshoes-model.json, добавляем его
            filteredCards.push(card);
        } else if (associationsMap[card.vendorCode.trim()]) {
            // Если есть ассоциация, заменяем артикул и добавляем
            card.vendorCode = associationsMap[card.vendorCode.trim()];
            filteredCards.push(card);
        } else {
            // Если артикул отсутствует в обоих файлах, добавляем его в список пропущенных
            missingModels.push(card.vendorCode.trim());
            console.warn(`Артикул ${card.vendorCode} отсутствует в обоих файлах`);
        }
    });

    // Если есть отсутствующие модели, показать их пользователю
    if (missingModels.length > 0) {
        const missingMessage = `Создайте ассоциации для следующих моделей и после перезагрузите страницу (Проверьте, на ту ли фирму скачиваете файл):\n${missingModels.join('\n')}`;
        console.warn(missingMessage);
        displayMissingModels(missingMessage);
    }

    return filteredCards; // Возвращаем только валидные карточки
}

// Функция для отображения сообщения с отсутствующими моделями
function displayMissingModels(message) {
    // Создаем элемент для вывода сообщения
    const missingContainer = document.createElement('div');
    missingContainer.className = 'missing-models-alert';
    missingContainer.style.cssText = `
        background: #ffeeba; 
        color: #856404; 
        padding: 10px; 
        border: 1px solid #ffeeba; 
        border-radius: 5px; 
        margin: 10px 0;
        white-space: pre-wrap;
    `;

    missingContainer.textContent = message;

    // Вставляем сообщение перед контейнером моделей или в начало страницы
    const container = document.querySelector('.checked-model') || document.body;
    container.prepend(missingContainer);
}

async function renderObjects(cards) {
    const container = document.querySelector('.checked-model') || createCheckedModelContainer();
    const updatedCards = await reconciliationAssociations(cards);

    updatedCards.forEach(card => {
        // Остальная логика создания элементов
        const row = document.createElement('div');
        row.className = 'row row-model bg bg-light';
        row.id = `row-${card.vendorCode}`;

        row.innerHTML = `
            <div id='${card.vendorCode.trim()}' class="col-1 name">${card.vendorCode.trim()}</div>
            <div class="col-1 box-value">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-seam-fill" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.01-.003.268-.108a.75.75 0 0 1 .558 0l.269.108.01.003 6.97 2.789ZM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L8 5.961 5.596 5l6.154-2.461L10.404 2Z"/>
                </svg>
            </div>
        `;

        // Добавление размеров и других элементов
        card.sizes.forEach(size => {
            const sizeDiv = document.createElement('div');
            sizeDiv.className = 'col-1 col-size';

            sizeDiv.innerHTML = `
                <span>${size.techSize}</span>
                <input type="number" number="" class="input-size Item${size.techSize}" placeholder="${size.techSize}" value="${size.count}" style="text-align: center; border-radius: 10px" />
                <input type="number" id="${card.vendorCode.trim()}" number="" tabindex="-1" class="box-input sizeBox Item${size.techSize}" placeholder="${size.techSize}" value="20" style="text-align: center; border-radius: 10px, width: 20px"/>
            `;
            console.log(card.vendorCode)
            row.appendChild(sizeDiv);
        });

        const deleteButton = document.createElement('div');
        deleteButton.className = 'col-1 col-del btn btn-danger';
        deleteButton.textContent = 'Удалить';
        deleteButton.addEventListener('click', function () {
            row.remove();
        });

        row.appendChild(deleteButton);
        container.appendChild(row);
    });
}

function createCheckedModelContainer() {
    const container = document.createElement('div');
    container.className = 'checked-model';
    document.querySelector('.model').insertAdjacentElement('afterend', container);
    return container;
}

// Добавление кнопки "Создать файлы для поставки"
function addCreateButton() {
    let inputsAll = document.querySelectorAll('.sizeBox');
    const inputsArray = Array.from(inputsAll);
    document.querySelectorAll('.row-model')[document.querySelectorAll('.row-model').length - 1].insertAdjacentHTML('afterend',
        `
            <div id="hiddenContainerDiv" class="btn btn-success btn-create-excel">Создать файлы для поставки</div>
        `);
    const closeFormContainer = document.getElementById('hiddenContainerDiv');
    const formContainerDiv = document.getElementById('container-hidden'); 
    // Закрыть форму
    closeFormContainer.addEventListener('click', () => {
        formContainerDiv.classList.add('hidden');
    });
    let sendBtn = document.querySelector('.btn-create-excel');
    sendBtn.addEventListener('click', async function()
    {
        let sendObj = []; 
        document.querySelectorAll('.box-input').forEach(input => {
            if (input.value == '')
            {
                input.style.border = '2px solid red';
                alert('Есть пустые обязательные поля')
            }
        });
        document.querySelectorAll('.row-model').forEach(row =>{
            let valueChecked = [];
            row.querySelectorAll('.input-size').forEach(inputSize => {
                inputsArray.forEach( item => {
                    if (item.placeholder == inputSize.placeholder)
                        {
                            inputSize.name = item.value
                        }
                        else {

                        }
                });
                if (inputSize.value == '')
                {
                    valueChecked.push(inputSize);
                }
            });
            if (valueChecked.length == row.querySelectorAll('.input-size').length)
            {
                let alertCount = 0;
                valueChecked.forEach(badInput => {
                    badInput.style.border = '2px solid red';
                    if (alertCount < 1)
                    {
                        document.querySelector('.row-model').insertAdjacentHTML('beforebegin',
                        `
                            <div class="alert alert-danger" role="alert">
                            ${badInput.parentNode.parentNode.querySelector('.name').textContent} не указанно колличество!
                            </div> 
                        `);
                    }
                    alertCount++; 
                });
                setTimeout(() => {
                    document.querySelector('.alert').parentNode.removeChild(document.querySelector('.alert'))
                }, 1000);
            }else
            {
               sendObj.push({
                art : row.querySelector('.name').textContent,
                boxCount: row.querySelector('.box-input').value,
                sizes: []
               });
               sendObj.forEach(item => {
                item.sizes.forEach(sizeList => {
                    document.querySelectorAll('.box-input').forEach(input => {
                        if (input.id == item.art && input.placeholder == sizeList.size){
                            sizeList.boxCount = input.value
                        }
                    })
                }) 
           })
               row.querySelectorAll('.input-size').forEach(inputSize => {
                if (inputSize.value != '')
                {
                    sendObj[sendObj.length - 1].sizes.push({
                        size : inputSize.placeholder,
                        value: inputSize.value,
                        boxCount: inputSize.name                         
                    });
                }
               });
            }
        });
        const companyName = {
            Armbest: '/createOrderArmbest',
            Bestshoes: "/createOrderBest",
            Best26: "/createOrderBest26",
        };
        let companyElement = document.getElementById('company'); // Получаем элемент
        let companyValue = companyElement.value; // Получаем значение атрибута value
        console.log(companyValue); // Выводим значение в консоль
        if (sendObj.length == document.querySelectorAll('.row-model').length)
        {
            main.innerHTML = `
            <div class="wait">
                <h1 class="title-wait">Ждите...</h1>
                <img src="./img/loading-wtf.gif" />
            </div>`;
            console.log(company)
            fetch(companyName[companyValue],
            {
                method : 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sendObj)
            }).then(res => res.blob())
                .then(data => {
                    var a = document.createElement("a");
                    a.href = window.URL.createObjectURL(data);
                    a.download = `${companyValue} файлы поставки.zip`;
                    setTimeout(() => {
                        main.innerHTML = `
                        <video class="video" autoplay>
                            <source src="./img/download.mp4" />
                        </video>`;
                        a.click();
                        main.innerHTML =
                        `
                            <div class="merge_files">
                                <div class="merge_files_box1">
                                    <h1 class="merge_files_h1"></h1>
                                    <label style="position: relative; top: -30px; left: 115px; font-size: 20px; " for="shtrihcod">Штрихкоды</label>
                                    <input name="shtrihcod" class="change_file" placeholder="Штрихкоды" type="file" id="fileInput1" accept=".xlsx">
        
                                    <label style="position: relative; top: -30px; left: 102px; font-size: 20px; " for="shtrihcod">Поставка</label>
                                    <input name="postfile" class="change_file" placeholder="Поставка" type="file" id="fileInput2" accept=".xlsx">
                                </div>
                                <div class="merge_files_box2">
                                    <button class="postNewEXCEL" onclick="processFiles()">Объединить</button>    
                                </div>
                            </div>
                            `
                        setTimeout(() => {
                            // window.location.replace("/best");
                        }, 6000)
                    }, 1000);
                });
        }
    });
}

// Уведомления
function createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
    return notification;
}

function updateNotification(notification, message, type) {
    notification.textContent = message;
    notification.className = `alert alert-${type}`;
    setTimeout(() => notification.remove(), 3000);
}
