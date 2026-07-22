// nutrition-framework/food-database.js

// ─── КАТЕГОРИИ ПРОДУКТОВ ──────────────────────────────────────
export const FOOD_CATEGORIES = {
    fruit:      { ru: 'Фрукты',        en: 'Fruits' },
    vegetable:  { ru: 'Овощи',         en: 'Vegetables' },
    grain:      { ru: 'Зерновые',      en: 'Grains' },
    meat:       { ru: 'Мясо',          en: 'Meat' },
    fish:       { ru: 'Рыба',          en: 'Fish' },
    dairy:      { ru: 'Молочные',      en: 'Dairy' },
    bread:      { ru: 'Хлеб/Выпечка', en: 'Bread/Bakery' },
    sweets:     { ru: 'Сладости',      en: 'Sweets' },
    beverage:   { ru: 'Напитки',       en: 'Beverages' },
    alcohol:    { ru: 'Алкоголь',      en: 'Alcohol' },
    soup:       { ru: 'Супы',          en: 'Soups' },
    prepared:   { ru: 'Готовые блюда', en: 'Prepared meals' },
    snack:      { ru: 'Перекусы',      en: 'Snacks' },
    canned:     { ru: 'Консервы',      en: 'Canned food' },
    nuts:       { ru: 'Орехи/Семена',  en: 'Nuts/Seeds' },
    sauce:      { ru: 'Соусы',         en: 'Sauces' },
    fantasy:    { ru: 'Фэнтези-еда',  en: 'Fantasy food' },
};

// ─── СТРУКТУРА ПРОДУКТА ───────────────────────────────────────
// {
//   id: string,
//   names: string[],         — все возможные названия (RU + EN + сленг)
//   category: string,        — ключ из FOOD_CATEGORIES
//   per100g: { kcal, protein, fat, carbs, water, fiber },
//   defaultPortionG: number, — масса типичной порции в граммах
//   portionNames: string[],  — как называют порцию ("стакан", "тарелка", "кусок")
//   satiety: 'low'|'medium'|'high'|'very_high',
//   digestSpeed: 'very_fast'|'fast'|'medium'|'slow'|'very_slow',
//   hydrationMl: number,     — сколько воды (мл) даёт порция для гидратации
//   caffeine: boolean,
//   alcohol: boolean,
//   confidence: number,      — 0..1, насколько точны данные
// }

