// Основной модуль для работы с OZON barcode
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
    // Открытие файлового диалога при клике
    dropZone.addEventListener('click', () => fileInput.click());

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
      showFileValidationError();
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

  function showFileValidationError() {
    alert("Пожалуйста, выберите Excel файл (.xlsx или .xls)");
    fileInput.value = "";
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
    
    // Получаем значение компании из скрытого input
    const companyInput = document.getElementById('company');
    if (companyInput) {
      formDataObj.append('brand', companyInput.value);
    }

    fetch('http://192.168.100.33:5000/generate_labels_from_excel', {
      method: 'POST',
      body: formDataObj
    })
    .then(response => {
      // Проверяем, успешный ли ответ
      if (!response.ok) {
        // Если ошибка, пытаемся получить JSON с сообщением об ошибке
        return response.json().then(errorData => {
          throw new Error(errorData.error || 'Неизвестная ошибка');
        });
      }
      
      // Если успех, проверяем тип контента
      const contentType = response.headers.get('content-type');
      
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
      } else {
        // Это JSON, обрабатываем как обычно
        return response.json();
      }
    })
    .then(data => {
      if (data) {
        console.log('Данные с сервера:', data);
        // Здесь можно добавить обработку полученных данных
        if (data.message) {
          alert(data.message);
        }
      }
    })
    .catch(error => {
      console.error('Ошибка при отправке запроса:', error);
      alert('Произошла ошибка: ' + error.message);
    });
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