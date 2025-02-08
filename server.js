const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser');
var xl = require('excel4node');
const admz = require('adm-zip');
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const mysql = require("mysql2/promise");
const readline = require("readline");

const apiWb = {
    'bestShoes': {
        'standart': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NJRCI6IjM0MWNlYmU2LWQ1ZTItNDE1My1iNDQ4LWE5YTQ0MjhiZWQxOCJ9.9p43NF2EUqdCbgGnrdBMZOUJ34xtMGEvp5aBs1iBLA8',
        'stat': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NJRCI6Ijk5NjcwZmIxLWVhMmEtNGY0MC05MDc4LTdkYmNmYWJmZTlkNyJ9.A0bYMwNDXTAN8skqi_ReQeynCjvy2V3JnV0wf5NkfRc',
        'adv': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NJRCI6ImQ3ZTM2NTBlLTY1OTYtNDJkNC1hNTI0LTRjM2MyYTMyMGM1YSJ9.jgmgviMbWr6Y4cTg7F6tC1bHzZL0Sq3HgVXTyLRUzH8'
    },
    'armbest': {
        'standart': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NJRCI6IjYwNzllYTgyLWJkNTgtNGIyMy1hNjgxLTk3MmZiZGFhNTQ2NSJ9.5t3lG5kRUscNxawRxvuoJ4NXteehu5iZX6JpeHBjbg0',
        'stat': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NJRCI6IjA2NWUwZjQzLTdkZGEtNGIzNC1iY2Q3LWU4OTI2ODY3MTAwNCJ9.ULlC_z7r5tYBCKke-a-k_OUZUW4uv556emsNFSQ28eU',
        'adv': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3NJRCI6IjM1YjUzZWEwLTc4Y2ItNDAxNi1hNTU5LWIzMzlmNDEzYTYxMCJ9.Q4RK1maNeEvTdNWWd1hR5LMuH4J4MiWUJQ9iJTspxxg'
    }
}


app.use(express.static(path.join(__dirname, 'public')))

app.get('/armbest', (req, res) => {
    res.sendFile(`${__dirname}/public/armbest.html`);
});

app.get('/bestshoes', (req, res) => {
    res.sendFile(`${__dirname}/public/bestshoes.html`);
});

app.get('/best26', (req, res) => {
    res.sendFile(`${__dirname}/public/best26.html`);
});

app.post('/getModelArmbest', (req, res) => {
    let obj = JSON.parse(fs.readFileSync('./public/jsonModel/armbest-model.json', 'utf8'));
    res.send(JSON.stringify(obj, null, 4));
});

app.post('/getModelBest', (req, res) => {
    let obj = JSON.parse(fs.readFileSync('./public/jsonModel/bestshoes-model.json', 'utf8'));
    res.send(JSON.stringify(obj, null, 4));
});

app.post('/getModelBest26', (req, res) => {
    let obj = JSON.parse(fs.readFileSync('./public/jsonModel/best26-model.json', 'utf8'));
    res.send(JSON.stringify(obj, null, 4));
});

