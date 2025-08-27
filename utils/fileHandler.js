const { 
    getDataFromExcelBuffer,
    createResultExcel
} = require('./excelProcessor');

const {
    loadSizeGrids,
    groupBySizeGrid,
    formatResult
} = require('./dataParser');

// Основная функция обработки
async function processExcelData(buffer) {
    try {
        // Загружаем данные из Excel
        const dataMap = await getDataFromExcelBuffer(buffer);
        
        // Загружаем размерные сетки
        const sizeGrids = await loadSizeGrids();
        
        // Группируем данные по размерным сеткам
        const gridsMap = groupBySizeGrid(dataMap, sizeGrids);
        
        // Форматируем результат
        const result = formatResult(gridsMap);
        
        // Создаем Excel файл с результатами
        const resultBuffer = await createResultExcel(result);
        
        return resultBuffer;
    } catch (error) {
        console.error(error.message);
        throw error;
    }
}

module.exports = {
    processExcelData
};