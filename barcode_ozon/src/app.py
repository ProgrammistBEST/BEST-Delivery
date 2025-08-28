# app.py
import os
import sys
from flask import Flask, request, jsonify, send_file
import traceback # Для более подробной информации об ошибках
from flask_cors import CORS
import io
import zipfile
script_dir = os.path.dirname(os.path.abspath(__file__))
Articles_file = os.path.join(script_dir, '../../public' , 'Article.json')
association_json_path = os.path.join(script_dir, '../../public' , 'associations.json')
# Импортируем функции из других модулей
from utils.data_processing import excel_to_json_from_stream, HEADERS
from utils.pdf_utils import json_to_pdf_buffer

# Определяем путь к ресурсам в зависимости от среды выполнения
if getattr(sys, 'frozen', False):
    # Если запущено из .exe
    base_path = sys._MEIPASS
else:
    # Если запущено как обычный .py файл
    base_path = os.path.dirname(os.path.abspath(__file__))

# Переключаем рабочую директорию (может быть не обязательно, зависит от путей)
# os.chdir(base_path) # Лучше избегать смены рабочей директории в веб-приложении

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # Максимальный размер загружаемого файла 100MB

# Настройка папки для загрузок (временная папка для Excel файлов)
UPLOAD_FOLDER = os.path.join(base_path, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Регистрация шрифтов (если нужно использовать в PDF)
# from reportlab.pdfbase import pdfmetrics
# from reportlab.pdfbase.ttfonts import TTFont
# pdfmetrics.registerFont(TTFont("Calibribd", os.path.join(base_path, "fonts", "calibri_bold.ttf")))

@app.route('/health', methods=['GET'])
def health_check():
    """Простой эндпоинт для проверки состояния сервера."""
    return jsonify({"status": "ok"}), 200

@app.route('/generate_labels_from_excel', methods=['POST'])
def generate_labels_from_excel():
    try:
        # --- Проверки и получение данных (без изменений) ---
        if 'file' not in request.files:
            return jsonify({'error': 'Файл не предоставлен'}), 400
        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'Имя файла пустое'}), 400

        ALLOWED_EXTENSIONS = {'.xlsx', '.xlsm', '.xltx', '.xltm'}
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in ALLOWED_EXTENSIONS:
            return jsonify({'error': f'Неподдерживаемый формат файла. Разрешены: {", ".join(ALLOWED_EXTENSIONS)}'}), 400

        file_stream = io.BytesIO(file.read())

        brand = request.form.get('brand')
        supply_number = request.form.get('supply_number', "")
        city = request.form.get('city', "")

        if not brand or brand not in HEADERS:
            return jsonify({'error': 'Неверный или отсутствующий бренд'}), 400

        models_data = excel_to_json_from_stream(file_stream, Articles_file, association_json_path)
        # --- Конец проверок и получения данных ---

        # --- Генерация PDF в памяти ---
        # zip_buffer - содержит структуру папок с отдельными PDF
        # combined_pdf_buffer - содержит один PDF со всеми этикетками
        zip_buffer, combined_pdf_buffer, warnings, duplicates = json_to_pdf_buffer(brand, city, models_data, str(supply_number))

        if duplicates:
            return jsonify({
                'error': 'Обнаружены дубликаты PDF файлов. Пожалуйста, удалите их и повторите процесс.',
                'duplicates': duplicates
            }), 400

        if warnings:
            return jsonify({
                'warning': 'Обнаружены несоответствия данных. Требуется подтверждение/коррекция.',
                'warnings': warnings,
                'raw_data': models_data
            }), 202

        # --- Создание финального ZIP-архива ---
        final_zip_buffer = io.BytesIO()
        
        # Создаем новый ZIP-файл в памяти
        with zipfile.ZipFile(final_zip_buffer, 'w', zipfile.ZIP_DEFLATED) as final_zip:
            # 1. Добавляем оригинальный структурированный ZIP
            zip_buffer.seek(0) # Убедимся, что читаем с начала
            final_zip.writestr(f"{brand}_{supply_number or 'labels'}_structured.zip", zip_buffer.getvalue())
            
            # 2. Добавляем объединенный PDF
            combined_pdf_buffer.seek(0) # Убедимся, что читаем с начала
            final_zip.writestr(f"{brand}_{supply_number or 'labels'}_all.pdf", combined_pdf_buffer.getvalue())

        final_zip_buffer.seek(0) # Перемещаем указатель в начало для отправки

        # --- Отправка финального ZIP-архива клиенту ---
        final_filename = f"{brand}_{supply_number or 'labels'}_package.zip"
        return send_file(
            final_zip_buffer,
            as_attachment=True,
            download_name=final_filename,
            mimetype='application/zip'
        )

    except Exception as e:
        print(f"Ошибка в /generate_labels_from_excel: {e}")
        # traceback.print_exc() # Убедитесь, что traceback импортирован
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Произошла ошибка: {str(e)}'}), 500