app.post('/createOrderArmbest', (req, res) => {
    let ip = req.headers['x-forwarded-for'];
    let orderExcel = [];
    let body = req.body;
    let obj = JSON.parse(fs.readFileSync('./public/jsonModel/armbest-model.json', 'utf8'));
    let cards = obj.cards;
    cards.forEach(card => {
        body.forEach(elem => {
            if (card.vendorCode == elem.art) {
                card.sizes.forEach(size => {
                    elem.sizes.forEach(sizeElem => {
                        if (size.techSize == sizeElem.size) {
                            orderExcel.push({
                                barcode: size.skus[0],
                                value: sizeElem.value,
                                count: elem.boxCount,
                                art: elem.art,
                                size: size.techSize,
                                INPUTBOX: sizeElem.boxCount,
                                trying: false
                            });
                        }
                    });
                });
            }
        });
    });

    // Сортировка orderExcel по артикулу и размеру (четвертый столбец)
    orderExcel.sort((a, b) => {
        if (a.art < b.art) return -1;
        if (a.art > b.art) return 1;
        if (a.size < b.size) return -1;
        if (a.size > b.size) return 1;
        return 0;
    });

    let wb = new xl.Workbook();
    let wbTwo = new xl.Workbook();
    let wsTwo = wbTwo.addWorksheet('Sheet 1')
    let ws = wb.addWorksheet('Sheet 1');

    let i = 1;
    ws.cell(1, 1).string('баркод');
    ws.cell(1, 2).string('количество');
    wsTwo.cell(1, 1).string('баркод');
    wsTwo.cell(1, 2).string('количество');
    orderExcel.forEach(element => {
        i++;
        ws.cell(i, 1).number(Number(element.barcode));
        ws.cell(i, 2).number(Number(element.value));
        ws.cell(i, 3).string(`${element.art}(${element.size})`);
        wsTwo.cell(i, 1).number(Number(element.barcode));
        wsTwo.cell(i, 2).number(Number(element.value));
    });
    wb.write(`deliveryArmbest/заказ_armbest.xlsx`);
    wbTwo.write(`deliveryArmbest/заказ_загружаю_armbest.xlsx`);

    let wbBinding = new xl.Workbook();
    let wsBinding = wbBinding.addWorksheet('Sheet 1');

    let wbUploadBinding = new xl.Workbook();
    let wsUpload = wbUploadBinding.addWorksheet('Sheet 1');

    wsBinding.cell(1, 1).string('баркод товара');
    wsUpload.cell(1, 1).string('баркод товара');

    wsBinding.cell(1, 2).string('кол-во товаров');
    wsUpload.cell(1, 2).string('кол-во товаров');

    wsBinding.cell(1, 3).string('шк короба');
    wsUpload.cell(1, 3).string('шк короба');

    wsBinding.cell(1, 4).string('срок годности');

    let r = 2;
    orderExcel.forEach(element => {
        let countBox = Number(element.value) / Number(element.INPUTBOX)

        if (countBox > 0) {
            let delimiter = element.value / element.INPUTBOX;
            for (let index = 0; index < delimiter; index++) {
                if ((Math.floor(countBox)) > 0) {
                    let fullcountbox = Number(element.value) / delimiter
                    wsBinding.cell(r, 1).number(Number(element.barcode));

                    wsBinding.cell(r, 2).number(fullcountbox);
                    wsBinding.cell(r, 4).string(`${element.art}(${element.size})`);

                    wsUpload.cell(r, 1).number(Number(element.barcode));
                    wsUpload.cell(r, 2).number(fullcountbox);

                }
                else {
                    let fullcountbox = Number(element.value) / delimiter
                    wsBinding.cell(r, 1).number(Number(element.barcode));

                    wsBinding.cell(r, 2).number(Number(delimiter % 1) * element.INPUTBOX);
                    wsBinding.cell(r, 4).string(`${element.art}(${element.size})`);

                    wsUpload.cell(r, 1).number(Number(element.barcode));
                    wsUpload.cell(r, 2).number(fullcountbox);

                }
                r++;
                countBox -= 1

            }
        } else {
            wsBinding.cell(r, 1).number(Number(element.barcode));
            wsBinding.cell(r, 2).number(Number(element.value));
            wsBinding.cell(r, 4).string(`${element.art}(${element.size})`);

            wsUpload.cell(r, 1).number(Number(element.barcode));
            wsUpload.cell(r, 2).number(Number(element.value));

            r++;
        }
    });

    wbBinding.write('deliveryArmbest/привязка_armbest.xlsx');
    wbUploadBinding.write('deliveryArmbest/привязка_загружаю_armbest.xlsx');
    setTimeout(() => {
        let to_zip = fs.readdirSync(__dirname + '/' + 'deliveryArmbest');
        let zp = new admz();
        for (var k = 0; k < to_zip.length; k++) {
            zp.addLocalFile(__dirname + '/' + 'deliveryArmbest' + '/' + to_zip[k]);
        }
        const file_after_download = 'downloaded_file.zip';
        const data = zp.toBuffer();

        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=${file_after_download}`);
        res.set('Content-Length', data.length);
        res.send(data);
        setTimeout(() => {
            const directory = "deliveryArmbest";
            fs.readdir(directory, (err, files) => {
                if (err) throw err;

                for (const file of files) {
                    fs.unlink(path.join(directory, file), (err) => {
                        if (err) throw err;
                    });
                }
            });
        }, 2000);
    }, 2000);
});

app.post('/createOrderBest', (req, res) => {
    let ip = req.headers['x-forwarded-for'];
    let orderExcel = [];
    let body = req.body;
    let obj = JSON.parse(fs.readFileSync('./public/jsonModel/bestshoes-model.json', 'utf8'));
    let cards = obj.cards;
    cards.forEach(card => {
        body.forEach(elem => {
            if (card.vendorCode == elem.art) {
                card.sizes.forEach(size => {
                    elem.sizes.forEach(sizeElem => {
                        if (size.techSize == sizeElem.size) {
                            orderExcel.push({
                                barcode: size.skus[0],
                                value: sizeElem.value,
                                count: elem.boxCount,
                                art: elem.art,
                                size: size.techSize,
                                INPUTBOX: sizeElem.boxCount,
                                trying: false

                            });
                        }
                    });
                });
            }
        });
    });

    // Сортировка orderExcel по артикулу и размеру (четвертый столбец)
    orderExcel.sort((a, b) => {
        if (a.art < b.art) return -1;
        if (a.art > b.art) return 1;
        if (a.size < b.size) return -1;
        if (a.size > b.size) return 1;
        return 0;
    });

    let wb = new xl.Workbook();
    let wbTwo = new xl.Workbook();
    let wsTwo = wbTwo.addWorksheet('Sheet 1')
    let ws = wb.addWorksheet('Sheet 1');

    let i = 1;
    ws.cell(1, 1).string('баркод');
    ws.cell(1, 2).string('количество');
    wsTwo.cell(1, 1).string('баркод');
    wsTwo.cell(1, 2).string('количество');
    orderExcel.forEach(element => {
        i++;
        ws.cell(i, 1).number(Number(element.barcode));
        ws.cell(i, 2).number(Number(element.value));
        ws.cell(i, 3).string(`${element.art}(${element.size})`);
        wsTwo.cell(i, 1).number(Number(element.barcode));
        wsTwo.cell(i, 2).number(Number(element.value));
    });
    wb.write(`deliveryBestshoes/заказ_best.xlsx`);
    wbTwo.write(`deliveryBestshoes/заказ_загружаю_best.xlsx`);

    let wbBinding = new xl.Workbook();
    let wsBinding = wbBinding.addWorksheet('Sheet 1');

    let wbUploadBinding = new xl.Workbook();
    let wsUpload = wbUploadBinding.addWorksheet('Sheet 1');

    wsBinding.cell(1, 1).string('баркод товара');
    wsUpload.cell(1, 1).string('баркод товара');

    wsBinding.cell(1, 2).string('кол-во товаров');
    wsUpload.cell(1, 2).string('кол-во товаров');

    wsBinding.cell(1, 3).string('шк короба');
    wsUpload.cell(1, 3).string('шк короба');

    wsBinding.cell(1, 4).string('срок годности');

    let r = 2;
    orderExcel.forEach(element => {
        let countBox = Number(element.value) / Number(element.INPUTBOX)

        if (countBox > 0) {
            let delimiter = element.value / element.INPUTBOX;
            for (let index = 0; index < delimiter; index++) {
                if ((Math.floor(countBox)) > 0) {
                    let fullcountbox = Number(element.value) / delimiter
                    wsBinding.cell(r, 1).number(Number(element.barcode));

                    wsBinding.cell(r, 2).number(fullcountbox);
                    wsBinding.cell(r, 4).string(`${element.art}(${element.size})`);

                    wsUpload.cell(r, 1).number(Number(element.barcode));
                    wsUpload.cell(r, 2).number(fullcountbox);

                }
                else {
                    let fullcountbox = Number(element.value) / delimiter
                    wsBinding.cell(r, 1).number(Number(element.barcode));

                    wsBinding.cell(r, 2).number(Number(delimiter % 1) * element.INPUTBOX);
                    wsBinding.cell(r, 4).string(`${element.art}(${element.size})`);

                    wsUpload.cell(r, 1).number(Number(element.barcode));
                    wsUpload.cell(r, 2).number(fullcountbox);

                }
                r++;
                countBox -= 1

            }
        } else {
            wsBinding.cell(r, 1).number(Number(element.barcode));
            wsBinding.cell(r, 2).number(Number(element.value));
            wsBinding.cell(r, 4).string(`${element.art}(${element.size})`);

            wsUpload.cell(r, 1).number(Number(element.barcode));
            wsUpload.cell(r, 2).number(Number(element.value));

            r++;
        }
    });

    wbBinding.write('deliveryBestshoes/привязка_best.xlsx');
    wbUploadBinding.write('deliveryBestshoes/привязка_загружаю_best.xlsx');
    setTimeout(() => {
        let to_zip = fs.readdirSync(__dirname + '/' + 'deliveryBestshoes');
        let zp = new admz();
        for (var k = 0; k < to_zip.length; k++) {
            zp.addLocalFile(__dirname + '/' + 'deliveryBestshoes' + '/' + to_zip[k]);
        }
        const file_after_download = 'downloaded_file.zip';
        const data = zp.toBuffer();

        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=${file_after_download}`);
        res.set('Content-Length', data.length);
        res.send(data);
        setTimeout(() => {
            const directory = "deliveryBestshoes";
            fs.readdir(directory, (err, files) => {
                if (err) throw err;

                for (const file of files) {
                    fs.unlink(path.join(directory, file), (err) => {
                        if (err) throw err;
                    });
                }
            });
        }, 1000);
    }, 1000);
});

