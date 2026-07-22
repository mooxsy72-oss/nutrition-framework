// nutrition-framework/parser.js

import { findFood, FALLBACK_FOOD } from './food-database.js';

// ═══════════════════════════════════════════════════════════════
// ПАТТЕРНЫ ПРИЁМА ПИЩИ (что ищем в тексте)
// ═══════════════════════════════════════════════════════════════

// Глаголы еды (RU)
const EAT_VERBS_RU = [
    'съел[аи]?', 'поел[аи]?', 'ест\\b', 'ем\\b', 'кушает', 'кушаю',
    'перекусил[аи]?', 'доел[аи]?', 'откусил[аи]?', 'проглотил[аи]?',
    'жуёт', 'жую', 'завтракает', 'обедает', 'ужинает',
    'позавтракал[аи]?', 'пообедал[аи]?', 'поужинал[аи]?',
    'наелась', 'наелся', 'объелась', 'объелся',
    'угощается', 'пробует', 'попробовал[аи]?',
    'жарит', 'варит', 'готовит', 'разогрел[аи]?',
];

// Глаголы питья (RU)
const DRINK_VERBS_RU = [
    'выпил[аи]?', 'пьёт', 'пью', 'попил[аи]?',
    'хлебнул[аи]?', 'глотнул[аи]?', 'отпил[аи]?',
    'допил[аи]?', 'запил[аи]?', 'напился', 'напилась',
];

// Глаголы еды (EN)
const EAT_VERBS_EN = [
    'eats?', 'ate', 'eating', 'eaten',
    'had\\s+(?:a\\s+)?(?:bite|meal|breakfast|lunch|dinner|snack)',
    'grabs?\\s+(?:a\\s+)?', 'munches?', 'chews?',
    'devours?', 'finishes?\\s+(?:the\\s+)?',
    'swallows?', 'nibbles?',
];

// Глаголы питья (EN)
const DRINK_VERBS_EN = [
    'drinks?', 'drank', 'drinking', 'sips?', 'sipping',
    'gulps?', 'chugs?', 'swigs?',
];

// Собираем в регулярки
const EAT_PATTERN_RU = new RegExp(
    `(?:${EAT_VERBS_RU.join('|')})\\s+([^.,!?*\\n]{2,60})`,
    'gi'
);
const DRINK_PATTERN_RU = new RegExp(
    `(?:${DRINK_VERBS_RU.join('|')})\\s+([^.,!?*\\n]{2,60})`,
    'gi'
);
const EAT_PATTERN_EN = new RegExp(
    `(?:${EAT_VERBS_EN.join('|')})\\s+(?:a\\s+|an\\s+|the\\s+|some\\s+)?([^.,!?*\\n]{2,60})`,
    'gi'
);
const DRINK_PATTERN_EN = new RegExp(
    `(?:${DRINK_VERBS_EN.join('|')})\\s+(?:a\\s+|an\\s+|the\\s+|some\\s+)?([^.,!?*\\n]{2,60})`,
    'gi'
);

// ═══════════════════════════════════════════════════════════════
// ПАТТЕРНЫ КОЛИЧЕСТВА
// ═══════════════════════════════════════════════════════════════

const QUANTITY_PATTERNS = [
    // "2 яблока", "три куска"
    { re: /(\d+(?:[.,]\d+)?)\s*(?:шт|штук[аи]?|кусо?[чк]|ломти[кч]|порци[йия]|тарел[ок]|стакан|кружк|бокал|рюм[ок]|банк[аиу])/i, type: 'count' },
    // "200г", "200 грамм"
    { re: /(\d+(?:[.,]\d+)?)\s*(?:г(?:рамм)?|g)\b/i, type: 'grams' },
    // "пол", "половину", "полбанки"
    { re: /\b(?:пол|половин[уыа]|полов[иь])\s*/i, type: 'half' },
    // "кусок", "кусочек" (без числа = 1)
    { re: /\b(?:кусо[кч]|ломти[кч]|кусочек)\b/i, type: 'piece' },
    // English: "2 pieces", "a slice"
    { re: /(\d+)\s*(?:pieces?|slices?|cups?|glasses?|bowls?|plates?|cans?|bottles?)/i, type: 'count' },
    { re: /(\d+(?:\.\d+)?)\s*(?:g|grams?|oz|ml)\b/i, type: 'grams' },
    { re: /\b(?:half|a half)\b/i, type: 'half' },
];

