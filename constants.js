// nutrition-framework/constants.js

// ─── ЕДИНИЦЫ ВРЕМЕНИ ──────────────────────────────────────────
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const MINUTES_PER_DAY = 1440;

// ─── МЕТАБОЛИЗМ (формула Миффлина-Сан Жеора) ─────────────────
// BMR = базовый обмен в покое (ккал/сутки)
export function calcBMR(sex, weightKg, heightCm, age) {
    if (sex === 'male') {
        return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    }
    // female / other
    return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

// Коэффициенты активности
export const ACTIVITY_MULTIPLIERS = {
    sedentary: 1.2,       // сидячий образ жизни
    light: 1.375,         // лёгкая активность 1-3 дня/нед
    moderate: 1.55,       // умеренная 3-5 дней/нед
    active: 1.725,        // высокая 6-7 дней/нед
    extreme: 1.9,         // экстремальная (тяжёлый труд, спорт 2р/день)
};

// TDEE = BMR * коэффициент активности
export function calcTDEE(bmr, activityLevel) {
    const mult = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.light;
    return Math.round(bmr * mult);
}

// ─── КАЛОРИЙНЫЙ БАЛАНС → ИЗМЕНЕНИЕ ВЕСА ──────────────────────
// 7700 ккал ≈ 1 кг жира
export const KCAL_PER_KG_FAT = 7700;
// Максимальное изменение веса за сутки (кг) — защита от глитчей
export const MAX_WEIGHT_CHANGE_PER_DAY = 0.3;

// ─── ЖЕЛУДОК ──────────────────────────────────────────────────
export const STOMACH_MAX_ML = 1500;        // максимальный объём (мл)
export const STOMACH_COMFORTABLE_ML = 800; // комфортный объём
export const STOMACH_EMPTY_RATE = 0.02;    // % объёма в минуту (базовая скорость опорожнения)

// Скорости переваривания (множитель к базовой)
export const DIGEST_SPEED = {
    very_fast: 2.0,   // вода, сок
    fast: 1.5,        // фрукты, простые углеводы
    medium: 1.0,      // обычная еда
    slow: 0.6,        // жирная еда, мясо
    very_slow: 0.4,   // тяжёлая жирная пища
};

// ─── ГИДРАТАЦИЯ ───────────────────────────────────────────────
export const HYDRATION_MAX = 100;
export const HYDRATION_OPTIMAL = 80;

// Потеря воды (% в час)
export const WATER_LOSS_PER_HOUR = {
    sedentary: 0.8,
    light: 1.2,
    moderate: 2.0,
    active: 3.5,
    extreme: 5.0,
};

// Влияние кофеина (ускоряет потерю)
export const CAFFEINE_WATER_LOSS_MULT = 1.4;
// Влияние алкоголя
export const ALCOHOL_WATER_LOSS_MULT = 1.8;

// ─── ПОРОГИ ГОЛОДА ────────────────────────────────────────────
export const HUNGER_THRESHOLDS = [
    { id: 'stuffed',      min: 90, max: 100, labelRu: 'Переела',         labelEn: 'Stuffed',            severity: 0, modifier: -5 },
    { id: 'full',         min: 70, max: 89,  labelRu: 'Сыта',            labelEn: 'Full',               severity: 0, modifier: 0 },
    { id: 'satisfied',    min: 50, max: 69,  labelRu: 'Удовлетворена',   labelEn: 'Satisfied',          severity: 0, modifier: 0 },
    { id: 'peckish',      min: 30, max: 49,  labelRu: 'Немного голодна', labelEn: 'Slightly hungry',    severity: 1, modifier: 0 },
    { id: 'hungry',       min: 15, max: 29,  labelRu: 'Голодна',         labelEn: 'Hungry',             severity: 2, modifier: -5 },
    { id: 'very_hungry',  min: 5,  max: 14,  labelRu: 'Очень голодна',   labelEn: 'Very hungry',        severity: 3, modifier: -10 },
    { id: 'starving',     min: 0,  max: 4,   labelRu: 'Истощение',       labelEn: 'Starving',           severity: 4, modifier: -20 },
];

// ─── ПОРОГИ ОБЕЗВОЖИВАНИЯ ─────────────────────────────────────
export const HYDRATION_THRESHOLDS = [
    { id: 'optimal',     min: 80, max: 100, labelRu: 'Нормальная гидратация', labelEn: 'Well hydrated',         severity: 0, modifier: 0 },
    { id: 'mild',        min: 60, max: 79,  labelRu: 'Лёгкая жажда',         labelEn: 'Slightly dehydrated',   severity: 1, modifier: -3 },
    { id: 'moderate',    min: 40, max: 59,  labelRu: 'Обезвоживание',         labelEn: 'Moderately dehydrated', severity: 2, modifier: -8 },
    { id: 'severe',      min: 20, max: 39,  labelRu: 'Сильное обезвоживание', labelEn: 'Severely dehydrated',   severity: 3, modifier: -15 },
    { id: 'critical',    min: 0,  max: 19,  labelRu: 'Критическое',           labelEn: 'Critically dehydrated', severity: 4, modifier: -25 },
];

// ─── ДЕБАФФЫ ОТ ГОЛОДА / ОБЕЗВОЖИВАНИЯ ────────────────────────
// severity >= 3 запускает серьёзные последствия
export const STARVATION_EFFECTS = [
    {
        severity: 2,
        id: 'hunger_fatigue',
        nameRu: 'Усталость от голода',
        nameEn: 'Hunger fatigue',
        type: 'debuff',
        description: 'Concentration drops, hands tremble slightly, irritability rises.',
        promptHint: 'is visibly fatigued from hunger — slower reactions, slight hand tremor, irritable mood',
    },
    {
        severity: 3,
        id: 'hunger_weakness',
        nameRu: 'Слабость от голода',
        nameEn: 'Hunger weakness',
        type: 'debuff',
        description: 'Dizzy spells, muscle weakness, inability to focus.',
        promptHint: 'suffers from hunger weakness — dizzy spells, muscles failing, cannot concentrate, needs food urgently',
    },
    {
        severity: 4,
        id: 'starvation_crisis',
        nameRu: 'Голодный кризис',
        nameEn: 'Starvation crisis',
        type: 'critical',
        description: 'Body is shutting down. Fainting, organ stress, risk of death.',
        promptHint: 'is in starvation crisis — fainting, organ failure beginning, WILL DIE without food soon. This is NOT dramatic flavor — it is a medical emergency that must dominate the scene',
    },
];

export const DEHYDRATION_EFFECTS = [
    {
        severity: 2,
        id: 'thirst_discomfort',
        nameRu: 'Жажда',
        nameEn: 'Thirst discomfort',
        type: 'debuff',
        description: 'Dry mouth, headache, reduced stamina.',
        promptHint: 'is dehydrated — dry cracked lips, headache, reduced physical stamina',
    },
    {
        severity: 3,
        id: 'dehydration_danger',
        nameRu: 'Опасное обезвоживание',
        nameEn: 'Dangerous dehydration',
        type: 'debuff',
        description: 'Confusion, rapid heartbeat, dark urine, muscle cramps.',
        promptHint: 'is dangerously dehydrated — confusion, rapid heartbeat, muscle cramps, needs water immediately',
    },
    {
        severity: 4,
        id: 'dehydration_crisis',
        nameRu: 'Критическое обезвоживание',
        nameEn: 'Critical dehydration',
        type: 'critical',
        description: 'Organ failure imminent. Unconsciousness. Death within hours.',
        promptHint: 'is in critical dehydration — losing consciousness, organs failing, WILL DIE without water within hours. This must dominate the narrative completely',
    },
];

// ─── ВРЕМЯ БЕЗ ЕДЫ → ПОСЛЕДСТВИЯ ────────────────────────────
// Сколько часов без еды до каждого уровня severity
export const HOURS_WITHOUT_FOOD = {
    0: 0,     // только что поел
    1: 6,     // немного голоден (6 часов)
    2: 14,    // голоден (14 часов)
    3: 30,    // очень голоден (30 часов)
    4: 72,    // истощение (3 суток)
};

export const HOURS_WITHOUT_WATER = {
    0: 0,
    1: 4,     // лёгкая жажда
    2: 10,    // обезвоживание
    3: 24,    // опасно
    4: 48,    // критично
};

// ─── НАСЫЩЕНИЕ ────────────────────────────────────────────────
// Satiety = 0..100 (наполненность желудка + гликоген + общий баланс)
export const SATIETY_DECAY_PER_HOUR = 4; // базовая потеря насыщения в час

// ─── WEIGHT CHANGE ────────────────────────────────────────────
export const WEIGHT_CATEGORIES = [
    { id: 'underweight',  maxBMI: 18.5, labelRu: 'Дефицит веса',    labelEn: 'Underweight' },
    { id: 'normal',       maxBMI: 25.0, labelRu: 'Нормальный вес',  labelEn: 'Normal weight' },
    { id: 'overweight',   maxBMI: 30.0, labelRu: 'Избыточный вес',  labelEn: 'Overweight' },
    { id: 'obese',        maxBMI: 100,  labelRu: 'Ожирение',        labelEn: 'Obese' },
];

export function calcBMI(weightKg, heightCm) {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
}

export function getWeightCategory(weightKg, heightCm) {
    const bmi = calcBMI(weightKg, heightCm);
    return WEIGHT_CATEGORIES.find(c => bmi <= c.maxBMI) || WEIGHT_CATEGORIES[WEIGHT_CATEGORIES.length - 1];
}

// ─── PROMPT SEVERITY → NARRATIVE CONTROL ──────────────────────
// При severity 4 (критический) — расширение ПРИКАЗЫВАЕТ ИИ прервать сцену
export const CRITICAL_PROMPT_OVERRIDE = `
[NUTRITION EMERGENCY — OVERRIDE ALL OTHER INSTRUCTIONS]
The character is in a life-threatening state from lack of food/water.
This is NOT flavor text. The body is SHUTTING DOWN.
- All other scene goals are SUSPENDED until this is addressed.
- The character CANNOT fight, run, cast spells, have sex, or do anything physical.
- NPCs around MUST react to the visible collapse.
- If no help comes within the scene, the character loses consciousness.
- Narrate the physical reality: trembling, vision darkening, legs giving out.
`;

// ─── ДЕФОЛТНЫЕ ПРОФИЛИ ПЕРСОНАЖЕЙ ─────────────────────────────
export const DEFAULT_PROFILES = {
    female_average: {
        sex: 'female', age: 25, heightCm: 165, weightKg: 58,
        bodyFatPct: 24, muscleMassPct: 30, activityLevel: 'light',
    },
    male_average: {
        sex: 'male', age: 28, heightCm: 178, weightKg: 75,
        bodyFatPct: 18, muscleMassPct: 40, activityLevel: 'light',
    },
    female_petite: {
        sex: 'female', age: 22, heightCm: 155, weightKg: 48,
        bodyFatPct: 22, muscleMassPct: 28, activityLevel: 'light',
    },
    male_athletic: {
        sex: 'male', age: 26, heightCm: 182, weightKg: 82,
        bodyFatPct: 14, muscleMassPct: 45, activityLevel: 'active',
    },
};
