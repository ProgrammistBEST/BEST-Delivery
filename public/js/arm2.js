let main = document.getElementById('main');

main.innerHTML = 
`<div class="model row">
    <div class="col model-1"></div>
    <div class="col model-2"></div>
    <div class="col model-3"></div>
    <div class="col model-4"></div>
    <div class="col model-5"></div>
    <div class="col model-6"></div>
</div>`;

async function allModel(){
    let responce = await fetch('/getModelArm2',
        {
            method: 'POST'
        });

    let res = await responce.json();
    console.log(res)
    
    let delimiter = res.cards.length/6;
    let cards = res.cards.sort((a, b) => parseFloat(a.vendorCode) - parseFloat(b.vendorCode));
    let index = 0
    let del_mod = []
    cards.forEach(card => {
        index++;
        let name = card.vendorCode;
        if (!(del_mod.includes(name))) 
        {
            let sizes = card.sizes;
            if (index <= delimiter)
            {
                document.querySelector('.model-1').insertAdjacentHTML('beforeend',
                    `<div>
                        <input type="checkbox" id="${name}" />
                        <label for="${name}">${name}</label>
                    </div>
                    `);
            }else if (index > delimiter && index <= delimiter * 2)
            {
                document.querySelector('.model-2').insertAdjacentHTML('beforeend',
                    `<div>
                        <input type="checkbox" id="${name}" />
                        <label for="${name}">${name}</label>
                    </div>
                    `);
            }else if (index > delimiter * 2 && index <= delimiter * 3)
            {
                document.querySelector('.model-3').insertAdjacentHTML('beforeend',
                    `<div>
                        <input type="checkbox" id="${name}" />
                        <label for="${name}">${name}</label>
                    </div>
                    `);
            }else if (index > delimiter * 3 && index <= delimiter * 4)
            {
                document.querySelector('.model-4').insertAdjacentHTML('beforeend',
                    `<div>
                        <input type="checkbox" id="${name}" />
                        <label for="${name}">${name}</label>
                    </div>
                    `);
            }else if (index > delimiter * 4 && index <= delimiter * 5)
            {
                document.querySelector('.model-5').insertAdjacentHTML('beforeend',
                `<div>
                    <input type="checkbox" id="${name}" />
                    <label for="${name}">${name}</label>
                </div>
                `); 
            }else
            {
                document.querySelector('.model-6').insertAdjacentHTML('beforeend',
                `<div>
                    <input type="checkbox" id="${name}" />
                    <label for="${name}">${name}</label>
                </div>
                `);
            }
        }
    });
    document.querySelector('.model').insertAdjacentHTML('afterend',
    `
        <div class="btn btn-success btn-create">Сформировать</div>
    `);
    document.querySelector('.btn-create').addEventListener('click', function()
    {
        let checkedTrue = [];
        for (let i = 0; i<document.querySelector('.model').querySelectorAll('input').length; i++)
        {
            if (document.querySelector('.model').querySelectorAll('input')[i].checked)
            {
                checkedTrue.push(document.querySelector('.model').querySelectorAll('input')[i]);
            }
        }
        if (checkedTrue.length != 0)
        {
            if (document.querySelector('.checked-model') == null)
            {
                this.insertAdjacentHTML('afterend', 
                `
                    <div class="checked-model"></div>
                `);
                let countN = 1;
                checkedTrue.forEach(input => {
                    cards.forEach(card => {
                        if (input.id == card.vendorCode)
                        {
                            document.querySelector('.checked-model').insertAdjacentHTML('beforeend',
                            `
                                <div class="row row-model bg bg-light" id="row-${card.vendorCode}">
                                    <div id='${card.vendorCode}' class="col-1 name">${card.vendorCode}</div>
                                    <div class="col-1 box-value">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-seam-fill" viewBox="0 0 16 16">
                                            <path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.01-.003.268-.108a.75.75 0 0 1 .558 0l.269.108.01.003 6.97 2.789ZM10.404 2 4.25 4.461 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339L8 5.961 5.596 5l6.154-2.461L10.404 2Z"/>
                                        </svg>
                                    </div>
                                </div>
                            `);
                            card.sizes.sort((a, b) => parseFloat(a.techSize) - parseFloat(b.techSize)).forEach(size => {
                                document.getElementById(`row-${card.vendorCode}`).insertAdjacentHTML('beforeend',
                                `
                                    <div class="col-1 col-size">
                                        <input type="number" number='' class="input-size ${'Item'+size.techSize}" placeholder="${size.techSize}" style="text-align: center; border-radius: 10px"/>
                                        <input type='number' id='${card.vendorCode}' number='' tabindex="-1" class='box-input sizeBox ${'Item'+size.techSize}' placeholder='${size.techSize}' value='20' style="text-align: center; border-radius: 10px, width: 20px"/>
                                    </div>
                                `);
                            });
                            document.querySelectorAll(`.row-model`)[document.querySelectorAll(`.row-model`).length - 1].insertAdjacentHTML('beforeend',
                            `
                                <div class="col-1 col-del btn btn-danger">Удалить</div>
                            `);
                            countN++;
                        }
                    });
                });
                const jsonUrl1 = 'jsonModel/arm2-model.json';
                const jsonUrl2 = 'Article.json';
                let inputsAll = document.querySelectorAll('.sizeBox');
                const inputsArray = Array.from(inputsAll);

                // Функция для загрузки и сравнения данных!!!
                async function fetchAndCompareJson() {
                    try {

                        // Загрузка данных из первого JSON файла
                        const response1 = await fetch(jsonUrl1);
                        if (!response1.ok) throw new Error('Ошибка при загрузке bad best.json');
                        const data1 = await response1.json();

                        // Загрузка данных из второго JSON файла
                        const response2 = await fetch(jsonUrl2);
                        if (!response2.ok) throw new Error('Ошибка при загрузке Article.json');
                        const data2 = await response2.json();
                       
                        inputsArray.forEach(input => {
                            data2.forEach(item1 => {
                                if (input.id == item1.Vendorcode && input.placeholder == item1.Size) {
                                    input.value = item1.Pair
                                }
                            }
                        )})
                    } catch (error) {
                        console.error('Произошла ошибка:', error);
                    }
                }

                fetchAndCompareJson();

                for (let r = 0; r<document.querySelectorAll(`.col-del`).length; r++)
                {
                    document.querySelectorAll(`.col-del`)[r].addEventListener('click', function() {
                        this.parentNode.parentNode.removeChild(this.parentNode);
                    });
                }
                document.querySelectorAll('.row-model')[document.querySelectorAll('.row-model').length - 1].insertAdjacentHTML('afterend',
                `
                    <div id="hiddenContainerDiv" class="btn btn-success btn-create-excel">Создать файлы для поставки</div>
                `);
                const closeFormContainer = document.getElementById('hiddenContainerDiv');
                const formContainerDiv = document.getElementById('container-hidden'); 
                // Закрыть форму
                closeFormContainer.addEventListener('click', () => {
                    formContainerDiv.classList.add('hidden');
                });
                
                // Обработка нажатия на кнопку "Создать файлы для поставки"
                let sendBtn = document.querySelector('.btn-create-excel');
                sendBtn.addEventListener('click', async function()
                {
                    let sendObj = []; 
                    document.querySelectorAll('.box-input').forEach(input => {
                        if (input.value == '')
                        {
                            input.style.border = '2px solid red';
                            alert('Есть пустые обязательные поля')
                        }
                    });
                    document.querySelectorAll('.row-model').forEach(row =>{
                        let valueChecked = [];
                        row.querySelectorAll('.input-size').forEach(inputSize => {
                            inputsArray.forEach( item => {
                                if (item.placeholder == inputSize.placeholder)
                                    {
                                        inputSize.name = item.value
                                    }
                                    else {

                                    }
                            });
                            if (inputSize.value == '')
                            {
                                valueChecked.push(inputSize);
                            }
                        });
                        if (valueChecked.length == row.querySelectorAll('.input-size').length)
                        {
                            let alertCount = 0;
                            valueChecked.forEach(badInput => {
                                badInput.style.border = '2px solid red';
                                if (alertCount < 1)
                                {
                                    document.querySelector('.row-model').insertAdjacentHTML('beforebegin',
                                    `
                                        <div class="alert alert-danger" role="alert">
                                        ${badInput.parentNode.parentNode.querySelector('.name').textContent} не указанно колличество!
                                        </div> 
                                    `);
                                }
                                alertCount++; 
                            });
                            setTimeout(() => {
                                document.querySelector('.alert').parentNode.removeChild(document.querySelector('.alert'))
                            }, 1000);
                        }else
                        {
                           sendObj.push({
                            art : row.querySelector('.name').textContent,
                            boxCount: row.querySelector('.box-input').value,
                            sizes: []
                           });
                           sendObj.forEach(item => {
                            item.sizes.forEach(sizeList => {
                                document.querySelectorAll('.box-input').forEach(input => {
                                    if (input.id == item.art && input.placeholder == sizeList.size){
                                        sizeList.boxCount = input.value
                                    }
                                })
                            }) 
                       })
                           row.querySelectorAll('.input-size').forEach(inputSize => {
                            if (inputSize.value != '')
                            {
                                sendObj[sendObj.length - 1].sizes.push({
                                    size : inputSize.placeholder,
                                    value: inputSize.value,
                                    boxCount: inputSize.name                         
                                });
                            }
                           });
                        }
                    });
                    if (sendObj.length == document.querySelectorAll('.row-model').length)
                    {
                        main.innerHTML = `
                        <div class="wait">
                            <h1 class="title-wait">Ждите...</h1>
                            <img src="../img/loading-wtf.gif" />
                        </div>`;
                        fetch('/createOrderArm2',
                        {
                            method : 'POST',
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(sendObj)
                        }).then(res => res.blob())
                            .then(data => {
                                var a = document.createElement("a");
                                a.href = window.URL.createObjectURL(data);
                                a.download = "Arm2 Shoes файлы поставки.zip";
                                setTimeout(() => {
                                    main.innerHTML = `
                                    <video class="video" autoplay>
                                        <source src="../download.mp4" />
                                    </video>`;
                                    a.click();
                                    main.innerHTML =
                                    `
                                        <div class="merge_files">
                                            <div class="merge_files_box1">
                                                <h1 class="merge_files_h1"></h1>
                                                <label style="position: relative; top: -30px; left: 115px; font-size: 20px; " for="shtrihcod">Штрихкоды</label>
                                                <input name="shtrihcod" class="change_file" placeholder="Штрихкоды" type="file" id="fileInput1" accept=".xlsx">
                    
                                                <label style="position: relative; top: -30px; left: 102px; font-size: 20px; " for="shtrihcod">Поставка</label>
                                                <input name="postfile" class="change_file" placeholder="Поставка" type="file" id="fileInput2" accept=".xlsx">
                                            </div>
                                            <div class="merge_files_box2">
                                                <button class="postNewEXCEL" onclick="processFiles()">Объединить</button>    
                                            </div>
                                        </div>
                                        `
                                    setTimeout(() => {
                                        // window.location.replace("/best");
                                    }, 6000)
                                }, 1000);
                            });
                    }
                });
            }
        }else
        {
            alert('Вы не ничего не выбрали!')
        }
    });
}

allModel();