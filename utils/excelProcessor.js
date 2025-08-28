const exceljs = require('exceljs');
const path = require('path');

async function getDataFromExcelBuffer(buffer) {
    try {
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.load(buffer);

        const worksheet = workbook.getWorksheet(1);
        const quantities = worksheet.getColumn(2).values.slice(1);
        const articleSizes = worksheet.getColumn(4).values.slice(1);

        return dataInObject(quantities, articleSizes);
    } catch (error) {
        throw new Error(`Ошибка при чтении excel файла: ${error.message}`);
    }
}

function dataInObject(quantities, articleSizes) {
    const articleMap = new Map();

    for (let i = 0; i < articleSizes.length; i++) {
        const q = quantities[i];
        const a = articleSizes[i];
        if (q !== undefined && a !== undefined) {
            articleMap.set(a, (articleMap.get(a) || 0) + q);
        }
    }

    return Array.from(articleMap, ([article, quantity]) => ({ article, quantity }));
}

// Добавьте здесь логику создания нового Excel файла
// Функция для загрузки шаблона и инициализации
async function initializeWorkbook() {
    const workbook = new exceljs.Workbook();
    const templatePath = path.join(__dirname, '../tamplates/delivery_tamplate.xlsx');
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet(1);
    return { workbook, worksheet };
}

// Функция для сохранения подвала
function saveFooterData(worksheet) {
    const footerRow = worksheet.getRow(6);
    const footerData = [];
    const footerStyles = [];
    
    // Сохраняем данные и стили подвала
    for (let col = 1; col <= 15; col++) { // A до O
        const cell = footerRow.getCell(col);
        footerData[col] = cell.value;
        footerStyles[col] = {
            font: cell.font,
            fill: cell.fill,
            border: cell.border,
            alignment: cell.alignment,
            numFmt: cell.numFmt
        };
    }
    
    // Удаляем оригинальный подвал
    footerRow.values = [];
    
    return { footerData, footerStyles };
}

// Функция для создания карты размеров
function createSizeToColumnIndexMap(sizes) {
    const sizeToColumnIndex = new Map();
    sizes.forEach((size, index) => {
        sizeToColumnIndex.set(size, index + 4);
    });
    return sizeToColumnIndex;
}

// Функция для записи размерной сетки
async function writeSizeGrid(worksheet, currentRow, sizes) {
    const sizeRow = worksheet.getRow(currentRow);
    sizes.forEach((size, index) => {
        sizeRow.getCell(index + 4).value = size;
    });
    await sizeRow.commit();
    return currentRow + 1;
}

// Функция для записи модели
async function writeModel(worksheet, currentRow, modelData, sizeToColumnIndex, modelRows) {
    const { model, sizes: modelSizes } = modelData;
    
    const modelRow = worksheet.getRow(currentRow);
    modelRow.getCell(1).value = model; // Столбец A - модель
    
    // Записываем количества по размерам
    for (const sizeData of modelSizes) {
        const { size, quantity } = sizeData;
        const columnIndex = sizeToColumnIndex.get(size);
        if (columnIndex) {
            modelRow.getCell(columnIndex).value = quantity;
        }
    }
    
    // Добавляем формулу в столбец C =СУММ(D?:O?)
    const sumFormula = `=SUM(D${currentRow}:O${currentRow})`;
    modelRow.getCell(3).value = {
        formula: sumFormula,
        result: 0
    };
    
    modelRows.push(currentRow);
    await modelRow.commit();
    return currentRow + 1;
}

// Функция для обработки данных и записи в Excel
async function processDataAndWrite(worksheet, data) {
    let currentRow = 5;
    const modelRows = [];
    
    // Обрабатываем каждую размерную сетку
    for (const gridData of data) {
        const { sizes, models } = gridData;
        
        // Создаем карту размеров
        const sizeToColumnIndex = createSizeToColumnIndexMap(sizes);
        
        // Записываем размерную сетку
        currentRow = await writeSizeGrid(worksheet, currentRow, sizes);
        
        // Обрабатываем каждую модель
        for (const modelData of models) {
            currentRow = await writeModel(worksheet, currentRow, modelData, sizeToColumnIndex, modelRows);
        }
    }
    
    return { currentRow, modelRows };
}

