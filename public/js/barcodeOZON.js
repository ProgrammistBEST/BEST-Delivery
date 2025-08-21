document.addEventListener("DOMContentLoaded", function () {
  const openModalButton = document.getElementById("barcodeOZON");
  const modal = new bootstrap.Modal(document.getElementById("barcodeOZONModal"));
  const dropZone = document.getElementById("drop-zone-ozon");
  const fileInput = document.getElementById("file-input");
  const fileInfo = document.getElementById("fileInfo");
  const fileName = document.getElementById("fileName");
  const removeFileButton = document.getElementById("removeFile");

  openModalButton.addEventListener("click", function () {
    modal.show();
  });

  // Клик по зоне перетаскивания открывает файловый диалог
  dropZone.addEventListener("click", function () {
    fileInput.click();
  });

  // Обработка выбора файла
  fileInput.addEventListener("change", function () {
    if (this.files.length) {
      handleFileSelection(this.files[0]);
    }
  });

  // Удаление файла
  removeFileButton.addEventListener("click", function () {
    fileInput.value = "";
    fileInfo.style.display = "none";
    dropZone.style.display = "block";
  });

  // Обработка выбранного файла
  function handleFileSelection(file) {
    if (file.name.match(/\.(xlsx|xls)$/i)) {
      fileName.textContent = `Выбран файл: ${file.name}`;
      fileInfo.style.display = "block";
      dropZone.style.display = "none";
    } else {
      alert("Пожалуйста, выберите Excel файл (.xlsx или .xls)");
      fileInput.value = "";
    }
  }

  document.getElementById("barcodeOZONForm").addEventListener("submit", function (e) {
    e.preventDefault();

    const city = document.getElementById("cityCode").value.trim();
    const supply = document.getElementById("supplyNumber").value.trim();
    const file = fileInput.files[0];

    if (city.length >= 6) {
      alert("Город должен содержать максимум 6 символов.");
      return;
    }

    if (!file) {
      alert("Пожалуйста, выберите Excel файл.");
      return;
    }

    // Обработка Excel файла
    processExcelFile(file, city, supply);
  });

  // Функция обработки Excel файла
  function processExcelFile(file, city, supply) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        
        // Генерация результирующего файла
        generateResultExcel(city, supply, workbook);
        
      } catch (error) {
        console.error("Ошибка при чтении Excel файла:", error);
        alert("Ошибка при чтении Excel файла");
      }
    };
    
    reader.readAsArrayBuffer(file);
  }

  // Функция генерации результирующего Excel файла
  function generateResultExcel(city, supply, sourceWorkbook) {
    // Создаем новый файл с данными пользователя
    const resultData = [
      ["Город", "Номер поставки"],
      [city, supply]
    ];

    const ws = XLSX.utils.aoa_to_sheet(resultData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Данные OZON");
    
    // Копируем листы из исходного файла
    sourceWorkbook.SheetNames.forEach(sheetName => {
      const worksheet = sourceWorkbook.Sheets[sheetName];
      XLSX.utils.book_append_sheet(wb, worksheet, sheetName);
    });
    
    XLSX.writeFile(wb, `OZON_${supply}_${city}.xlsx`);
  }
});