app.post('/createOrderBest26', (req, res) => {
    let ip = req.headers['x-forwarded-for'];
    let orderExcel = [];
    let body = req.body;
    let obj = JSON.parse(fs.readFileSync('./public/jsonModel/best26-model.json', 'utf8'));
    let cards = obj.cards;
    cards.forEach(card => {
        body.forEach(elem => {
            if (card.vendorCode == elem.art) {
                card.sizes.forEach(size => {
                    elem.sizes.forEach(sizeElem => {
                        if (size.techSize == sizeElem.size) {
                            orderExcel.push({
                                barcode: size.skus[0],
                                value: sizeElem.value,
                                count: elem.boxCount,
                                art: elem.art,
                                size: size.techSize,
                                INPUTBOX: sizeElem.boxCount,
                                trying: false

                            });
                        }
                    });
                });
            }
        });
    });

    // Сортировка orderExcel по артикулу и размеру (четвертый столбец)
    orderExcel.sort((a, b) => {
        if (a.art < b.art) return -1;
        if (a.art > b.art) return 1;
        if (a.size < b.size) return -1;
        if (a.size > b.size) return 1;
        return 0;
    });

    let wb = new xl.Workbook();
    let wbTwo = new xl.Workbook();
    let wsTwo = wbTwo.addWorksheet('Sheet 1')
    let ws = wb.addWorksheet('Sheet 1');

    let i = 1;
    ws.cell(1, 1).string('баркод');
    ws.cell(1, 2).string('количество');
    wsTwo.cell(1, 1).string('баркод');
    wsTwo.cell(1, 2).string('количество');
    orderExcel.forEach(element => {
        i++;
        ws.cell(i, 1).number(Number(element.barcode));
        ws.cell(i, 2).number(Number(element.value));
        ws.cell(i, 3).string(`${element.art}(${element.size})`);
        wsTwo.cell(i, 1).number(Number(element.barcode));
        wsTwo.cell(i, 2).number(Number(element.value));
    });
    wb.write(`deliveryBest26/заказ_best26.xlsx`);
    wbTwo.write(`deliveryBest26/заказ_загружаю_best26.xlsx`);

    let wbBinding = new xl.Workbook();
    let wsBinding = wbBinding.addWorksheet('Sheet 1');

    let wbUploadBinding = new xl.Workbook();
    let wsUpload = wbUploadBinding.addWorksheet('Sheet 1');

    wsBinding.cell(1, 1).string('баркод товара');
    wsUpload.cell(1, 1).string('баркод товара');

    wsBinding.cell(1, 2).string('кол-во товаров');
    wsUpload.cell(1, 2).string('кол-во товаров');

    wsBinding.cell(1, 3).string('шк короба');
    wsUpload.cell(1, 3).string('шк короба');

    wsBinding.cell(1, 4).string('срок годности');

    let r = 2;
    orderExcel.forEach(element => {
        let countBox = Number(element.value) / Number(element.INPUTBOX)

        if (countBox > 0) {
            let delimiter = element.value / element.INPUTBOX;
            for (let index = 0; index < delimiter; index++) {
                if ((Math.floor(countBox)) > 0) {
                    let fullcountbox = Number(element.value) / delimiter
                    wsBinding.cell(r, 1).number(Number(element.barcode));

                    wsBinding.cell(r, 2).number(fullcountbox);
                    wsBinding.cell(r, 4).string(`${element.art}(${element.size})`);

                    wsUpload.cell(r, 1).number(Number(element.barcode));
                    wsUpload.cell(r, 2).number(fullcountbox);

                }
                else {
                    let fullcountbox = Number(element.value) / delimiter
                    wsBinding.cell(r, 1).number(Number(element.barcode));

                    wsBinding.cell(r, 2).number(Number(delimiter % 1) * element.INPUTBOX);
                    wsBinding.cell(r, 4).string(`${element.art}(${element.size})`);

                    wsUpload.cell(r, 1).number(Number(element.barcode));
                    wsUpload.cell(r, 2).number(fullcountbox);

                }
                r++;
                countBox -= 1

            }
        } else {
            wsBinding.cell(r, 1).number(Number(element.barcode));
            wsBinding.cell(r, 2).number(Number(element.value));
            wsBinding.cell(r, 4).string(`${element.art}(${element.size})`);

            wsUpload.cell(r, 1).number(Number(element.barcode));
            wsUpload.cell(r, 2).number(Number(element.value));

            r++;
        }
    });

    wbBinding.write('deliveryBest26/привязка_best26.xlsx');
    wbUploadBinding.write('deliveryBest26/привязка_загружаю_best26.xlsx');
    setTimeout(() => {
        let to_zip = fs.readdirSync(__dirname + '/' + 'deliveryBest26');
        let zp = new admz();
        for (var k = 0; k < to_zip.length; k++) {
            zp.addLocalFile(__dirname + '/' + 'deliveryBest26' + '/' + to_zip[k]);
        }
        const file_after_download = 'downloaded_file.zip';
        const data = zp.toBuffer();

        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename=${file_after_download}`);
        res.set('Content-Length', data.length);
        res.send(data);
        setTimeout(() => {
            const directory = "deliveryBest26";
            fs.readdir(directory, (err, files) => {
                if (err) throw err;

                for (const file of files) {
                    fs.unlink(path.join(directory, file), (err) => {
                        if (err) throw err;
                    });
                }
            });
        }, 2000);
    }, 2000);
});

// Подключение к бд
const dbApi = mysql.createPool({
    host: "192.168.100.170",
    user: "root",
    password: "root",
    database: "bestserver",
    waitForConnections: true,
    connectionLimit: 10,
});

// Ассоциация ID с названием компании для получения токена
const companyIDs = {
    Armbest: 3,
    Bestshoes: 6,
    Best26: 9,
};

// URL API для получения моделей
const url = "https://content-api.wildberries.ru/content/v2/get/cards/list";

// Функция ожидания
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Получение токена с бд
async function fetchToken(id, companyName, category) {
    try {
        const [rows] = await dbApi.execute(
            "SELECT token FROM api_data WHERE id = ? AND company_name = ? AND category = ?",
            [id, companyName, category]
        );
        if (rows.length === 0) throw new Error("Токен не найден.");
        return rows[0].token;
    } catch (error) {
        console.error("Ошибка при работе с базой данных:", error);
        throw error;
    }
}

// Основной функционал загрузки данных
async function fetchCards(companyName) {
    try {
        if (!companyIDs[companyName]) {
            throw new Error("Некорректное название компании.");
        }

        const id = companyIDs[companyName];
        const token = await fetchToken(id, companyName, "WB");

        let page = 1;
        const allCards = [];
        let settings = {
            settings: {
                cursor: {
                    limit: 100,
                },
                filter: {
                    withPhoto: -1,
                },
            },
        };

        console.log(`Загрузка данных для компании: ${companyName}`);

        while (true) {
            console.log(`Запрос страницы: ${page}`);
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    Authorization: `${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                console.error(`Ошибка запроса: ${response.statusText}`);
                if (response.status === 429) {
                    console.log("Слишком много запросов, ожидаем 10 секунд...");
                    await sleep(10000);
                    continue;
                }
                break;
            }

            const data = await response.json();
            const cards = data.cards || [];
            console.log(`Получено карточек: ${cards.length}`);

            const formattedCards = cards.map((item) => ({
                vendorCode: item.vendorCode,
                sizes: item.sizes?.map((size) => ({
                    chrtID: size.chrtID,
                    techSize: size.techSize,
                    skus: size.skus,
                })),
                updatedAt: item.updatedAt,
                createdAt: item.createdAt,
            }));
            allCards.push(...formattedCards);

            const cursor = data.cursor;
            if (!cursor || !cursor.updatedAt || !cursor.nmID) break;

            settings.settings.cursor.updatedAt = cursor.updatedAt;
            settings.settings.cursor.nmID = cursor.nmID;

            page++;
            await sleep(2000);
        }

        const fileName = `${companyName.toLowerCase()}-model.json`;

        let existingData = [];
        if (fs.existsSync(`./public/jsonModel/${fileName}`)) {
            existingData = JSON.parse(fs.readFileSync(`./public/jsonModel/${fileName}`, "utf8")).cards || [];
        }

        const newCards = allCards.filter(
            (newCard) => !existingData.some((existingCard) => existingCard.vendorCode === newCard.vendorCode)
        );

        const result = { cards: [...existingData, ...newCards] };
        fs.writeFileSync(`./public/jsonModel/${fileName}`, JSON.stringify(result, null, 2), "utf8");

        return newCards; // Возвращаем только новые карточки
    } catch (error) {
        console.error("Ошибка:", error);
        throw error;
    }
}

// Обработка выбора компании
app.post("/select-company", async (req, res) => {
    const companyName = req.body.company;

    // Маршрут для отображения формы
    app.get(`/${companyName.toLowerCase()}`, (req, res) => {
        res.sendFile(__dirname + `/public/${companyName.toLowerCase()}.html`);
    });
    try {
        const newCards = await fetchCards(companyName);
        const addedVendorCodes = newCards.map((card) => card.vendorCode);
        res.send(`
        <h1>Добавленные модели для компании ${companyName}:</h1>
        <a href="/${companyName.toLowerCase()}">Назад</a>
        <ul>
          ${addedVendorCodes.map((code) => `<li>${code}</li>`).join("")}
        </ul>
      `);
    } catch (error) {
        res.send(`<p>Ошибка: ${error.message}</p><a href="/${companyName.toLowerCase()}">Назад</a>`);
    }
});

// Главный маршрут для отображения страницы
app.get("/:companyName", (req, res) => {
    const companyName = req.params.companyName; // Извлекаем название компании из URL
    const FILE_PATH = path.join(__dirname, `./public/jsonModel/${companyName}-model.json`);
    // Проверяем, существует ли файл
    if (!fs.existsSync(FILE_PATH)) {
        return res.status(404).send(`<p>Файл для компании ${companyName} не найден.</p>`);
    }

    res.sendFile(path.join(__dirname, 'public', `${companyName}.html`)); // Возвращаем основную страницу
});

// Эндпоинт для получения всех данных
app.get('/:companyName/api/articles', async (req, res) => {
    const companyName = req.params.companyName; // Извлекаем название компании из URL
    const FILE_PATH = path.join(__dirname, `./public/jsonModel/${companyName}-model.json`); // Динамически формируем путь

    try {
        // Читаем данные из файла
        const modelData = await readJsonPath(FILE_PATH);

        // Формируем результат
        const result = modelData.cards.map(card => ({
            vendorCode: card.vendorCode,
            sizes: card.sizes.map(size => ({
                techSize: size.techSize,
                skus: size.skus
            }))
        }));

        res.json(result); // Отправляем результат
    } catch (error) {
        res.status(500).json({ error: `Ошибка чтения файла: ${error.message}` });
    }
});


// Эндпоинт для обновления или добавления данных
app.post('/api/update', async (req, res) => {
    try {
        const newData = req.body; // { vendorCode, Size, Pair }
        const filePath = path.join(__dirname, "public/Article.json");
        const data = await readJsonPath(filePath);

        // Проверяем, существует ли уже такая модель и размер
        const existingItem = data.find(
            (item) => item.vendorCode === newData.Vendorcode && item.Size === newData.Size
        );

        if (existingItem) {
            // Обновляем количество пар
            existingItem.Pair = newData.Pair; // Перезаписываем, если уже существует
        } else {
            // Добавляем новую запись
            data.push(newData);
        }

        // Сохраняем изменения
        writeJson(filePath, data);
        res.json({ message: 'Updated successfully!' });
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ error: 'Ошибка обновления файла.' });
    }
});