// Функция для записи формул в подвал
function writeFooterFormulas(newFooterRow, modelRows) {
    if (modelRows.length > 0) {
        const firstModelRow = modelRows[0];
        const lastModelRow = modelRows[modelRows.length - 1];
        
        // Формула для столбца B =СУММ(B5:B?)
        const sumBFormula = `=SUM(B${firstModelRow}:B${lastModelRow})`;
        newFooterRow.getCell(2).value = {
            formula: sumBFormula,
            result: 0
        };
        
        // Формула для столбца C =СУММ(C5:C?)
        const sumCFormula = `=SUM(C${firstModelRow}:C${lastModelRow})`;
        newFooterRow.getCell(3).value = {
            formula: sumCFormula,
            result: 0
        };
        
        // Формула для столбца G =СУММ(B?/20)
        const palletFormula = `=SUM(B${firstModelRow}:B${lastModelRow})/20`;
        newFooterRow.getCell(7).value = {
            formula: palletFormula,
            result: 0
        };
    }
}

// Функция для записи текста в подвал
function writeFooterText(newFooterRow) {
    // Столбец A в подвале - "КОЛ-ВО ПАЛЕТ:"
    newFooterRow.getCell(1).value = "ИТОГО:";
    // Столбец D в подвале - "КОЛ-ВО ПАЛЕТ:"
    newFooterRow.getCell(4).value = "КОЛ-ВО ПАЛЕТ:";
    
    // Столбец N в подвале - "По 20 коробок"
    newFooterRow.getCell(14).value = "По 20 коробок";
}

// Функция для применения стилей к подвалу
function applyFooterStyles(newFooterRow, footerStyles) {
    for (let col = 1; col <= 15; col++) {
        const cell = newFooterRow.getCell(col);
        if (footerStyles[col]) {
            cell.font = footerStyles[col].font;
            cell.fill = footerStyles[col].fill;
            cell.border = footerStyles[col].border;
            cell.alignment = footerStyles[col].alignment;
            cell.numFmt = footerStyles[col].numFmt;
        }
    }
}

// Функция для объединения ячеек в подвале
function mergeFooterCells(worksheet, footerRowNumber) {
    // D, E, F (ячейки 4, 5, 6)
    worksheet.mergeCells(footerRowNumber, 4, footerRowNumber, 6);
    
    // G, H, I, J, K, L, M (ячейки 7, 8, 9, 10, 11, 12, 13)
    worksheet.mergeCells(footerRowNumber, 7, footerRowNumber, 13);
    
    // N, O (ячейки 14, 15)
    worksheet.mergeCells(footerRowNumber, 14, footerRowNumber, 15);
}

// Функция для центрирования текста в объединенных ячейках подвала
function centerFooterText(newFooterRow) {
    const footerCellsToCenter = [4, 7, 14]; // D, G, N
    footerCellsToCenter.forEach(colIndex => {
        const cell = newFooterRow.getCell(colIndex);
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
}

// Основная функция создания Excel файла
async function createResultExcel(data) {
    // Инициализация
    const { workbook, worksheet } = await initializeWorkbook();
    
    // Сохраняем подвал
    const { footerData, footerStyles } = saveFooterData(worksheet);
    
    // Обрабатываем данные
    const { currentRow, modelRows } = await processDataAndWrite(worksheet, data);
    
    // Номер строки подвала
    const footerRowNumber = currentRow;
    
    // Перемещаем подвал в новую позицию
    const newFooterRow = worksheet.getRow(footerRowNumber);
    
    // Вставляем формулы в подвал
    writeFooterFormulas(newFooterRow, modelRows);
    
    // Записываем текст в подвал
    writeFooterText(newFooterRow);
    
    // Применяем сохраненные стили к подвалу
    applyFooterStyles(newFooterRow, footerStyles);
    
    await newFooterRow.commit();
    
    // Объединяем ячейки в подвале
    mergeFooterCells(worksheet, footerRowNumber);
    
    // Центрируем текст в объединенных ячейках
    centerFooterText(newFooterRow);
    
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = {
    getDataFromExcelBuffer,
    createResultExcel
};