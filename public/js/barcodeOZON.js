const OZONBarcodeModule = (function() {
  // Приватные переменные
  let modal;
  let dropZone;
  let fileInput;
  let fileInfo;
  let fileName;
  let removeFileButton;

  // Инициализация модуля
  function init() {
    initializeElements();
    initializeEventListeners();
  }

  // Инициализация DOM элементов
  function initializeElements() {
    modal = new bootstrap.Modal(document.getElementById("barcodeOZONModal"));
    dropZone = document.getElementById("drop-zone-ozon");
    fileInput = document.getElementById("file-input");
    fileInfo = document.getElementById("fileInfo");
    fileName = document.getElementById("fileName");
    removeFileButton = document.getElementById("removeFile");

    // Назначаем обработчик только если он еще не назначен
    if (!dropZone.hasAttribute('data-click-handler')) {
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.setAttribute('data-click-handler', 'true');
    }

    setupFileInput('drop-zone-ozon', 'file-input', file => {
        if (isExcelFile(file)) {
            displayFileInfo(file);
            updateFileInput(file);
        } else {
            showNotification("Пожалуйста, выберите Excel файл (.xlsx или .xls)", 'error');
            fileInput.value = "";
        }
    });
  }

  // Инициализация обработчиков событий
  function initializeEventListeners() {
    document.getElementById("barcodeOZON").addEventListener("click", handleOpenModal);
    document.getElementById("barcodeOZONForm").addEventListener("submit", handleSubmitForm);
    removeFileButton.addEventListener("click", handleRemoveFile);
    
    setupDragAndDrop();
  }

  // Настройка drag and drop функциональности
  function setupDragAndDrop() {
    // Удаляем лишний обработчик открытия окна выбора файла!
    // if (!dropZone.hasAttribute('data-click-handler')) {
    //   dropZone.addEventListener('click', () => fileInput.click());
    //   dropZone.setAttribute('data-click-handler', 'true');
    // }

    // Предотвращение стандартного поведения
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults);
    });

    // Визуальные эффекты drag and drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, highlight);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, unhighlight);
    });

    // Обработка перетащенного файла
    dropZone.addEventListener('drop', handleDrop);
    
    // Обработка выбранного файла через input
    fileInput.addEventListener('change', handleFileSelect);
  }

  // Вспомогательные функции
  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function highlight() {
    dropZone.classList.add('dragover');
  }

  function unhighlight() {
    dropZone.classList.remove('dragover');
  }

  // Обработчики событий
  function handleOpenModal() {
    resetForm();
    modal.show();
  }

  function handleDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length) {
      validateAndProcessFile(files[0]);
    }
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length) {
      validateAndProcessFile(files[0]);
    }
  }

  function handleRemoveFile() {
    fileInput.value = "";
    fileInfo.style.display = "none";
    dropZone.style.display = "block";
    dropZone.classList.remove('dragover');
  }

  function handleSubmitForm(e) {
    e.preventDefault();
    const formData = collectFormData();
    
    if (validateFormData(formData)) {
      sendRequestToServer(formData);
    }
  }

  // Валидация и обработка файла
  function validateAndProcessFile(file) {
    if (isExcelFile(file)) {
      displayFileInfo(file);
      updateFileInput(file);
    } else {
      showNotification("Пожалуйста, выберите Excel файл (.xlsx или .xls)", 'error');
      fileInput.value = "";
    }
  }

  function isExcelFile(file) {
    return file.name.match(/\.(xlsx|xls)$/i);
  }

  function displayFileInfo(file) {
    fileName.textContent = `Выбран файл: ${file.name}`;
    fileInfo.style.display = "block";
    dropZone.style.display = "none";
  }

  function updateFileInput(file) {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
  }

  // Сбор данных формы
  function collectFormData() {
    return {
      city: document.getElementById("cityCode").value.trim(),
      supplyNumber: document.getElementById("supplyNumber").value.trim(),
      file: fileInput.files[0]
    };
  }

  // Валидация данных формы
  function validateFormData(data) {
    if (data.city.length > 6) {
      alert("Город должен содержать 6 символов и меньше.");
      return false;
    }

    if (!data.supplyNumber) {
      alert("Пожалуйста, введите номер поставки.");
      return false;
    }

    if (!data.file) {
      alert("Пожалуйста, выберите Excel файл.");
      return false;
    }

    return true;
  }

  // Отправка запроса на сервер
  function sendRequestToServer(formData) {
    const formDataObj = new FormData();
    formDataObj.append('city', formData.city);
    formDataObj.append('supply_number', formData.supplyNumber);
    formDataObj.append('file', formData.file);

    const companyInput = document.getElementById('company');
    if (companyInput) {
      formDataObj.append('brand', companyInput.value);
    }

    fetch(`http://${window.location.hostname}:5000/generate_labels_from_excel`, {
      method: 'POST',
      body: formDataObj
    })
    .then(async response => {
      const contentType = response.headers.get('content-type');
      if (!response.ok) {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          if (errorData.duplicates) {
            showDuplicatesModal(errorData.duplicates, errorData.error);
            throw new Error(errorData.error);
          }
          throw new Error(errorData.error || 'Неизвестная ошибка');
        }
        throw new Error('Ошибка запроса');
      }
      if (contentType && contentType.includes('application/zip')) {
        // Это ZIP-файл, скачиваем его
        const disposition = response.headers.get('content-disposition');
        let filename = 'labels.zip'; // имя по умолчанию
        
        if (disposition && disposition.indexOf('attachment') !== -1) {
          const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
          const matches = filenameRegex.exec(disposition);
          if (matches != null && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }
        
        return response.blob().then(blob => {
          // Создаем ссылку для скачивания
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = filename;
          
          document.body.appendChild(a);
          a.click();
          
          // Очищаем ссылку
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          console.log('Файл успешно скачан:', filename);
        });
      } else if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.warning && data.raw_data) {
          showWarningsModal(data.warnings, data.raw_data, formDataObj.get('brand'), formDataObj.get('city'), formDataObj.get('supply_number'));
        }
        return data;
      }
    })
    .catch(error => {
      console.error('Ошибка при отправке запроса:', error);
      alert('Произошла ошибка: ' + error.message);
    });
  }

  // Показываем модальное окно с предупреждениями и формой редактирования
  function showWarningsModal(warnings, rawData, brand, city, supplyNumber) {
    const modalEl = document.getElementById('warningsModal');
    const warningsList = document.getElementById('warningsList');
    const rawDataEditor = document.getElementById('rawDataEditor');
    warningsList.innerHTML = `<ul>${warnings.map(w => `<li>${w}</li>`).join('')}</ul>`;

    // Фильтруем только модели с ошибкой
    const errorKeys = Object.keys(rawData).filter(key => rawData[key].box_count_file !== rawData[key].box_count_calc);

    rawDataEditor.innerHTML = errorKeys.map(key => {
      const model = rawData[key];
      return `
        <div class="mb-3 border p-2">
          <strong>Артикул: ${model.article}</strong><br>
          <span>Кол-во в файле: <b>${model.box_count_file}</b>, кол-во посчитано: <b>${model.box_count_calc}</b></span>
          <div class="mt-2">
            ${model.counts.map((count, idx) => `
              <div class="mb-1">
                <span>Размер: <b>${count.size}</b>, пар: <b>${count.pairs}</b></span>
                <label>Коробок: <input type="number" name="boxes_${key}_${idx}" value="${count.boxes}" min="1" style="width:70px"></label>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Сохраняем данные для повторной отправки
    modalEl.dataset.brand = brand;
    modalEl.dataset.city = city;
    modalEl.dataset.supplyNumber = supplyNumber;
    modalEl.dataset.rawData = JSON.stringify(rawData);

    // Показываем модальное окно
    const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
    bsModal.show();

    document.getElementById('resolveWarningsForm').onsubmit = function(e) {
      e.preventDefault();
      const form = e.target;
      const newRawData = JSON.parse(modalEl.dataset.rawData);

      // Обновляем только те модели, которые были показаны
      errorKeys.forEach(key => {
        const model = newRawData[key];
        model.counts.forEach((count, idx) => {
          const inputName = `boxes_${key}_${idx}`;
          if (form[inputName]) {
            count.boxes = Number(form[inputName].value);
          }
        });
        // Можно пересчитать box_count_calc, если нужно
        model.box_count_calc = model.counts.reduce((sum, c) => sum + Number(c.boxes), 0);
      });

      fetch(`http://${window.location.hostname}:5000/resolve_label_warnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: modalEl.dataset.brand,
          city: modalEl.dataset.city,
          supply_number: modalEl.dataset.supplyNumber,
          models_data: newRawData
        })
      })
      .then(async response => {
        if (!response.ok) {
          const errorData = await response.json();
          alert(errorData.error || 'Ошибка');
          return;
        }
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/zip')) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `${modalEl.dataset.brand}_${modalEl.dataset.supplyNumber || 'labels'}_package.zip`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        }
      })
      .catch(err => {
        alert('Ошибка: ' + err.message);
      });
    };
  }

  // Показываем модальное окно с дубликатами
  function showDuplicatesModal(duplicates, errorMsg) {
    alert(`${errorMsg}\nДубликаты:\n${duplicates.join('\n')}`);
  }

  // Сброс формы
  function resetForm() {
    document.getElementById("barcodeOZONForm").reset();
    fileInput.value = "";
    fileInfo.style.display = "none";
    dropZone.style.display = "block";
  }

  // Публичный API
  return {
    init: init
  };
})();

// Инициализация модуля при загрузке DOM
document.addEventListener("DOMContentLoaded", function () {
  OZONBarcodeModule.init();
});