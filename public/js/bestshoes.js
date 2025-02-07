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

async function allModel()
{
    let responce = await fetch('/getModelBest',
    {
        method : 'POST'
    });
    
    let res = await responce.json();
    
    let delimiter = res.cards.length/6;
    let cards = res.cards.sort((a, b) => parseFloat(a.vendorCode) - parseFloat(b.vendorCode));
    let index = 0
    let del_mod = [
        '003-blue', '003-black', '050черно-красный', '052сине-белый',
        '062черно-белый', '062черно-красный', 'В1-черно-белый',
        '071-2', '071-1', '091-8', '091-6', 'А22-черно-синий', 'А22-сине-голубой',
        '071-4', '091-2', 'А3-черно-синий', '051сине-голубой', '060сине-белый',
        'А20-сине-голубой', 'А3-сине-белый', 'А21-черно-синий', 'А21-сине-белый',
        '060черно-белый', '060черно-красный', '087', 'С1-синий', 'А3-сине-голубой',
        'А22-чено-белый', '12-черный', '081', '081-1', '083', '083-2', '083-1',
        '2626-brown', '2626-blue', '3636-black', '3737-black', 'А20-черно-синий',
        'С3-синий', 'С3-голубой', 'С3-розовый', 'С3-сиреневый', 'С1-сиреневый',
        'С1-розовый', 'С1-голубой', 'В23-сине-белый', 'В23-сине-красный', 'В23-черно-белый',
        'В23-черно-красный', 'В1-сине-белый', 'В1-черно-красный', 'В1-черно-синий',
        'В1-сине-голубой', 'В3-сине-голубой', 'В3-черно-белый', 'В3-сине-белый',
        'В3-черно-синий', 'А23-сине-красный', 'А23-черно-красный', 'А23-черно-белый',
        'А23-сине-белый', '063-зеленый', '071-8', 'А21-сине-голубой', 'А21-черно-белый',
        'А20-сине-белый', 'А20-бело-черный', 'А20-бело-синий', 'А20-черно-белый',
        'А20-черно-красный', 'А22-сине-белый', 'А22-бело-черный', 'А22-бело-синий',
        'А3-черно-белый', 'А3-черно-красный', '1-2-purple', '1-2-brown', '1-2-blue',
        '001-blue', '001-black', '3-бордовый', '3-синий', '3-фиолетовый', '010-blue',
        '010-black', '011-blue', '011-black', '050черно-синий', '050черно-белый',
        '051сине-белый', '051сине-красный', '052сине-голубой', '052черно-синий',
        '052черно-красный', '052черно-белый', '052сине-красный', '060черно-синий',
        '060-white', '060-серо-голубой', '060-серо-белый', '060сине-голубой',
        '060сине-красный', '060-серо-красный', '061черно-синий', '061сине-белый',
        '061сине-красный', '061сине-голубой', '061черно-красный', '061черно-белый',
        '062черно-синий', '063-голубой', '063-желтый', '063-синий', '063-белый',
        '063-сиреневый', '063-персиковый', '063-розовый',
	    '071', '071-7', '071-6', '071-3', '071-5', '074-10', '074-1',
        '074', '074-2', '074-3', '074-6', '074-7', '074-5', '074-8', '074-12',
        '074-4', '081-2', '082-1', '082', '082-2', '084',
        '084-1', '084-2', '087-2', '087-1',
        '089-1', '089-3', '089', '091-7', '091-11', '091-3', '091-4', '091-5', '092-8',
        '092-3', '092-7', '092-11', '092-10', '092-6', '092-2', '092-4', '092-5',
        '094-2', '094-11', '094-3', '094-4', '094-5', '094-8', '094-6', '094-7',
        '094-10', '094-1', '402-1402-1-camouflage', '411-1', '2323-purple',
        '4040-brown', '4040-blue', '4040-purple', '303303-black', '412412-black',
        '600-бордовый', '600-камуфляж', '602-бордовый', '602-камуфляж', '700-камуфляж',
        '700-бордовый', '702-камуфляж', '702-бордовый', '076-10', '076-8', '076-7',
        '076-12', '076', '076-1', '076-2'
    ]
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
                const jsonUrl1 = 'jsonModel/bestshoes-model.json';
                const jsonUrl2 = 'Article.json';
                let inputsAll = document.querySelectorAll('.sizeBox');
                const inputsArray = Array.from(inputsAll);

                // Функция для загрузки и сравнения данных!!!
                async function fetchAndCompareJson() {
                    try {

                        // Загрузка данных из первого JSON файла
                        const response1 = await fetch(jsonUrl1);
                        if (!response1.ok) throw new Error('Ошибка при загрузке bestshoes.json');
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
                        fetch('/createOrderBest',
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
                                a.download = "Best Shoes файлы поставки.zip";
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