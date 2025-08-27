const path = require('path');
const fs = require('fs').promises;
const exceljs = require('exceljs');

function parseArticleSize(articleSize) {
    const noSpace = articleSize.replace(/\s+/g, '');
    const match = noSpace.match(/^([^(]+)(?:\(([^)]+)\))?/);
    return {
        model: match ? match[1] : noSpace,
        size: match && match[2] ? match[2] : ''
    };
}

// Загружаем данные из result.json
async function loadSizeGrids() {
    try {
        const data = await fs.readFile(path.join(__dirname, '../public/result.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        throw new Error(`Ошибка при чтении result.json: ${error.message}`);
    }
}

// Находим размерную сетку для модели
function findSizeGrid(model, sizeGrids) {
    return sizeGrids.find(grid => grid.models.includes(model)) || null;
}

// Группируем данные по размерным сеткам
function groupBySizeGrid(dataMap, sizeGrids) {
    const gridsMap = new Map();

    for (const { article, quantity } of dataMap) {
        const { model, size } = parseArticleSize(article);
        const grid = findSizeGrid(model, sizeGrids);
        if (!grid) {
            console.warn(`Модель ${model} не найдена в размерных сетках`);
            continue;
        }

        const gridData = gridsMap.get(grid.grid_id) || { grid, models: new Map() };
        gridsMap.set(grid.grid_id, gridData);

        const modelSizes = gridData.models.get(model) || new Map();
        gridData.models.set(model, modelSizes);

        modelSizes.set(size, (modelSizes.get(size) || 0) + quantity);
    }

    return gridsMap;
}

// Преобразуем данные в нужный формат
function formatResult(gridsMap) {
    return Array.from(gridsMap, ([gridId, gridData]) => ({
        grid_id: gridId,
        sizes: gridData.grid.sizes,
        models: Array.from(gridData.models, ([model, sizesMap]) => ({
            model,
            sizes: Array.from(sizesMap, ([size, quantity]) => ({ size, quantity }))
        }))
    }));
}


async function getDataFromExcelBind(filePath) {
    try {
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.readFile(filePath);

        const worksheet = workbook.getWorksheet(1);
        const quantities = worksheet.getColumn(2).values.slice(1);
        const articleSizes = worksheet.getColumn(4).values.slice(1);

        return dataInObject(quantities, articleSizes);
    } catch (error) {
        throw new Error(`Ошибка при чтении excel файла привязки: ${error.message}`);
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

// Основная функция обработки
async function processExcelData() {
    try {
        // Загружаем данные из Excel
        const dataMap = await getDataFromExcelBind(`C:/Users/programmer/Desktop/привязка_armbest 248.xlsx`);
        
        // Загружаем размерные сетки
        const sizeGrids = await loadSizeGrids();
        
        // Группируем данные по размерным сеткам
        const gridsMap = groupBySizeGrid(dataMap, sizeGrids);
        
        // Форматируем результат
        const result = formatResult(gridsMap);
        
        // Опционально: сохраняем в файл
        await fs.writeFile('result_output.json', JSON.stringify(result, null, 2));
        
        return result;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
}

// Запуск
(async () => {
    try {
        await processExcelData();
        console.log('Обработка завершена успешно');
    } catch (error) {
        console.error('Ошибка при обработке:', error.message);
    }
})();