// Числительные
const WORD_NUMBERS = {
    'один': 1, 'одну': 1, 'одно': 1,
    'два': 2, 'две': 2, 'двое': 2,
    'три': 3, 'четыре': 4, 'пять': 5,
    'шесть': 6, 'семь': 7, 'восемь': 8,
    'девять': 9, 'десять': 10,
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'a couple': 2, 'пару': 2, 'пара': 2, 'несколько': 3,
};

// ═══════════════════════════════════════════════════════════════
// AI TAG PARSER — <!-- NUT ... -->
// ═══════════════════════════════════════════════════════════════

const NUT_TAG_RE = /<!--\s*NUT\s+([\s\S]*?)-->/gi;
const NUT_FIELD_RE = /(\w+)\s*=\s*([^|;}\n]+)/g;

/**
 * Парсит тег <!-- NUT food=... | kcal=... | ... --> из ответа ИИ.
 * Может быть несколько тегов (если персонаж ел несколько раз).
 * @returns {Array<{food, kcal, portion, protein, fat, carbs, water, activity, duration, type}>}
 */
export function parseNutTags(text) {
    if (!text) return [];

    const results = [];
    NUT_TAG_RE.lastIndex = 0;

    let match;
    while ((match = NUT_TAG_RE.exec(text)) !== null) {
        const inner = match[1];
        const entry = {};

        NUT_FIELD_RE.lastIndex = 0;
        let fieldMatch;
        while ((fieldMatch = NUT_FIELD_RE.exec(inner)) !== null) {
            const key = fieldMatch[1].toLowerCase().trim();
            const val = fieldMatch[2].trim();
            entry[key] = val;
        }

        if (Object.keys(entry).length > 0) {
            results.push(normalizeNutEntry(entry));
        }
    }

    return results;
}

/**
 * Нормализует поля из AI-тега в единый формат
 */
function normalizeNutEntry(raw) {
    const entry = {
        type: 'food', // food | drink | activity
        food: raw.food || raw.name || null,
        kcal: parseNum(raw.kcal || raw.calories),
        portionG: parseNum(raw.portion || raw.weight || raw.amount),
        protein: parseNum(raw.protein || raw.prot),
        fat: parseNum(raw.fat || raw.fats),
        carbs: parseNum(raw.carbs || raw.carb),
        waterMl: parseNum(raw.water || raw.hydration),
        activity: raw.activity || null,
        duration: parseNum(raw.duration), // минуты активности
        digestSpeed: raw.digest || raw.speed || 'medium',
    };

    // Тип
    if (raw.type === 'activity' || raw.activity) {
        entry.type = 'activity';
    } else if (raw.type === 'drink' || raw.drink) {
        entry.type = 'drink';
        if (!entry.food) entry.food = raw.drink;
    }

    return entry;
}

function parseNum(val) {
    if (val === undefined || val === null) return null;
    const num = parseFloat(String(val).replace(',', '.').replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : num;
}

// ═══════════════════════════════════════════════════════════════
// ТЕКСТОВЫЙ ПАРСЕР (из сообщений игрока / нарратива ИИ)
// ═══════════════════════════════════════════════════════════════

/**
 * Извлечь все упоминания еды/питья из текста.
 * @param {string} text — текст сообщения
 * @returns {Array<{raw, food, portionG, kcal, type, confidence, source}>}
 */
export function extractFoodMentions(text) {
    if (!text) return [];

    // Очищаем текст от HTML-тегов и скрытых комментариев
    const clean = text
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\*([^*]+)\*/g, '$1'); // убираем *действия*

    const mentions = [];
    const seen = new Set(); // защита от дублей

    // Проходим по всем паттернам
    const patterns = [
        { re: EAT_PATTERN_RU, type: 'food' },
        { re: DRINK_PATTERN_RU, type: 'drink' },
        { re: EAT_PATTERN_EN, type: 'food' },
        { re: DRINK_PATTERN_EN, type: 'drink' },
    ];

    for (const { re, type } of patterns) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(clean)) !== null) {
            const raw = m[1].trim();
            if (raw.length < 2 || raw.length > 60) continue;

            // Нормализуем
            const normalized = raw.toLowerCase().replace(/[«»""']/g, '').trim();
            if (seen.has(normalized)) continue;
            seen.add(normalized);

            // Ищем в базе
            const found = findFood(normalized);
            const quantity = extractQuantity(clean, m.index);

            if (found) {
                const portionG = calcPortion(found.food, quantity);
                const kcal = Math.round((found.food.per100g.kcal / 100) * portionG);

                mentions.push({
                    raw,
                    food: found.food,
                    portionG,
                    kcal,
                    protein: Math.round((found.food.per100g.protein / 100) * portionG * 10) / 10,
                    fat: Math.round((found.food.per100g.fat / 100) * portionG * 10) / 10,
                    carbs: Math.round((found.food.per100g.carbs / 100) * portionG * 10) / 10,
                    waterMl: Math.round(found.food.hydrationMl * (portionG / found.food.defaultPortionG)),
                    type,
                    confidence: found.confidence,
                    source: 'database',
                    digestSpeed: found.food.digestSpeed,
                    caffeine: found.food.caffeine,
                    alcohol: found.food.alcohol,
                });
            } else {
                // Не найдено в базе — помечаем для AI-оценки
                const fallback = type === 'drink' ? FALLBACK_FOOD.drink : FALLBACK_FOOD.meal;
                const portionG = quantity.grams || fallback.defaultPortionG;
                const kcal = Math.round((fallback.per100g.kcal / 100) * portionG);

                mentions.push({
                    raw,
                    food: null,
                    portionG,
                    kcal,
                    protein: null,
                    fat: null,
                    carbs: null,
                    waterMl: Math.round(fallback.hydrationMl * (portionG / fallback.defaultPortionG)),
                    type,
                    confidence: 0.2, // низкая уверенность — нужна AI-оценка
                    source: 'fallback',
                    needsAiEstimate: true,
                    digestSpeed: fallback.digestSpeed,
                    caffeine: false,
                    alcohol: false,
                });
            }
        }
    }

    return mentions;
}

