async function processFiles() {
    const input1 = document.getElementById('fileInput1');
    const input2 = document.getElementById('fileInput2');
    let main = document.getElementById('main')
    if (!input1.files[0] || !input2.files[0]) {
        if (!input1.files[0]) {
            alert('Выберите файлы со штрихкодами');
        }
        if (!input2.files[0]) {
            alert('Выберите файлы с поставкой');
        }
        alert('Выберите два файла!');
        return;
    }
    const file1 = input1.files[0];
    const file2 = input2.files[0];
    const reader1 = new FileReader();
    const reader2 = new FileReader();

    let workbook1, workbook2;

    reader1.onload = function(event) {
        const data = new Uint8Array(event.target.result);
        workbook1 = XLSX.read(data, {type: 'array'});
        reader2.readAsArrayBuffer(file2);
    };

    reader2.onload = async function(event) {
        const data = new Uint8Array(event.target.result);
        workbook2 = XLSX.read(data, {type: 'array'});

        const firstSheet1 = workbook1.Sheets[workbook1.SheetNames[0]];
        const firstSheet2 = workbook2.Sheets[workbook2.SheetNames[0]];

        const rows1 = XLSX.utils.sheet_to_json(firstSheet1, {header: 1});
        const rows2 = XLSX.utils.sheet_to_json(firstSheet2, {header: 1});
        const headers1 = rows1[0];
        const headers2 = rows2[0];

        const rowsNew1 = rows1.slice(1);
        const rowsNew2 = rows2.slice(1);
        rows2.forEach((header, index) => {
            if (rowsNew2[index] && rowsNew1[index]) {
                rowsNew2[index][2] = rowsNew1[index][2];
            }
        });


        let del_array = [];
        let firstElem;
        let secondElem;

        rows2.forEach((card1,i) => {
            console.log(card1)
            let freeSpace = 0;
            if (i > 0) {
                card1.forEach((card2,j) => {
                if (j == 3) {
                    let str = card2;
                    if (str) {
                        let matches = str.matchAll(/\(([^)]+)\)/g);
                        for (let match of matches) {
                            freeSpace = Number(card1[1]);
                            if (match[1] <= 29 && freeSpace > 0 && freeSpace <= 20 ) {
                                firstElem = card1;
                                rows2.forEach((card3,k) => {
                                    if (k > 0) {
                                        // card3 - перебор всех карточек еще раз
                                        card3.forEach((card4,l) => {
                                            if (l == 1) {
                                                // card4 - количество указанное в карточках
                                                let str = card3[3];
                                                if (str) {
                                                    let matches2 = str.matchAll(/\(([^)]+)\)/g);
                                                    for (let match2 of matches2) {
                                                        freeSpace2 = card4;
                                                        secondElem = card3;
                                                        // match2[1] - размер 2
                                                        // freespace2 - свободное место во второй паре
                                                        // match[1] - размер 1
                                                        if (match2[1] <= 29 && freeSpace2 > 0 && freeSpace2 <= 20 && del_array.includes(card1) == false && !del_array.includes(card3) && match[1] != match2[1] && match[0] != match2[0]) {
                                                            card1[2] = card3[2];
                                                            del_array.push(card1, card3);
                                                        }
                                                    }
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        }
                    }
                }
            });
        }
    });

        // Загрузка на комп пользователя нового файла

        const newSheet = XLSX.utils.aoa_to_sheet([headers2, ...rowsNew2]);
        workbook2.Sheets[workbook2.SheetNames[0]] = newSheet;

        const newExcelFile = XLSX.write(workbook2, {bookType: 'xlsx', type: 'binary'});
        const blob = new Blob([s2ab(newExcelFile)], {type: "application/octet-stream"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "updated_file.xlsx";
        link.click();

        setTimeout(() => {
            main.innerHTML = `
                <video class="video" autoplay>
                    <source src="../download.mp4" />
                </video>`;
            setTimeout(() => {
                // window.location.replace("/armbest");
            }, 1000);
        }, 1000);
    };
    reader1.readAsArrayBuffer(file1);
}

function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; ++i) {
        view[i] = s.charCodeAt(i) & 0xFF;
    }
    return buf;
}