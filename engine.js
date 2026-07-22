// nutrition-framework/engine.js

import {
    calcBMR, calcTDEE, calcBMI, getWeightCategory,
    KCAL_PER_KG_FAT, MAX_WEIGHT_CHANGE_PER_DAY,
    STOMACH_MAX_ML, STOMACH_COMFORTABLE_ML, STOMACH_EMPTY_RATE,
    DIGEST_SPEED,
    HYDRATION_MAX, WATER_LOSS_PER_HOUR,
    CAFFEINE_WATER_LOSS_MULT, ALCOHOL_WATER_LOSS_MULT,
    HUNGER_THRESHOLDS, HYDRATION_THRESHOLDS,
    STARVATION_EFFECTS, DEHYDRATION_EFFECTS,
    HOURS_WITHOUT_FOOD, HOURS_WITHOUT_WATER,
    SATIETY_DECAY_PER_HOUR,
    MINUTES_PER_HOUR,
} from './constants.js';

// ═══════════════════════════════════════════════════════════════
// ПИЩЕВАРЕНИЕ — Желудок
// ═══════════════════════════════════════════════════════════════

/**
 * Добавить еду в желудок.
 * @param {object} charState — состояние персонажа (мутируется)
 * @param {object} foodEntry — { foodId, name, portionG, kcal, protein, fat, carbs, waterMl, digestSpeed, satietyBonus }
 */