// ═══════════════════════════════════════════════════════════════
// ОПРЕДЕЛЕНИЕ КОЛИЧЕСТВА
// ═══════════════════════════════════════════════════════════════

/**
 * Извлечь количество из контекста вокруг найденного продукта
 */
function extractQuantity(text, matchIndex) {
    // Берём 40 символов до и 20 после совпадения
    const start = Math.max(0, matchIndex - 40);
    const end = Math.min(text.length, matchIndex + 60);
    const context = text.slice(start, end).toLowerCase();

    const result = { count: 1, grams: null, multiplier: 1.0 };

    // Проверяем паттерны количества
    for (const { re, type } of QUANTITY_PATTERNS) {
        const qm = context.match(re);
        if (!qm) continue;

        if (type === 'count') {
            result.count = parseFloat(qm[1]) || 1;
        } else if (type === 'grams') {
            result.grams = parseFloat(qm[1]) || null;
        } else if (type === 'half') {
            result.multiplier = 0.5;
        } else if (type === 'piece') {
            result.count = 1;
            result.multiplier = 0.5; // кусок ≈ половина порции
        }
        break; // берём первое совпадение
    }

    // Числительные словами
    for (const [word, num] of Object.entries(WORD_NUMBERS)) {
        if (context.includes(word)) {
            result.count = num;
            break;
        }
    }

    return result;
}

/**
 * Рассчитать итоговую порцию в граммах
 */
function calcPortion(food, quantity) {
    if (quantity.grams) {
        return quantity.grams * quantity.multiplier;
    }
    return food.defaultPortionG * quantity.count * quantity.multiplier;
}

// ═══════════════════════════════════════════════════════════════
// ПАТТЕРНЫ АКТИВНОСТИ (бег, ходьба, бой и т.д.)
// ═══════════════════════════════════════════════════════════════

const ACTIVITY_PATTERNS_RU = [
    { re: /(?:бежит|бегает|побежал[аи]?|бег)\b/i, activity: 'running', kcalPerMin: 10 },
    { re: /(?:идёт|шагает|прогулк|ходьб|пошл[аи]?)\b/i, activity: 'walking', kcalPerMin: 4 },
    { re: /(?:дерётся|сражается|бой|битва|драк)/i, activity: 'fighting', kcalPerMin: 12 },
    { re: /(?:плывёт|плавает|купается)/i, activity: 'swimming', kcalPerMin: 8 },
    { re: /(?:танцует|пляшет)/i, activity: 'dancing', kcalPerMin: 6 },
    { re: /(?:карабкается|лезет|взбирается)/i, activity: 'climbing', kcalPerMin: 9 },
    { re: /(?:копает|рубит|таскает|тяжёл)/i, activity: 'heavy_labor', kcalPerMin: 8 },
    { re: /(?:спит|уснул|дремлет|отдыхает|лежит)/i, activity: 'resting', kcalPerMin: 1 },
    { re: /(?:секс|занимается любовью|трахает|постел)/i, activity: 'sex', kcalPerMin: 5 },
];

