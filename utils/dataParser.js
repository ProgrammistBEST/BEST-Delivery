const path = require('path');
const fs = require('fs').promises;

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

module.exports = {
    parseArticleSize,
    loadSizeGrids,
    findSizeGrid,
    groupBySizeGrid,
    formatResult
};