export const FOOD_DATABASE = [

    // ═══════════════════════════════════════════════════════════
    // ФРУКТЫ
    // ═══════════════════════════════════════════════════════════
    {
        id: 'apple',
        names: ['яблоко', 'яблочко', 'яблока', 'яблок', 'apple'],
        category: 'fruit',
        per100g: { kcal: 52, protein: 0.3, fat: 0.2, carbs: 14, water: 86, fiber: 2.4 },
        defaultPortionG: 180,
        portionNames: ['яблоко', 'штука', 'шт'],
        satiety: 'medium',
        digestSpeed: 'fast',
        hydrationMl: 150,
        caffeine: false,
        alcohol: false,
        confidence: 0.95,
    },
    {
        id: 'banana',
        names: ['банан', 'бананы', 'бананчик', 'banana'],
        category: 'fruit',
        per100g: { kcal: 89, protein: 1.1, fat: 0.3, carbs: 23, water: 75, fiber: 2.6 },
        defaultPortionG: 120,
        portionNames: ['банан', 'штука'],
        satiety: 'high',
        digestSpeed: 'fast',
        hydrationMl: 90,
        caffeine: false,
        alcohol: false,
        confidence: 0.95,
    },
    {
        id: 'orange',
        names: ['апельсин', 'апельсины', 'апельсинчик', 'orange'],
        category: 'fruit',
        per100g: { kcal: 47, protein: 0.9, fat: 0.1, carbs: 12, water: 87, fiber: 2.4 },
        defaultPortionG: 150,
        portionNames: ['апельсин', 'штука'],
        satiety: 'medium',
        digestSpeed: 'fast',
        hydrationMl: 130,
        caffeine: false,
        alcohol: false,
        confidence: 0.95,
    },
    {
        id: 'grapes',
        names: ['виноград', 'виноградинки', 'гроздь винограда', 'grapes'],
        category: 'fruit',
        per100g: { kcal: 69, protein: 0.7, fat: 0.2, carbs: 18, water: 81, fiber: 0.9 },
        defaultPortionG: 150,
        portionNames: ['гроздь', 'горсть', 'порция'],
        satiety: 'low',
        digestSpeed: 'fast',
        hydrationMl: 120,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },
    {
        id: 'peach',
        names: ['персик', 'персики', 'peach'],
        category: 'fruit',
        per100g: { kcal: 39, protein: 0.9, fat: 0.3, carbs: 10, water: 89, fiber: 1.5 },
        defaultPortionG: 150,
        portionNames: ['персик', 'штука'],
        satiety: 'medium',
        digestSpeed: 'fast',
        hydrationMl: 130,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },
    {
        id: 'berries',
        names: ['ягоды', 'ягодки', 'клубника', 'малина', 'черника', 'земляника', 'berries', 'strawberry'],
        category: 'fruit',
        per100g: { kcal: 40, protein: 0.7, fat: 0.4, carbs: 9, water: 90, fiber: 3 },
        defaultPortionG: 100,
        portionNames: ['горсть', 'миска', 'порция'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 90,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },

    // ═══════════════════════════════════════════════════════════
    // ОВОЩИ
    // ═══════════════════════════════════════════════════════════
    {
        id: 'potato_boiled',
        names: ['картошка', 'картофель', 'вареная картошка', 'пюре', 'картофельное пюре', 'potato'],
        category: 'vegetable',
        per100g: { kcal: 86, protein: 1.7, fat: 0.1, carbs: 20, water: 77, fiber: 1.8 },
        defaultPortionG: 200,
        portionNames: ['порция', 'тарелка'],
        satiety: 'high',
        digestSpeed: 'medium',
        hydrationMl: 150,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },
    {
        id: 'carrot',
        names: ['морковь', 'морковка', 'carrot'],
        category: 'vegetable',
        per100g: { kcal: 41, protein: 0.9, fat: 0.2, carbs: 10, water: 88, fiber: 2.8 },
        defaultPortionG: 80,
        portionNames: ['морковка', 'штука'],
        satiety: 'low',
        digestSpeed: 'fast',
        hydrationMl: 70,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },
    {
        id: 'cucumber',
        names: ['огурец', 'огурчик', 'огурцы', 'cucumber'],
        category: 'vegetable',
        per100g: { kcal: 15, protein: 0.7, fat: 0.1, carbs: 3.6, water: 95, fiber: 0.5 },
        defaultPortionG: 100,
        portionNames: ['огурец', 'штука'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 95,
        caffeine: false,
        alcohol: false,
        confidence: 0.95,
    },
    {
        id: 'tomato',
        names: ['помидор', 'томат', 'помидоры', 'томаты', 'tomato'],
        category: 'vegetable',
        per100g: { kcal: 18, protein: 0.9, fat: 0.2, carbs: 3.9, water: 94, fiber: 1.2 },
        defaultPortionG: 120,
        portionNames: ['помидор', 'штука'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 110,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },
    {
        id: 'cabbage',
        names: ['капуста', 'салат из капусты', 'cabbage'],
        category: 'vegetable',
        per100g: { kcal: 25, protein: 1.3, fat: 0.1, carbs: 6, water: 92, fiber: 2.5 },
        defaultPortionG: 150,
        portionNames: ['порция', 'миска'],
        satiety: 'medium',
        digestSpeed: 'medium',
        hydrationMl: 130,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },
    {
        id: 'onion',
        names: ['лук', 'луковица', 'onion'],
        category: 'vegetable',
        per100g: { kcal: 40, protein: 1.1, fat: 0.1, carbs: 9, water: 89, fiber: 1.7 },
        defaultPortionG: 50,
        portionNames: ['луковица', 'штука'],
        satiety: 'low',
        digestSpeed: 'fast',
        hydrationMl: 40,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },

    // ═══════════════════════════════════════════════════════════
    // МЯСО
    // ═══════════════════════════════════════════════════════════
    {
        id: 'chicken_breast',
        names: ['куриная грудка', 'грудка', 'курица', 'курятина', 'куриное филе', 'chicken'],
        category: 'meat',
        per100g: { kcal: 165, protein: 31, fat: 3.6, carbs: 0, water: 65, fiber: 0 },
        defaultPortionG: 150,
        portionNames: ['порция', 'кусок', 'филе'],
        satiety: 'very_high',
        digestSpeed: 'slow',
        hydrationMl: 95,
        caffeine: false,
        alcohol: false,
        confidence: 0.95,
    },
    {
        id: 'beef',
        names: ['говядина', 'мясо', 'стейк', 'beef', 'бифштекс'],
        category: 'meat',
        per100g: { kcal: 250, protein: 26, fat: 15, carbs: 0, water: 56, fiber: 0 },
        defaultPortionG: 200,
        portionNames: ['стейк', 'кусок', 'порция'],
        satiety: 'very_high',
        digestSpeed: 'very_slow',
        hydrationMl: 110,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },
    {
        id: 'pork',
        names: ['свинина', 'свиная отбивная', 'отбивная', 'шашлык', 'pork'],
        category: 'meat',
        per100g: { kcal: 242, protein: 27, fat: 14, carbs: 0, water: 57, fiber: 0 },
        defaultPortionG: 180,
        portionNames: ['порция', 'кусок', 'отбивная'],
        satiety: 'very_high',
        digestSpeed: 'very_slow',
        hydrationMl: 100,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },
    {
        id: 'sausage',
        names: ['сосиска', 'сосиски', 'колбаса', 'сарделька', 'sausage'],
        category: 'meat',
        per100g: { kcal: 300, protein: 12, fat: 27, carbs: 2, water: 55, fiber: 0 },
        defaultPortionG: 100,
        portionNames: ['сосиска', 'штука', 'пара'],
        satiety: 'high',
        digestSpeed: 'slow',
        hydrationMl: 50,
        caffeine: false,
        alcohol: false,
        confidence: 0.8,
    },
    {
        id: 'canned_meat',
        names: ['тушёнка', 'тушенка', 'консервы мясные', 'банка тушёнки', 'банка тушенки', 'canned meat'],
        category: 'canned',
        per100g: { kcal: 230, protein: 16, fat: 17, carbs: 1, water: 60, fiber: 0 },
        defaultPortionG: 325,
        portionNames: ['банка', 'порция'],
        satiety: 'very_high',
        digestSpeed: 'slow',
        hydrationMl: 190,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },

    // ═══════════════════════════════════════════════════════════
    // РЫБА
    // ═══════════════════════════════════════════════════════════
    {
        id: 'fish_white',
        names: ['рыба', 'белая рыба', 'треска', 'минтай', 'судак', 'fish'],
        category: 'fish',
        per100g: { kcal: 82, protein: 18, fat: 0.7, carbs: 0, water: 80, fiber: 0 },
        defaultPortionG: 150,
        portionNames: ['порция', 'кусок', 'филе'],
        satiety: 'high',
        digestSpeed: 'medium',
        hydrationMl: 120,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },
    {
        id: 'fish_fatty',
        names: ['лосось', 'сёмга', 'семга', 'форель', 'скумбрия', 'salmon'],
        category: 'fish',
        per100g: { kcal: 208, protein: 20, fat: 13, carbs: 0, water: 64, fiber: 0 },
        defaultPortionG: 150,
        portionNames: ['порция', 'стейк', 'кусок'],
        satiety: 'very_high',
        digestSpeed: 'slow',
        hydrationMl: 95,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },

    // ═══════════════════════════════════════════════════════════
    // МОЛОЧНЫЕ
    // ═══════════════════════════════════════════════════════════
    {
        id: 'milk',
        names: ['молоко', 'стакан молока', 'кружка молока', 'milk'],
        category: 'dairy',
        per100g: { kcal: 64, protein: 3.2, fat: 3.6, carbs: 4.8, water: 88, fiber: 0 },
        defaultPortionG: 250,
        portionNames: ['стакан', 'кружка'],
        satiety: 'medium',
        digestSpeed: 'fast',
        hydrationMl: 220,
        caffeine: false,
        alcohol: false,
        confidence: 0.95,
    },
    {
        id: 'cheese',
        names: ['сыр', 'кусок сыра', 'ломтик сыра', 'cheese'],
        category: 'dairy',
        per100g: { kcal: 350, protein: 25, fat: 27, carbs: 1, water: 37, fiber: 0 },
        defaultPortionG: 30,
        portionNames: ['ломтик', 'кусок', 'кусочек'],
        satiety: 'medium',
        digestSpeed: 'slow',
        hydrationMl: 10,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },
    {
        id: 'yogurt',
        names: ['йогурт', 'кефир', 'ряженка', 'yogurt', 'kefir'],
        category: 'dairy',
        per100g: { kcal: 60, protein: 3.5, fat: 2.5, carbs: 6, water: 87, fiber: 0 },
        defaultPortionG: 200,
        portionNames: ['стакан', 'порция', 'баночка'],
        satiety: 'medium',
        digestSpeed: 'fast',
        hydrationMl: 170,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },
    {
        id: 'egg',
        names: ['яйцо', 'яйца', 'яичница', 'омлет', 'egg', 'eggs'],
        category: 'dairy',
        per100g: { kcal: 155, protein: 13, fat: 11, carbs: 1.1, water: 75, fiber: 0 },
        defaultPortionG: 60,
        portionNames: ['яйцо', 'штука'],
        satiety: 'high',
        digestSpeed: 'medium',
        hydrationMl: 45,
        caffeine: false,
        alcohol: false,
        confidence: 0.95,
    },
    {
        id: 'butter',
        names: ['масло', 'сливочное масло', 'butter'],
        category: 'dairy',
        per100g: { kcal: 717, protein: 0.9, fat: 81, carbs: 0.1, water: 16, fiber: 0 },
        defaultPortionG: 10,
        portionNames: ['кусочек', 'ложка'],
        satiety: 'low',
        digestSpeed: 'slow',
        hydrationMl: 2,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },

    // ═══════════════════════════════════════════════════════════
    // ХЛЕБ / ВЫПЕЧКА
    // ═══════════════════════════════════════════════════════════
    {
        id: 'bread_white',
        names: ['хлеб', 'белый хлеб', 'батон', 'булка', 'bread'],
        category: 'bread',
        per100g: { kcal: 265, protein: 9, fat: 3.2, carbs: 49, water: 36, fiber: 2.7 },
        defaultPortionG: 40,
        portionNames: ['кусок', 'ломтик', 'ломоть'],
        satiety: 'medium',
        digestSpeed: 'medium',
        hydrationMl: 14,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },
    {
        id: 'bread_black',
        names: ['чёрный хлеб', 'черный хлеб', 'ржаной хлеб', 'бородинский'],
        category: 'bread',
        per100g: { kcal: 210, protein: 7, fat: 1.3, carbs: 43, water: 44, fiber: 6 },
        defaultPortionG: 40,
        portionNames: ['кусок', 'ломтик'],
        satiety: 'high',
        digestSpeed: 'medium',
        hydrationMl: 17,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },
    {
        id: 'pastry',
        names: ['булочка', 'пирожок', 'пирог', 'ватрушка', 'плюшка', 'выпечка', 'pastry', 'pie'],
        category: 'bread',
        per100g: { kcal: 340, protein: 7, fat: 12, carbs: 52, water: 25, fiber: 1.5 },
        defaultPortionG: 80,
        portionNames: ['штука', 'булочка', 'пирожок'],
        satiety: 'medium',
        digestSpeed: 'medium',
        hydrationMl: 20,
        caffeine: false,
        alcohol: false,
        confidence: 0.75,
    },

    // ═══════════════════════════════════════════════════════════
    // ЗЕРНОВЫЕ / КАШИ / ГАРНИРЫ
    // ═══════════════════════════════════════════════════════════
    {
        id: 'rice',
        names: ['рис', 'варёный рис', 'каша рисовая', 'rice'],
        category: 'grain',
        per100g: { kcal: 130, protein: 2.7, fat: 0.3, carbs: 28, water: 68, fiber: 0.4 },
        defaultPortionG: 200,
        portionNames: ['порция', 'тарелка'],
        satiety: 'high',
        digestSpeed: 'medium',
        hydrationMl: 130,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },
    {
        id: 'buckwheat',
        names: ['гречка', 'гречневая каша', 'buckwheat'],
        category: 'grain',
        per100g: { kcal: 110, protein: 4.2, fat: 1.1, carbs: 21, water: 73, fiber: 3.7 },
        defaultPortionG: 200,
        portionNames: ['порция', 'тарелка'],
        satiety: 'high',
        digestSpeed: 'medium',
        hydrationMl: 145,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },
    {
        id: 'oatmeal',
        names: ['овсянка', 'овсяная каша', 'геркулес', 'oatmeal', 'porridge'],
        category: 'grain',
        per100g: { kcal: 88, protein: 3, fat: 1.5, carbs: 15, water: 80, fiber: 2.5 },
        defaultPortionG: 250,
        portionNames: ['порция', 'тарелка', 'миска'],
        satiety: 'high',
        digestSpeed: 'medium',
        hydrationMl: 200,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },
    {
        id: 'pasta',
        names: ['макароны', 'паста', 'спагетти', 'лапша', 'pasta', 'noodles'],
        category: 'grain',
        per100g: { kcal: 131, protein: 5, fat: 1.1, carbs: 25, water: 62, fiber: 1.8 },
        defaultPortionG: 220,
        portionNames: ['порция', 'тарелка'],
        satiety: 'high',
        digestSpeed: 'medium',
        hydrationMl: 135,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },

    // ═══════════════════════════════════════════════════════════
    // СУПЫ
    // ═══════════════════════════════════════════════════════════
    {
        id: 'soup_light',
        names: ['суп', 'бульон', 'куриный суп', 'лёгкий суп', 'soup', 'broth'],
        category: 'soup',
        per100g: { kcal: 35, protein: 2, fat: 1.5, carbs: 3, water: 92, fiber: 0.5 },
        defaultPortionG: 350,
        portionNames: ['тарелка', 'порция', 'миска'],
        satiety: 'high',
        digestSpeed: 'fast',
        hydrationMl: 320,
        caffeine: false,
        alcohol: false,
        confidence: 0.75,
    },
    {
        id: 'soup_heavy',
        names: ['борщ', 'щи', 'солянка', 'рассольник', 'харчо', 'густой суп'],
        category: 'soup',
        per100g: { kcal: 55, protein: 3, fat: 2.5, carbs: 5, water: 88, fiber: 1 },
        defaultPortionG: 350,
        portionNames: ['тарелка', 'порция'],
        satiety: 'very_high',
        digestSpeed: 'medium',
        hydrationMl: 300,
        caffeine: false,
        alcohol: false,
        confidence: 0.7,
    },
    {
        id: 'stew',
        names: ['рагу', 'жаркое', 'тушёное мясо', 'stew'],
        category: 'soup',
        per100g: { kcal: 95, protein: 7, fat: 5, carbs: 6, water: 78, fiber: 1.5 },
        defaultPortionG: 300,
        portionNames: ['порция', 'тарелка'],
        satiety: 'very_high',
        digestSpeed: 'slow',
        hydrationMl: 230,
        caffeine: false,
        alcohol: false,
        confidence: 0.7,
    },

    // ═══════════════════════════════════════════════════════════
    // СЛАДОСТИ
    // ═══════════════════════════════════════════════════════════
    {
        id: 'chocolate',
        names: ['шоколад', 'шоколадка', 'плитка шоколада', 'chocolate'],
        category: 'sweets',
        per100g: { kcal: 540, protein: 5, fat: 31, carbs: 60, water: 1, fiber: 3 },
        defaultPortionG: 50,
        portionNames: ['плитка', 'кусочек', 'дольку'],
        satiety: 'low',
        digestSpeed: 'medium',
        hydrationMl: 0,
        caffeine: true,
        alcohol: false,
        confidence: 0.85,
    },
    {
        id: 'cookie',
        names: ['печенье', 'печеньки', 'cookie', 'cookies', 'бисквит'],
        category: 'sweets',
        per100g: { kcal: 450, protein: 6, fat: 20, carbs: 62, water: 5, fiber: 1.5 },
        defaultPortionG: 30,
        portionNames: ['штука', 'печенька'],
        satiety: 'low',
        digestSpeed: 'medium',
        hydrationMl: 0,
        caffeine: false,
        alcohol: false,
        confidence: 0.8,
    },
    {
        id: 'candy',
        names: ['конфета', 'конфеты', 'леденец', 'карамель', 'candy'],
        category: 'sweets',
        per100g: { kcal: 380, protein: 1, fat: 8, carbs: 80, water: 5, fiber: 0 },
        defaultPortionG: 15,
        portionNames: ['конфета', 'штука'],
        satiety: 'low',
        digestSpeed: 'fast',
        hydrationMl: 0,
        caffeine: false,
        alcohol: false,
        confidence: 0.75,
    },
    {
        id: 'cake',
        names: ['торт', 'кусок торта', 'пирожное', 'cake'],
        category: 'sweets',
        per100g: { kcal: 380, protein: 5, fat: 18, carbs: 50, water: 22, fiber: 0.5 },
        defaultPortionG: 120,
        portionNames: ['кусок', 'порция', 'кусочек'],
        satiety: 'medium',
        digestSpeed: 'medium',
        hydrationMl: 25,
        caffeine: false,
        alcohol: false,
        confidence: 0.75,
    },
    {
        id: 'honey',
        names: ['мёд', 'мед', 'ложка мёда', 'honey'],
        category: 'sweets',
        per100g: { kcal: 304, protein: 0.3, fat: 0, carbs: 82, water: 17, fiber: 0 },
        defaultPortionG: 20,
        portionNames: ['ложка', 'чайная ложка'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 3,
        caffeine: false,
        alcohol: false,
        confidence: 0.9,
    },

    // ═══════════════════════════════════════════════════════════
    // НАПИТКИ
    // ═══════════════════════════════════════════════════════════
    {
        id: 'water',
        names: ['вода', 'воду', 'воды', 'стакан воды', 'water', 'глоток воды'],
        category: 'beverage',
        per100g: { kcal: 0, protein: 0, fat: 0, carbs: 0, water: 100, fiber: 0 },
        defaultPortionG: 250,
        portionNames: ['стакан', 'кружка', 'глоток', 'бутылка'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 250,
        caffeine: false,
        alcohol: false,
        confidence: 1.0,
    },
    {
        id: 'tea',
        names: ['чай', 'кружка чая', 'чашка чая', 'tea'],
        category: 'beverage',
        per100g: { kcal: 1, protein: 0, fat: 0, carbs: 0.3, water: 99, fiber: 0 },
        defaultPortionG: 250,
        portionNames: ['кружка', 'чашка'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 230,
        caffeine: true,
        alcohol: false,
        confidence: 0.95,
    },
    {
        id: 'coffee',
        names: ['кофе', 'чашка кофе', 'кружка кофе', 'эспрессо', 'coffee'],
        category: 'beverage',
        per100g: { kcal: 2, protein: 0.1, fat: 0, carbs: 0.3, water: 98, fiber: 0 },
        defaultPortionG: 200,
        portionNames: ['чашка', 'кружка'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 180,
        caffeine: true,
        alcohol: false,
        confidence: 0.95,
    },
    {
        id: 'juice',
        names: ['сок', 'стакан сока', 'апельсиновый сок', 'яблочный сок', 'juice'],
        category: 'beverage',
        per100g: { kcal: 45, protein: 0.5, fat: 0.1, carbs: 11, water: 88, fiber: 0.2 },
        defaultPortionG: 250,
        portionNames: ['стакан', 'порция'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 220,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },
    {
        id: 'soda',
        names: ['газировка', 'кола', 'лимонад', 'пепси', 'фанта', 'soda', 'cola'],
        category: 'beverage',
        per100g: { kcal: 42, protein: 0, fat: 0, carbs: 11, water: 89, fiber: 0 },
        defaultPortionG: 330,
        portionNames: ['банка', 'стакан', 'бутылка'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 280,
        caffeine: true,
        alcohol: false,
        confidence: 0.9,
    },

    // ═══════════════════════════════════════════════════════════
    // АЛКОГОЛЬ
    // ═══════════════════════════════════════════════════════════
    {
        id: 'beer',
        names: ['пиво', 'кружка пива', 'бокал пива', 'beer'],
        category: 'alcohol',
        per100g: { kcal: 43, protein: 0.5, fat: 0, carbs: 3.6, water: 92, fiber: 0 },
        defaultPortionG: 500,
        portionNames: ['кружка', 'бокал', 'бутылка'],
        satiety: 'medium',
        digestSpeed: 'fast',
        hydrationMl: -100, // алкоголь обезвоживает!
        caffeine: false,
        alcohol: true,
        confidence: 0.9,
    },
    {
        id: 'wine',
        names: ['вино', 'бокал вина', 'красное вино', 'белое вино', 'wine'],
        category: 'alcohol',
        per100g: { kcal: 85, protein: 0.1, fat: 0, carbs: 2.6, water: 86, fiber: 0 },
        defaultPortionG: 150,
        portionNames: ['бокал', 'стакан'],
        satiety: 'low',
        digestSpeed: 'fast',
        hydrationMl: -50,
        caffeine: false,
        alcohol: true,
        confidence: 0.85,
    },
    {
        id: 'vodka',
        names: ['водка', 'рюмка водки', 'стопка', 'vodka', 'самогон'],
        category: 'alcohol',
        per100g: { kcal: 235, protein: 0, fat: 0, carbs: 0.1, water: 60, fiber: 0 },
        defaultPortionG: 50,
        portionNames: ['рюмка', 'стопка', 'шот'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: -80,
        caffeine: false,
        alcohol: true,
        confidence: 0.9,
    },

    // ═══════════════════════════════════════════════════════════
    // ОРЕХИ / СЕМЕНА
    // ═══════════════════════════════════════════════════════════
    {
        id: 'nuts_mixed',
        names: ['орехи', 'орешки', 'горсть орехов', 'арахис', 'грецкие', 'миндаль', 'nuts'],
        category: 'nuts',
        per100g: { kcal: 600, protein: 20, fat: 50, carbs: 15, water: 4, fiber: 7 },
        defaultPortionG: 30,
        portionNames: ['горсть', 'порция'],
        satiety: 'medium',
        digestSpeed: 'slow',
        hydrationMl: 0,
        caffeine: false,
        alcohol: false,
        confidence: 0.8,
    },
    {
        id: 'seeds',
        names: ['семечки', 'подсолнечные семечки', 'тыквенные семечки', 'seeds'],
        category: 'nuts',
        per100g: { kcal: 580, protein: 21, fat: 51, carbs: 10, water: 5, fiber: 6 },
        defaultPortionG: 40,
        portionNames: ['горсть', 'порция'],
        satiety: 'medium',
        digestSpeed: 'slow',
        hydrationMl: 0,
        caffeine: false,
        alcohol: false,
        confidence: 0.8,
    },

    // ═══════════════════════════════════════════════════════════
    // ПЕРЕКУСЫ / СНЕКИ
    // ═══════════════════════════════════════════════════════════
    {
        id: 'chips',
        names: ['чипсы', 'пачка чипсов', 'chips', 'снеки'],
        category: 'snack',
        per100g: { kcal: 536, protein: 7, fat: 35, carbs: 50, water: 2, fiber: 4 },
        defaultPortionG: 60,
        portionNames: ['пачка', 'порция'],
        satiety: 'low',
        digestSpeed: 'medium',
        hydrationMl: 0,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },
    {
        id: 'sandwich',
        names: ['бутерброд', 'сэндвич', 'sandwich', 'тост'],
        category: 'snack',
        per100g: { kcal: 250, protein: 10, fat: 12, carbs: 25, water: 45, fiber: 1.5 },
        defaultPortionG: 120,
        portionNames: ['штука', 'бутерброд'],
        satiety: 'medium',
        digestSpeed: 'medium',
        hydrationMl: 50,
        caffeine: false,
        alcohol: false,
        confidence: 0.7,
    },

    // ═══════════════════════════════════════════════════════════
    // ГОТОВЫЕ БЛЮДА
    // ═══════════════════════════════════════════════════════════
    {
        id: 'pizza',
        names: ['пицца', 'кусок пиццы', 'pizza'],
        category: 'prepared',
        per100g: { kcal: 270, protein: 11, fat: 12, carbs: 30, water: 40, fiber: 2 },
        defaultPortionG: 150,
        portionNames: ['кусок', 'ломтик', 'порция'],
        satiety: 'high',
        digestSpeed: 'slow',
        hydrationMl: 60,
        caffeine: false,
        alcohol: false,
        confidence: 0.8,
    },
    {
        id: 'fried_potatoes',
        names: ['жареная картошка', 'картошка фри', 'фри', 'french fries'],
        category: 'prepared',
        per100g: { kcal: 312, protein: 3.4, fat: 15, carbs: 41, water: 38, fiber: 3.8 },
        defaultPortionG: 180,
        portionNames: ['порция', 'тарелка'],
        satiety: 'high',
        digestSpeed: 'slow',
        hydrationMl: 65,
        caffeine: false,
        alcohol: false,
        confidence: 0.85,
    },
    {
        id: 'salad',
        names: ['салат', 'овощной салат', 'цезарь', 'salad'],
        category: 'prepared',
        per100g: { kcal: 50, protein: 2, fat: 3, carbs: 4, water: 88, fiber: 2 },
        defaultPortionG: 200,
        portionNames: ['порция', 'тарелка', 'миска'],
        satiety: 'medium',
        digestSpeed: 'fast',
        hydrationMl: 170,
        caffeine: false,
        alcohol: false,
        confidence: 0.65,
    },
    {
        id: 'porridge_meat',
        names: ['каша с мясом', 'плов', 'pilaf', 'рис с мясом'],
        category: 'prepared',
        per100g: { kcal: 150, protein: 8, fat: 6, carbs: 16, water: 65, fiber: 0.5 },
        defaultPortionG: 300,
        portionNames: ['порция', 'тарелка'],
        satiety: 'very_high',
        digestSpeed: 'slow',
        hydrationMl: 190,
        caffeine: false,
        alcohol: false,
        confidence: 0.7,
    },

    // ═══════════════════════════════════════════════════════════
    // ФЭНТЕЗИ-ЕДА (для средневековых / фантастических сеттингов)
    // ═══════════════════════════════════════════════════════════
    {
        id: 'tavern_meal',
        names: ['еда из таверны', 'обед в таверне', 'ужин в таверне', 'tavern meal', 'трактирная еда'],
        category: 'fantasy',
        per100g: { kcal: 140, protein: 8, fat: 7, carbs: 12, water: 65, fiber: 2 },
        defaultPortionG: 400,
        portionNames: ['порция', 'тарелка', 'обед'],
        satiety: 'very_high',
        digestSpeed: 'medium',
        hydrationMl: 250,
        caffeine: false,
        alcohol: false,
        confidence: 0.5,
    },
    {
        id: 'dried_meat',
        names: ['вяленое мясо', 'сушёное мясо', 'jerky', 'dried meat', 'солонина'],
        category: 'fantasy',
        per100g: { kcal: 250, protein: 33, fat: 12, carbs: 3, water: 40, fiber: 0 },
        defaultPortionG: 60,
        portionNames: ['кусок', 'полоска', 'порция'],
        satiety: 'high',
        digestSpeed: 'slow',
        hydrationMl: 20,
        caffeine: false,
        alcohol: false,
        confidence: 0.7,
    },
    {
        id: 'hardtack',
        names: ['сухарь', 'сухари', 'галеты', 'лепёшка', 'hardtack', 'crackers'],
        category: 'fantasy',
        per100g: { kcal: 380, protein: 10, fat: 3, carbs: 78, water: 6, fiber: 3 },
        defaultPortionG: 50,
        portionNames: ['сухарь', 'штука', 'кусок'],
        satiety: 'medium',
        digestSpeed: 'medium',
        hydrationMl: 3,
        caffeine: false,
        alcohol: false,
        confidence: 0.75,
    },
    {
        id: 'ration',
        names: ['паёк', 'сухпаёк', 'рацион', 'ration', 'travel ration', 'дорожная еда'],
        category: 'fantasy',
        per100g: { kcal: 300, protein: 12, fat: 10, carbs: 40, water: 20, fiber: 3 },
        defaultPortionG: 200,
        portionNames: ['паёк', 'порция'],
        satiety: 'high',
        digestSpeed: 'medium',
        hydrationMl: 40,
        caffeine: false,
        alcohol: false,
        confidence: 0.6,
    },
    {
        id: 'mead',
        names: ['медовуха', 'мёд питьевой', 'mead'],
        category: 'alcohol',
        per100g: { kcal: 95, protein: 0, fat: 0, carbs: 13, water: 79, fiber: 0 },
        defaultPortionG: 300,
        portionNames: ['кружка', 'стакан'],
        satiety: 'low',
        digestSpeed: 'fast',
        hydrationMl: -30,
        caffeine: false,
        alcohol: true,
        confidence: 0.7,
    },
    {
        id: 'potion',
        names: ['зелье', 'эликсир', 'potion', 'elixir', 'отвар'],
        category: 'fantasy',
        per100g: { kcal: 20, protein: 0, fat: 0, carbs: 5, water: 90, fiber: 0 },
        defaultPortionG: 100,
        portionNames: ['флакон', 'пузырёк', 'порция'],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 90,
        caffeine: false,
        alcohol: false,
        confidence: 0.4,
    },
];

// ─── FALLBACK (когда продукт не найден) ───────────────────────
export const FALLBACK_FOOD = {
    meal: {
        id: 'unknown_meal',
        names: [],
        category: 'prepared',
        per100g: { kcal: 150, protein: 7, fat: 7, carbs: 15, water: 65, fiber: 2 },
        defaultPortionG: 300,
        portionNames: [],
        satiety: 'high',
        digestSpeed: 'medium',
        hydrationMl: 190,
        caffeine: false,
        alcohol: false,
        confidence: 0.3,
    },
    snack: {
        id: 'unknown_snack',
        names: [],
        category: 'snack',
        per100g: { kcal: 200, protein: 5, fat: 8, carbs: 25, water: 30, fiber: 1 },
        defaultPortionG: 80,
        portionNames: [],
        satiety: 'medium',
        digestSpeed: 'medium',
        hydrationMl: 20,
        caffeine: false,
        alcohol: false,
        confidence: 0.2,
    },
    drink: {
        id: 'unknown_drink',
        names: [],
        category: 'beverage',
        per100g: { kcal: 15, protein: 0, fat: 0, carbs: 4, water: 95, fiber: 0 },
        defaultPortionG: 250,
        portionNames: [],
        satiety: 'low',
        digestSpeed: 'very_fast',
        hydrationMl: 230,
        caffeine: false,
        alcohol: false,
        confidence: 0.2,
    },
};

// ─── ПОИСКОВЫЙ ИНДЕКС (строится один раз при импорте) ─────────
// Карта: нормализованное слово → массив продуктов
const _searchIndex = new Map();

function _normalize(str) {
    return str.toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/[^а-яa-z0-9\s]/g, '')
        .trim();
}

for (const food of FOOD_DATABASE) {
    for (const name of food.names) {
        const norm = _normalize(name);
        // Индексируем и полное название, и отдельные слова
        if (!_searchIndex.has(norm)) _searchIndex.set(norm, []);
        _searchIndex.get(norm).push(food);

        for (const word of norm.split(/\s+/)) {
            if (word.length < 3) continue;
            if (!_searchIndex.has(word)) _searchIndex.set(word, []);
            _searchIndex.get(word).push(food);
        }
    }
}

/**
 * Найти продукт по строке. Возвращает { food, confidence } или null.
 */
export function findFood(rawText) {
    const norm = _normalize(rawText);
    if (!norm) return null;

    // 1) Точное совпадение по полному названию
    if (_searchIndex.has(norm)) {
        const candidates = _searchIndex.get(norm);
        // Берём самый уверенный
        const best = candidates.reduce((a, b) => a.confidence > b.confidence ? a : b);
        return { food: best, confidence: best.confidence };
    }

    // 2) Поиск по каждому слову — набираем очки
    const words = norm.split(/\s+/).filter(w => w.length >= 3);
    if (words.length === 0) return null;

    const scores = new Map(); // food.id → score
    const foodMap = new Map();
    for (const word of words) {
        if (_searchIndex.has(word)) {
            for (const food of _searchIndex.get(word)) {
                const prev = scores.get(food.id) || 0;
                scores.set(food.id, prev + 1);
                foodMap.set(food.id, food);
            }
        }
        // Частичное совпадение (начало слова)
        for (const [key, foods] of _searchIndex) {
            if (key.startsWith(word) || word.startsWith(key)) {
                for (const food of foods) {
                    const prev = scores.get(food.id) || 0;
                    scores.set(food.id, prev + 0.5);
                    foodMap.set(food.id, food);
                }
            }
        }
    }

    if (scores.size === 0) return null;

    // Лучший по очкам
    let bestId = null, bestScore = 0;
    for (const [id, score] of scores) {
        if (score > bestScore) { bestScore = score; bestId = id; }
    }

    const food = foodMap.get(bestId);
    // Confidence снижается если совпадение неточное
    const matchConfidence = Math.min(1, (bestScore / words.length) * food.confidence * 0.8);
    return { food, confidence: matchConfidence };
}

/**
 * Получить все продукты категории (для UI)
 */
export function getFoodsByCategory(category) {
    return FOOD_DATABASE.filter(f => f.category === category);
}