const ACTIVITY_PATTERNS_EN = [
    { re: /\b(?:runs?|running|sprints?)\b/i, activity: 'running', kcalPerMin: 10 },
    { re: /\b(?:walks?|walking|hikes?)\b/i, activity: 'walking', kcalPerMin: 4 },
    { re: /\b(?:fights?|fighting|combat|battle)\b/i, activity: 'fighting', kcalPerMin: 12 },
    { re: /\b(?:swims?|swimming)\b/i, activity: 'swimming', kcalPerMin: 8 },
    { re: /\b(?:danc(?:es?|ing))\b/i, activity: 'dancing', kcalPerMin: 6 },
    { re: /\b(?:climbs?|climbing)\b/i, activity: 'climbing', kcalPerMin: 9 },
    { re: /\b(?:sleeps?|sleeping|rests?|resting|naps?)\b/i, activity: 'resting', kcalPerMin: 1 },
];

/**
 * Определить физическую активность из текста.
 * Не определяет длительность — это задача AI-тега (duration).
 * @returns {{ activity: string, kcalPerMin: number } | null}
 */
export function detectActivity(text) {
    if (!text) return null;

    const clean = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '');
    const allPatterns = [...ACTIVITY_PATTERNS_RU, ...ACTIVITY_PATTERNS_EN];

    for (const { re, activity, kcalPerMin } of allPatterns) {
        if (re.test(clean)) {
            return { activity, kcalPerMin };
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════
// ВРЕМЯ ИЗ ТЕГА ИИ
// ═══════════════════════════════════════════════════════════════

const TIME_TAG_RE = /<!--\s*NUT[^>]*?\btp\s*=\s*([\d.,]+)/i;

/**
 * Извлечь прошедшее время (часы) из тега NUT
 */
export function parseTimePassed(text) {
    if (!text) return null;
    const m = text.match(TIME_TAG_RE);
    if (!m) return null;
    const hours = parseFloat(m[1].replace(',', '.'));
    return isNaN(hours) ? null : Math.max(0, Math.min(720, hours));
}

// ═══════════════════════════════════════════════════════════════
// HORAE INTEGRATION (если установлен)
// ═══════════════════════════════════════════════════════════════

const HORAE_TIME_RE = /time:\s*(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s+(\d{1,2}):(\d{2})/i;
const HORAE_DATE_RE = /(?:date|time):\s*(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/i;

export function parseHoraeTime(text) {
    if (!text) return null;
    const mFull = text.match(HORAE_TIME_RE);
    if (mFull) {
        return {
            totalMinutes: Date.UTC(+mFull[1], +mFull[2] - 1, +mFull[3], +mFull[4], +mFull[5]) / 60000,
        };
    }
    const mDate = text.match(HORAE_DATE_RE);
    if (mDate) {
        return {
            totalMinutes: Date.UTC(+mDate[1], +mDate[2] - 1, +mDate[3]) / 60000,
        };
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════
// ГЛАВНАЯ ФУНКЦИЯ ПАРСИНГА СООБЩЕНИЯ
// ═══════════════════════════════════════════════════════════════

/**
 * Полный парсинг одного сообщения.
 * @param {string} text — текст сообщения
 * @param {boolean} isAiMessage — это ответ ИИ (может содержать NUT-тег)
 * @returns {{
 *   foodItems: Array,       — найденная еда (из базы или fallback)
 *   aiEstimates: Array,     — данные из AI-тега <!-- NUT -->
 *   activity: object|null,  — обнаруженная активность
 *   timePassed: number|null,— часы из tp=
 *   horaeTime: object|null, — время Horae (если есть)
 *   needsAiHelp: boolean,   — есть ли продукты с низкой уверенностью
 * }}
 */
export function parseMessage(text, isAiMessage = false) {
    const result = {
        foodItems: [],
        aiEstimates: [],
        activity: null,
        timePassed: null,
        horaeTime: null,
        needsAiHelp: false,
    };

    if (!text) return result;

    // 1) AI-тег (приоритет — точные данные от ИИ)
    if (isAiMessage) {
        result.aiEstimates = parseNutTags(text);
        result.timePassed = parseTimePassed(text);
        result.horaeTime = parseHoraeTime(text);
    }

    // 2) Текстовый парсинг еды
    result.foodItems = extractFoodMentions(text);

    // 3) Активность
    result.activity = detectActivity(text);

    // 4) Нужна ли AI-помощь?
    result.needsAiHelp = result.foodItems.some(f => f.confidence < 0.4);

    return result;
}
