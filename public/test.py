import json

def normalize_size_grid(sizes):
    """Нормализуем размерную сетку - сортируем элементы для обеспечения уникальности"""
    # Создаем копию и сортируем по правилам:
    # 1. Сначала числовые размеры по возрастанию
    # 2. Потом диапазоны, сортируя по первому числу в диапазоне
    
    def sort_key(size):
        if '-' in size:
            # Для диапазонов типа "41-42" берем первое число
            try:
                return int(size.split('-')[0])
            except:
                return size
        else:
            # Для обычных чисел
            try:
                return int(size)
            except:
                return size
    
    return sorted(sizes, key=sort_key)

size_grids = [
    ["24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35"],
    ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
    ["41", "42", "43", "44", "45", "46", "47", "48"],
    ["27-28", "29-30", "31-32", "33-34", "35-36"],
    ["35-36", "37", "38", "39", "40", "41-42"],
    ["40-41", "42", "43", "44", "45", "46-47"]
]

# Загружаем JSON
with open("jsonModel/armbest-model.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Результат
result = []

# Словарь для отслеживания, к каким сеткам относится каждая модель
model_to_grids = {}

# Словарь для отслеживания уникальных размерных сеток
unique_grids = {}

# Проходим по каждому размерному ряду
for i, grid in enumerate(size_grids):
    normalized_grid = normalize_size_grid(grid)
    grid_tuple = tuple(normalized_grid)  # Преобразуем в кортеж для использования в словаре
    grid_entry = {
        "grid_id": i + 1,
        "sizes": normalized_grid,
        "models": []
    }

    # Проходим по всем моделям
    for card in data["cards"]:
        vendor_code = card["vendorCode"]
        tech_sizes = [size["techSize"] for size in card["sizes"]]
        normalized_tech_sizes = normalize_size_grid(tech_sizes)

        # Проверяем, все ли размеры модели входят в текущий размерный ряд
        if all(size in grid for size in tech_sizes):
            # Отмечаем, что модель подходит к этой сетке
            if vendor_code not in model_to_grids:
                model_to_grids[vendor_code] = []
            model_to_grids[vendor_code].append(i + 1)

            # Добавляем в существующую сетку или создаем новую
            if grid_tuple in unique_grids:
                # Добавляем модель к существующей уникальной сетке
                if vendor_code not in unique_grids[grid_tuple]["models"]:
                    unique_grids[grid_tuple]["models"].append(vendor_code)
            else:
                # Создаем новую уникальную сетку
                unique_grids[grid_tuple] = {
                    "grid_id": len(unique_grids) + 1,
                    "sizes": normalized_grid,
                    "models": [vendor_code]
                }

# Находим модели, которые не подошли ни к одной сетке
all_models = {card["vendorCode"] for card in data["cards"]}
assigned_models = set(model_to_grids.keys())
unassigned_models = all_models - assigned_models

# Создаем отдельные сетки для неприсвоенных моделей
for vendor_code in unassigned_models:
    # Находим карточку модели
    card = next(card for card in data["cards"] if card["vendorCode"] == vendor_code)
    tech_sizes = [size["techSize"] for size in card["sizes"]]
    normalized_tech_sizes = normalize_size_grid(tech_sizes)
    grid_tuple = tuple(normalized_tech_sizes)
    
    # Проверяем, существует ли уже такая сетка
    if grid_tuple in unique_grids:
        # Добавляем модель к существующей сетке
        if vendor_code not in unique_grids[grid_tuple]["models"]:
            unique_grids[grid_tuple]["models"].append(vendor_code)
    else:
        # Создаем новую сетку с размерами этой модели
        new_grid_id = len(unique_grids) + 1
        unique_grids[grid_tuple] = {
            "grid_id": new_grid_id,
            "sizes": normalized_tech_sizes,
            "models": [vendor_code]
        }

# Преобразуем словарь уникальных сеток в список
result = list(unique_grids.values())

# Удаляем дубликаты моделей из сеток (оставляем только в первой найденной сетке)
assigned_models_clear = set()
for grid_entry in result:
    unique_models = []
    for model in grid_entry["models"]:
        if model not in assigned_models_clear:
            unique_models.append(model)
            assigned_models_clear.add(model)
        # else: пропускаем дубликат
    grid_entry["models"] = unique_models

# Сортируем результат по grid_id для порядка
result.sort(key=lambda x: x["grid_id"])

# Переназначаем grid_id по порядку
for i, grid_entry in enumerate(result, 1):
    grid_entry["grid_id"] = i

# Сохраняем результат в файл
with open("result.json", "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Обработано {len(data['cards'])} моделей")
print(f"Создано {len(result)} уникальных размерных рядов")
print(f"Моделей без подходящей сетки: {len(unassigned_models)}")