export function addFoodToStomach(charState, foodEntry) {
    if (!Array.isArray(charState.stomach)) charState.stomach = [];

    const entry = {
        id: `meal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        foodId: foodEntry.foodId || 'unknown',
        name: foodEntry.name || 'Unknown food',
        addedAt: charState.currentTime || 0, // игровое время в минутах
        totalG: foodEntry.portionG,
        remainingG: foodEntry.portionG,
        kcalTotal: foodEntry.kcal,
        kcalAbsorbed: 0,
        protein: foodEntry.protein,
        fat: foodEntry.fat,
        carbs: foodEntry.carbs,
        waterMl: foodEntry.waterMl || 0,
        digestSpeed: foodEntry.digestSpeed || 'medium',
        satietyBonus: foodEntry.satietyBonus || 0,
    };

    charState.stomach.push(entry);

    // Немедленные эффекты
    // 1) Насыщение от объёма
    const volumeBonus = Math.min(30, (foodEntry.portionG / STOMACH_COMFORTABLE_ML) * 25);
    charState.satiety = Math.min(100, (charState.satiety || 0) + volumeBonus + entry.satietyBonus);

    // 2) Гидратация от воды в еде
    if (entry.waterMl > 0) {
        addHydration(charState, entry.waterMl);
    }

    // 3) Обновить время последнего приёма пищи
    charState.lastMealTime = charState.currentTime || 0;

    // 4) Лог
    if (!Array.isArray(charState.mealLog)) charState.mealLog = [];
    charState.mealLog.push({
        time: charState.currentTime || 0,
        name: entry.name,
        kcal: entry.kcalTotal,
        portionG: entry.totalG,
    });

    // Обрезаем лог до 50 записей
    if (charState.mealLog.length > 50) {
        charState.mealLog = charState.mealLog.slice(-50);
    }
}

/**
 * Тик пищеварения — вызывается при каждом обновлении времени.
 * Постепенно переваривает содержимое желудка.
 * @param {object} charState
 * @param {number} elapsedMinutes — сколько игровых минут прошло
 */
export function tickDigestion(charState, elapsedMinutes) {
    if (!Array.isArray(charState.stomach) || charState.stomach.length === 0) return;
    if (elapsedMinutes <= 0) return;

    const toRemove = [];

    for (const entry of charState.stomach) {
        // Скорость переваривания зависит от типа пищи
        const speedMult = DIGEST_SPEED[entry.digestSpeed] || 1.0;

        // Базовая скорость: STOMACH_EMPTY_RATE (% объёма в минуту) × множитель
        const digestedG = entry.totalG * STOMACH_EMPTY_RATE * speedMult * elapsedMinutes;
        const actualDigested = Math.min(entry.remainingG, digestedG);

        // Какая доля от общей массы переварена за этот тик
        const fraction = actualDigested / entry.totalG;

        // Калории усваиваются пропорционально переваренной массе
        const kcalThisTick = entry.kcalTotal * fraction;
        entry.kcalAbsorbed += kcalThisTick;
        entry.remainingG -= actualDigested;

        // Добавляем усвоенные калории в «доступную энергию»
        charState.availableEnergy = (charState.availableEnergy || 0) + kcalThisTick;

        // Полностью переварено?
        if (entry.remainingG <= 0.5) {
            toRemove.push(entry.id);
        }
    }

    // Убираем переваренное
    charState.stomach = charState.stomach.filter(e => !toRemove.includes(e.id));
}

// ═══════════════════════════════════════════════════════════════
// ГИДРАТАЦИЯ
// ═══════════════════════════════════════════════════════════════

/**
 * Добавить воду (мл → % гидратации)
 */
export function addHydration(charState, waterMl) {
    // Примерно: 2500 мл в день = 100% гидратации
    // Значит 1% ≈ 25 мл
    const pctGain = waterMl / 25;
    charState.hydration = Math.min(HYDRATION_MAX, (charState.hydration || 70) + pctGain);
}

/**
 * Тик потери воды
 */
export function tickHydration(charState, elapsedMinutes) {
    if (elapsedMinutes <= 0) return;

    const hours = elapsedMinutes / MINUTES_PER_HOUR;
    const activity = charState.activityLevel || 'light';
    let lossRate = WATER_LOSS_PER_HOUR[activity] || WATER_LOSS_PER_HOUR.light;

    // Модификаторы
    if (charState.caffeinActive) lossRate *= CAFFEINE_WATER_LOSS_MULT;
    if (charState.alcoholActive) lossRate *= ALCOHOL_WATER_LOSS_MULT;

    const loss = lossRate * hours;
    charState.hydration = Math.max(0, (charState.hydration || 70) - loss);

    // Сбрасываем временные модификаторы через 2 часа
    if (charState.caffeineUntil && charState.currentTime > charState.caffeineUntil) {
        charState.caffeinActive = false;
    }
    if (charState.alcoholUntil && charState.currentTime > charState.alcoholUntil) {
        charState.alcoholActive = false;
    }
}

// ═══════════════════════════════════════════════════════════════
// ГОЛОД / НАСЫЩЕНИЕ
// ═══════════════════════════════════════════════════════════════

/**
 * Тик насыщения — постепенно падает со временем
 */
export function tickSatiety(charState, elapsedMinutes) {
    if (elapsedMinutes <= 0) return;

    const hours = elapsedMinutes / MINUTES_PER_HOUR;
    const decay = SATIETY_DECAY_PER_HOUR * hours;

    // Если в желудке есть еда — замедляем падение
    const stomachFill = getStomachFillPct(charState);
    const slowdown = stomachFill > 30 ? 0.5 : 1.0; // полный желудок замедляет голод

    charState.satiety = Math.max(0, (charState.satiety || 50) - decay * slowdown);
}

/**
 * Получить текущий уровень голода (hunger threshold)
 */
export function getHungerLevel(charState) {
    const satiety = charState.satiety || 0;
    return HUNGER_THRESHOLDS.find(t => satiety >= t.min && satiety <= t.max)
        || HUNGER_THRESHOLDS[HUNGER_THRESHOLDS.length - 1]; // starving
}

/**
 * Получить текущий уровень гидратации (threshold)
 */
export function getHydrationLevel(charState) {
    const hydration = charState.hydration || 0;
    return HYDRATION_THRESHOLDS.find(t => hydration >= t.min && hydration <= t.max)
        || HYDRATION_THRESHOLDS[HYDRATION_THRESHOLDS.length - 1]; // critical
}

/**
 * Заполненность желудка в процентах
 */
export function getStomachFillPct(charState) {
    if (!Array.isArray(charState.stomach)) return 0;
    const totalG = charState.stomach.reduce((s, e) => s + e.remainingG, 0);
    return Math.min(100, (totalG / STOMACH_MAX_ML) * 100);
}

// ═══════════════════════════════════════════════════════════════
// МЕТАБОЛИЗМ И ВЕС
// ═══════════════════════════════════════════════════════════════

/**
 * Тик метаболизма — расход энергии, изменение веса
 */
export function tickMetabolism(charState, elapsedMinutes) {
    if (elapsedMinutes <= 0) return;

    const hours = elapsedMinutes / MINUTES_PER_HOUR;

    // BMR и TDEE
    const bmr = calcBMR(
        charState.sex || 'female',
        charState.weightKg || 60,
        charState.heightCm || 165,
        charState.age || 25
    );
    const tdee = calcTDEE(bmr, charState.activityLevel || 'light');

    // Расход за этот период (ккал)
    const expenditure = (tdee / 24) * hours;

    // Доступная энергия (из переваренной пищи)
    const available = charState.availableEnergy || 0;

    // Баланс
    const balance = available - expenditure;

    // Обнуляем доступную энергию (потрачена)
    charState.availableEnergy = Math.max(0, available - expenditure);

    // Накопительный баланс за день (для расчёта веса)
    charState.dailyBalance = (charState.dailyBalance || 0) + balance;

    // Сохраняем для отладки
    charState.lastBMR = Math.round(bmr);
    charState.lastTDEE = Math.round(tdee);
    charState.lastExpenditure = Math.round(expenditure);

    // Изменение веса (плавное, ограниченное)
    // Пересчитываем раз в 24 часа игрового времени
    charState.hoursAccumulated = (charState.hoursAccumulated || 0) + hours;

    if (charState.hoursAccumulated >= 24) {
        const dailyBal = charState.dailyBalance || 0;
        let weightChange = dailyBal / KCAL_PER_KG_FAT;

        // Ограничение
        weightChange = Math.max(-MAX_WEIGHT_CHANGE_PER_DAY, Math.min(MAX_WEIGHT_CHANGE_PER_DAY, weightChange));

        charState.weightKg = Math.max(30, (charState.weightKg || 60) + weightChange);
        charState.lastWeightChange = weightChange;

        // Сброс счётчиков
        charState.dailyBalance = 0;
        charState.hoursAccumulated -= 24;

        // Обновляем BMI
        charState.bmi = calcBMI(charState.weightKg, charState.heightCm || 165);
        charState.weightCategory = getWeightCategory(charState.weightKg, charState.heightCm || 165);
    }
}

// ═══════════════════════════════════════════════════════════════
// ДЕБАФФЫ / КРИТИЧЕСКИЕ СОСТОЯНИЯ
// ═══════════════════════════════════════════════════════════════

/**
 * Проверить и применить дебаффы от голода/жажды.
 * Возвращает массив активных эффектов.
 */
export function checkNutritionEffects(charState) {
    const effects = [];

    // Голод
    const hunger = getHungerLevel(charState);
    if (hunger.severity >= 2) {
        const effect = STARVATION_EFFECTS.find(e => e.severity === hunger.severity)
            || STARVATION_EFFECTS.find(e => e.severity <= hunger.severity);
        if (effect) effects.push({ ...effect, source: 'hunger' });
    }

    // Обезвоживание
    const hydration = getHydrationLevel(charState);
    if (hydration.severity >= 2) {
        const effect = DEHYDRATION_EFFECTS.find(e => e.severity === hydration.severity)
            || DEHYDRATION_EFFECTS.find(e => e.severity <= hydration.severity);
        if (effect) effects.push({ ...effect, source: 'dehydration' });
    }

    charState.activeNutritionEffects = effects;
    return effects;
}

/**
 * Определить, нужен ли «стоп ролплей» (severity 4)
 */
export function isCriticalState(charState) {
    const effects = charState.activeNutritionEffects || [];
    return effects.some(e => e.type === 'critical');
}

/**
 * Получить самый серьёзный эффект (для промпта)
 */
export function getWorstEffect(charState) {
    const effects = charState.activeNutritionEffects || [];
    if (effects.length === 0) return null;
    return effects.reduce((worst, e) => e.severity > worst.severity ? e : worst);
}

// ═══════════════════════════════════════════════════════════════
// ГЛАВНЫЙ ТИК — вызывается при каждом обновлении времени
// ═══════════════════════════════════════════════════════════════

/**
 * Обновить всё состояние персонажа за прошедшее время.
 * @param {object} charState — состояние персонажа (мутируется)
 * @param {number} elapsedMinutes — сколько игровых минут прошло
 * @returns {{ effects: array, critical: boolean, notifications: array }}
 */
export function tick(charState, elapsedMinutes) {
    if (elapsedMinutes <= 0) return { effects: [], critical: false, notifications: [] };

    const notifications = [];

    // Обновляем текущее время
    charState.currentTime = (charState.currentTime || 0) + elapsedMinutes;

    // 1) Пищеварение
    tickDigestion(charState, elapsedMinutes);

    // 2) Гидратация (потеря воды)
    const hydBefore = charState.hydration || 70;
    tickHydration(charState, elapsedMinutes);

    // 3) Насыщение (голод нарастает)
    const satBefore = charState.satiety || 50;
    tickSatiety(charState, elapsedMinutes);

    // 4) Метаболизм и вес
    tickMetabolism(charState, elapsedMinutes);

    // 5) Проверка дебаффов
    const prevEffects = [...(charState.activeNutritionEffects || [])];
    const effects = checkNutritionEffects(charState);

    // Уведомления о новых эффектах
    for (const eff of effects) {
        const wasActive = prevEffects.some(p => p.id === eff.id);
        if (!wasActive) {
            notifications.push({
                type: eff.type === 'critical' ? 'critical' : 'warning',
                text: eff.nameRu,
                description: eff.description,
            });
        }
    }

    // Уведомление о снятии эффекта
    for (const prev of prevEffects) {
        const stillActive = effects.some(e => e.id === prev.id);
        if (!stillActive) {
            notifications.push({
                type: 'recovery',
                text: `${prev.nameRu} — прошло`,
            });
        }
    }

    const critical = isCriticalState(charState);

    return { effects, critical, notifications };
}

// ═══════════════════════════════════════════════════════════════
// УТИЛИТЫ
// ═══════════════════════════════════════════════════════════════

/**
 * Получить сводку состояния (для UI)
 */
export function getSummary(charState) {
    const hunger = getHungerLevel(charState);
    const hydration = getHydrationLevel(charState);
    const stomachPct = getStomachFillPct(charState);
    const bmi = calcBMI(charState.weightKg || 60, charState.heightCm || 165);
    const weightCat = getWeightCategory(charState.weightKg || 60, charState.heightCm || 165);

    return {
        hunger,
        hydration,
        stomachPct: Math.round(stomachPct),
        satiety: Math.round(charState.satiety || 0),
        hydrationPct: Math.round(charState.hydration || 0),
        weightKg: Math.round((charState.weightKg || 60) * 10) / 10,
        bmi: Math.round(bmi * 10) / 10,
        weightCategory: weightCat,
        bmr: charState.lastBMR || 0,
        tdee: charState.lastTDEE || 0,
        availableEnergy: Math.round(charState.availableEnergy || 0),
        effects: charState.activeNutritionEffects || [],
        critical: isCriticalState(charState),
        stomachContents: (charState.stomach || []).map(e => ({
            name: e.name,
            remainingPct: Math.round((e.remainingG / e.totalG) * 100),
        })),
    };
}

/**
 * Инициализировать дефолтное состояние питания для персонажа
 */
export function initNutritionState(profile = {}) {
    return {
        // Физиология
        sex: profile.sex || 'female',
        age: profile.age || 25,
        heightCm: profile.heightCm || 165,
        weightKg: profile.weightKg || 58,
        bodyFatPct: profile.bodyFatPct || 24,
        activityLevel: profile.activityLevel || 'light',

        // Питание
        satiety: 60,           // начинаем «нормально поевшими»
        hydration: 75,         // нормальная гидратация
        stomach: [],           // содержимое желудка
        availableEnergy: 0,    // усвоенные ккал (ещё не потрачены)
        mealLog: [],           // история приёмов пищи

        // Метаболизм
        dailyBalance: 0,
        hoursAccumulated: 0,
        lastBMR: 0,
        lastTDEE: 0,
        lastExpenditure: 0,
        lastWeightChange: 0,
        bmi: calcBMI(profile.weightKg || 58, profile.heightCm || 165),
        weightCategory: getWeightCategory(profile.weightKg || 58, profile.heightCm || 165),

        // Время
        currentTime: 0,        // игровые минуты от начала
        lastMealTime: 0,
        lastDrinkTime: 0,

        // Модификаторы
        caffeinActive: false,
        alcoholActive: false,
        caffeineUntil: 0,
        alcoholUntil: 0,

        // Эффекты
        activeNutritionEffects: [],

        // Мета
        version: 1,
    };
}
