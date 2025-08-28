import io
import os
import zipfile
from reportlab.lib.units import mm
from reportlab.graphics.barcode import code128
from reportlab.pdfgen.canvas import Canvas
from utils.data_processing import get_all_data, filter_color, HEADERS
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
# Получаем путь к папке скрипта
script_dir = os.path.dirname(os.path.abspath(__file__))
font_path_bold = os.path.join(script_dir, '../assets', 'fonts', 'calibri_bold.ttf')

# Регистрация шрифтов с поддержкой кириллицы
pdfmetrics.registerFont(TTFont('Calibribd', font_path_bold))

def width(self):
    """Вспомогательная функция для определения ширины штрихкода."""
    self._calculate()
    return self._width

def add_pdf_page(c, brand, city, barcode, number=""):
    """Добавляет одну страницу с этикеткой в PDF."""
    c.rotate(90)
    c.setFillColorRGB(0, 0, 0, 1)
    c.setFont("Calibribd", 28)
    c.drawCentredString(60*mm, -10*mm, "OZON")

    c.setFont("Calibribd", 18)
    if brand == "Armbest":
        c.rect(10 * mm, -13 * mm, 100 * mm, -15 * mm, 1, 1)
        c.setFillColorRGB(1, 1, 1, 1)
    c.drawCentredString(60*mm, -20*mm, brand)
    c.drawCentredString(60*mm, -26*mm, barcode)
    c.setFillColorRGB(0, 0, 0, 1)
    if number:
        c.drawCentredString(100*mm, -10*mm, "\u2116 "+number)

    c.drawCentredString(20*mm, -10*mm, city)
    code_width = 121
    bar_width = 1
    barcode_str = str(barcode)
    while code_width > 120:
        code_im = code128.Code128(barcode_str, barWidth=bar_width*mm, barHeight=40*mm)
        code_width = width(code_im)/mm
        bar_width -= 0.1
    code_im.drawOn(c, ((120 * mm)/2)-(width(code_im)/2) , -70 * mm)
    c.showPage()

def json_to_pdf_buffer(brand, city, models, number):
    """
    Генерирует PDF-файлы в памяти, создает ZIP-архив с отдельными PDF 
    и один общий PDF со всеми этикетками.
    Возвращает кортеж: (zip_buffer, combined_pdf_buffer, warnings, duplicates)
    """
    zip_buffer = io.BytesIO()
    combined_pdf_buffer = io.BytesIO()
    combined_canvas = Canvas(combined_pdf_buffer, pagesize=(75 * mm, 120 * mm))
    warnings = []
    duplicates = set()
    written_files = set()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for row_key, model_data in models.items():
            article = model_data["article"]
            box_count_file = model_data["box_count_file"]
            box_count_calc = model_data["box_count_calc"]
            counts = model_data["counts"]

            # Проверка расхождений
            if box_count_file != box_count_calc:
                warnings.append(
                    f"Предупреждение для {article}: box_count_file ({box_count_file}) != box_count_calc ({box_count_calc}). Используется box_count_file для генерации."
                )

            for count_data in counts:
                size = count_data["size"]
                num_boxes_for_size = count_data.get("boxes", 1)
                barcode_content = f"{article} ({size})"
                pdf_filename_in_zip = f"{brand}/{article}/{size}.pdf"

                # Проверка дубликатов
                if pdf_filename_in_zip in written_files:
                    duplicates.add(pdf_filename_in_zip)
                    continue  # Не добавляем дубликат!
                written_files.add(pdf_filename_in_zip)

                single_pdf_buffer = io.BytesIO()
                single_canvas = Canvas(single_pdf_buffer, pagesize=(75 * mm, 120 * mm))
                for i in range(num_boxes_for_size):
                    add_pdf_page(single_canvas, brand, city, barcode_content, str(number))
                    add_pdf_page(combined_canvas, brand, city, barcode_content, str(number))
                single_canvas.save()
                single_pdf_buffer.seek(0)
                zip_file.writestr(pdf_filename_in_zip, single_pdf_buffer.getvalue())
                single_pdf_buffer.close()

        combined_canvas.save()
        combined_pdf_buffer.seek(0)

    zip_buffer.seek(0)
    return zip_buffer, combined_pdf_buffer, warnings, list(duplicates)