// Функция для чтения данных из JSON-файла
const readJsonPath = async (filePath) => {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
};

// Функция для записи данных в JSON-файл
const writeJson = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};
app.use((req, res, next) => {
    // Получаем IP-адрес клиента из запроса
    const clientIp = req.ip || req.connection.remoteAddress;
    console.log('Client IP:', clientIp);
    next();
});

// Путь к JSON-файлу
const DATA_FILE = path.join(__dirname, 'public/associations.json');

// Middleware для обработки JSON
app.use(express.json());
app.use(express.static('public')); // Для доступа к клиентским файлам

// Проверка существования файла JSON
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([{}])); // Создаем пустой массив
}

// Получение всех ассоциаций
app.get('/api/associations', (req, res) => {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json(data);
});

// Добавление новой ассоциации
app.post('/api/associations', (req, res) => {
    const { simple, full } = req.body;

    if (!simple || !full) {
        return res.status(400).json({ error: 'Простой и полный артикул обязательны' });
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    if (data.some((assoc) => assoc.simple === simple || assoc.full === full)) {
        return res.status(400).json({ error: 'Артикул уже существует' });
    }

    const newAssoc = { simple, full };
    data.push(newAssoc);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json(newAssoc);
});

// Удаление ассоциации
app.delete('/api/associations/:simple', (req, res) => {
    const { simple } = req.params;

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const index = data.findIndex((assoc) => assoc.simple === simple);

    if (index === -1) {
        return res.status(404).json({ error: 'Ассоциация не найдена' });
    }

    const deleted = data.splice(index, 1);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json(deleted[0]);
});

// Изменение ассоциации
app.put('/api/associations/:simple', (req, res) => {
    const { simple } = req.params;
    const { newSimple, newFull } = req.body;

    if (!newSimple || !newFull) {
        return res.status(400).json({ error: 'Простой и полный артикул обязательны' });
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const index = data.findIndex((assoc) => assoc.simple === simple);

    if (index === -1) {
        return res.status(404).json({ error: 'Ассоциация не найдена' });
    }

    if (
        data.some((assoc, i) => i !== index && (assoc.simple === newSimple || assoc.full === newFull))
    ) {
        return res.status(400).json({ error: 'Новые артикулы уже существуют' });
    }

    data[index] = { simple: newSimple, full: newFull };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    res.json(data[index]);
});

const PORT = 7000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Application listening on port ${PORT}!`);
})