@app.route('/update_barcodes_from_ozon', methods=['POST'])
def update_barcodes_from_ozon():
    """
    Эндпоинт для обновления/скачивания этикеток напрямую из Ozon.
    Ожидает:
    - JSON с 'brands' (список строк: ["ARMBEST", "BEST 26"] или один бренд)
    Возвращает:
    - JSON с информацией об успехе/ошибке
    """
    try:
        data = request.get_json()
        brands = data.get('brands', [])

        if not isinstance(brands, list):
            return jsonify({'error': 'Поле brands должно быть списком'}), 400

        # Проверка брендов
        valid_brands = [b for b in brands if b in HEADERS]
        if not valid_brands:
            return jsonify({'error': 'Нет допустимых брендов для обновления'}), 400

        # Вызов функции обновления для каждого бренда
        # for brand in valid_brands:
        #      barcodes_from_ozon(brand)

        return jsonify({'message': f'Этикетки для брендов {valid_brands} обновлены'}), 200

    except Exception as e:
        print(f"Ошибка в /update_barcodes_from_ozon: {e}")
        traceback.print_exc()
        return jsonify({'error': f'Произошла ошибка при обновлении: {str(e)}'}), 500

@app.route('/resolve_label_warnings', methods=['POST'])
def resolve_label_warnings():
    """
    Получает исправленные данные от клиента, генерирует архив и PDF.
    """
    try:
        data = request.get_json()
        brand = data.get('brand')
        city = data.get('city')
        supply_number = data.get('supply_number', "")
        models_data = data.get('models_data')

        if not brand or not models_data:
            return jsonify({'error': 'Отсутствуют необходимые данные'}), 400

        zip_buffer, combined_pdf_buffer, warnings, duplicates = json_to_pdf_buffer(brand, city, models_data, str(supply_number))

        if duplicates:
            return jsonify({
                'error': 'Обнаружены дубликаты PDF файлов. Пожалуйста, удалите их и повторите процесс.',
                'duplicates': duplicates
            }), 400

        # --- Создание финального ZIP-архива ---
        final_zip_buffer = io.BytesIO()
        with zipfile.ZipFile(final_zip_buffer, 'w', zipfile.ZIP_DEFLATED) as final_zip:
            final_zip.writestr(f"{brand}_{supply_number or 'labels'}_structured.zip", zip_buffer.getvalue())
            final_zip.writestr(f"{brand}_{supply_number or 'labels'}_all.pdf", combined_pdf_buffer.getvalue())
        final_zip_buffer.seek(0)
        final_filename = f"{brand}_{supply_number or 'labels'}_package.zip"
        return send_file(
            final_zip_buffer,
            as_attachment=True,
            download_name=final_filename,
            mimetype='application/zip'
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Произошла ошибка: {str(e)}'}), 500

CORS(app)
if __name__ == '__main__':
    # Убедитесь, что папки существуют
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)
