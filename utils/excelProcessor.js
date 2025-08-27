const exceljs = require('exceljs');

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
async function createResultExcel(data) {
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Результат');
    
    

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

module.exports = {
    getDataFromExcelBuffer,
    createResultExcel
};