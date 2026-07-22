// nutrition-framework/prompt.js

import {
    CRITICAL_PROMPT_OVERRIDE,
    HUNGER_THRESHOLDS,
    HYDRATION_THRESHOLDS,
    STARVATION_EFFECTS,
    DEHYDRATION_EFFECTS,
} from './constants.js';

import { getSummary, isCriticalState, getWorstEffect } from './engine.js';

// ═══════════════════════════════════════════════════════════════
// ГЛАВНАЯ ФУНКЦИЯ — СОБРАТЬ ПРОМПТ
// ═══════════════════════════════════════════════════════════════

/**
 * Построить системный промпт для инжекта.
 * @param {object} charState — состояние персонажа (из engine)
 * @param {object} options — { charName, enableAiEstimate, pendingFoodQueries }
 * @returns {string}
 */
export function buildNutritionPrompt(charState, options = {}) {
    const {
        charName = 'the character',
        enableAiEstimate = true,
        pendingFoodQueries = [],
    } = options;

    const summary = getSummary(charState);
    const critical = isCriticalState(charState);

    // ── КРИТИЧЕСКОЕ СОСТОЯНИЕ — OVERRIDE ──
    if (critical) {
        return buildCriticalPrompt(charState, charName, summary);
    }

    // ── НОРМАЛЬНЫЙ ПРОМПТ ──
    let prompt = `[NUTRITION STATE — ${charName}. Weave naturally into narration. Never quote numbers or stat names.]\n`;

    // Состояние тела
    prompt += buildBodyBlock(charState, charName, summary);

    // Активные эффекты (дебаффы)
    prompt += buildEffectsBlock(charState, charName, summary);

    // Инструкция по AI-тегу
    prompt += buildTagInstructions(charName, enableAiEstimate, pendingFoodQueries);

    return prompt;
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: КРИТИЧЕСКОЕ СОСТОЯНИЕ (severity 4)
// ═══════════════════════════════════════════════════════════════

function buildCriticalPrompt(charState, charName, summary) {
    const worst = getWorstEffect(charState);
    const hint = worst?.promptHint || 'is in a life-threatening state from malnutrition';

    let prompt = CRITICAL_PROMPT_OVERRIDE + '\n';
    prompt += `${charName} ${hint}\n\n`;

    // Даже в критическом состоянии — инструкция по тегу (чтобы время шло)
    prompt += buildTagInstructions(charName, true, []);

    return prompt;
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: СОСТОЯНИЕ ТЕЛА
// ═══════════════════════════════════════════════════════════════

function buildBodyBlock(charState, charName, summary) {
    const lines = [];

    // Голод
    const hungerDesc = getHungerDescription(summary.hunger, charState);
    if (hungerDesc) lines.push(hungerDesc);

    // Гидратация
    const hydrationDesc = getHydrationDescription(summary.hydration, charState);
    if (hydrationDesc) lines.push(hydrationDesc);

    // Энергия / усталость
    const energyDesc = getEnergyDescription(charState, summary);
    if (energyDesc) lines.push(energyDesc);

    // Вес (только если заметно отклоняется)
    const weightDesc = getWeightDescription(summary);
    if (weightDesc) lines.push(weightDesc);

    // Желудок (если переела или только что поела)
    const stomachDesc = getStomachDescription(summary);
    if (stomachDesc) lines.push(stomachDesc);

    if (lines.length === 0) {
        return `Physical state: healthy, no nutritional concerns.\n\n`;
    }

    return `Physical state:\n${lines.map(l => `• ${l}`).join('\n')}\n\n`;
}

// ── Описания состояний (человеческим языком для ИИ) ──

function getHungerDescription(hungerThreshold, charState) {
    // Не упоминаем если всё нормально
    if (hungerThreshold.severity === 0) {
        if (hungerThreshold.id === 'stuffed') {
            return `${getSubject()} is uncomfortably full — overate recently, feels bloated and sluggish`;
        }
        return null; // full/satisfied — не упоминаем
    }

    const descs = {
        peckish: 'is getting a bit hungry — stomach occasionally reminds of itself, slight distraction',
        hungry: 'is noticeably hungry — stomach growling audibly, harder to focus, thinking about food',
        very_hungry: 'is very hungry — weakness in limbs, lightheaded when standing up, irritable, hands slightly unsteady',
        starving: 'is starving — body shutting down, dizzy, trembling, vision darkening at edges, cannot function normally',
    };

    return descs[hungerThreshold.id] || null;
}

function getHydrationDescription(hydrationThreshold, charState) {
    if (hydrationThreshold.severity === 0) return null;

    const descs = {
        mild: 'is mildly thirsty — dry lips, slight headache building',
        moderate: 'is dehydrated — persistent headache, dry mouth, reduced stamina, needs water',
        severe: 'is severely dehydrated — confusion, rapid pulse, muscle cramps, dark circles under eyes',
        critical: 'is critically dehydrated — barely conscious, organs stressed, needs water immediately or will collapse',
    };

    return descs[hydrationThreshold.id] || null;
}

function getEnergyDescription(charState, summary) {
    const available = summary.availableEnergy || 0;
    const tdee = summary.tdee || 1800;
    const hourlyNeed = tdee / 24;

    // Если доступной энергии меньше чем на 2 часа — усталость
    if (available < hourlyNeed * 2 && summary.hunger.severity >= 2) {
        return 'energy is very low — movements slow, reaction time delayed, body conserving resources';
    }
    if (available < hourlyNeed * 4 && summary.hunger.severity >= 1) {
        return 'energy is dipping — slight fatigue, less enthusiasm for physical activity';
    }
    return null;
}

function getWeightDescription(summary) {
    if (summary.weightCategory.id === 'underweight') {
        return `is underweight (BMI ${summary.bmi}) — visible thinness, reduced cold tolerance, fragile appearance`;
    }
    if (summary.weightCategory.id === 'obese') {
        return `is overweight — reduced stamina, gets winded easily, joints under stress`;
    }
    // Normal and slightly overweight — don't mention
    return null;
}

function getStomachDescription(summary) {
    if (summary.stomachPct > 80) {
        return 'stomach is very full — uncomfortable, slightly nauseous, does not want more food';
    }
    if (summary.stomachPct > 60) {
        return 'recently ate — stomach still processing, satisfied feeling';
    }
    return null;
}

function getSubject() {
    return 'character'; // будет заменено на имя в buildBodyBlock
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: АКТИВНЫЕ ЭФФЕКТЫ
// ═══════════════════════════════════════════════════════════════

function buildEffectsBlock(charState, charName, summary) {
    const effects = summary.effects || [];
    if (effects.length === 0) return '';

    let block = `Active nutrition effects on ${charName}:\n`;
    for (const eff of effects) {
        block += `• [${eff.type.toUpperCase()}] ${eff.nameEn}: ${eff.promptHint}\n`;
    }
    block += `These effects MUST influence ${charName}'s behaviour, appearance, and capabilities. They are real physical states, not flavour.\n\n`;

    return block;
}

// ═══════════════════════════════════════════════════════════════
// БЛОК: ИНСТРУКЦИИ ПО AI-ТЕГУ
// ═══════════════════════════════════════════════════════════════

function buildTagInstructions(charName, enableAiEstimate, pendingFoodQueries) {
    let block = `MECHANICAL — REQUIRED at the END of every reply, on its own line:\n`;
    block += `<!-- NUT tp=HOURS -->\n\n`;
    block += `Fields:\n`;
    block += `  tp = NUMBER: in-world hours elapsed since previous message (sleep/travel included; a night=8, short scene=0.5). ALWAYS include.\n\n`;

    if (enableAiEstimate) {
        block += `FOOD/DRINK TRACKING — if ${charName} or anyone around them eats or drinks ANYTHING in this scene, append ADDITIONAL NUT tags (one per item):\n`;
        block += `<!-- NUT food=ITEM_NAME | kcal=NUMBER | portion=NUMBERg | protein=NUMBER | fat=NUMBER | carbs=NUMBER | water=NUMBER -->\n\n`;
        block += `Rules for food tags:\n`;
        block += `• Estimate realistically based on the food described. A bowl of soup ≈ 150kcal/350g. A steak ≈ 500kcal/250g.\n`;
        block += `• "portion" is in grams. "water" is hydration in ml.\n`;
        block += `• If the character DRINKS something: <!-- NUT food=tea | kcal=2 | portion=250g | water=230 -->\n`;
        block += `• If a meal is complex (stew with bread), you may use ONE tag with combined values OR separate tags.\n`;
        block += `• Do NOT add food tags if nobody ate/drank anything this turn.\n`;
        block += `• These are HTML comments — invisible to the reader. Never skip tp.\n\n`;

        block += `ACTIVITY — if ${charName} does significant physical activity (running, fighting, heavy labor, sex), append:\n`;
        block += `<!-- NUT activity=TYPE | duration=MINUTES -->\n`;
        block += `Types: running, walking, fighting, swimming, climbing, heavy_labor, dancing, sex, resting\n\n`;
    }

    // Если есть продукты, которые парсер не определил — просим ИИ оценить
    if (pendingFoodQueries.length > 0) {
        block += `IMPORTANT — The following foods were mentioned but could not be identified. Please provide NUT tags with your best nutritional estimate:\n`;
        for (const q of pendingFoodQueries) {
            block += `• "${q}"\n`;
        }
        block += `\n`;
    }

    block += `Examples (yours will differ — use truth of THIS turn):\n`;
    block += `<!-- NUT tp=0.5 -->\n`;
    block += `<!-- NUT tp=8 -->\n`;
    block += `<!-- NUT tp=1 | food=porridge with honey | kcal=320 | portion=300g | protein=8 | fat=5 | carbs=55 | water=200 -->\n`;
    block += `<!-- NUT tp=0.5 | activity=fighting | duration=10 -->\n`;

    return block;
}

// ═══════════════════════════════════════════════════════════════
// КОМПАКТНЫЙ ПРОМПТ (для ограниченного контекста)
// ═══════════════════════════════════════════════════════════════

/**
 * Минимальный промпт — только состояние + tp инструкция.
 * Используется если контекст ограничен.
 */
export function buildCompactPrompt(charState, charName = 'character') {
    const summary = getSummary(charState);

    if (isCriticalState(charState)) {
        return buildCriticalPrompt(charState, charName, summary);
    }

    const lines = [];

    // Только значимые отклонения
    if (summary.hunger.severity >= 1) lines.push(summary.hunger.labelEn);
    if (summary.hydration.severity >= 1) lines.push(summary.hydration.labelEn);
    if (summary.weightCategory.id !== 'normal') lines.push(summary.weightCategory.labelEn);
    if (summary.stomachPct > 70) lines.push('Recently ate');

    let prompt = `[NUT: ${charName}`;
    if (lines.length > 0) {
        prompt += ` — ${lines.join(', ')}`;
    } else {
        prompt += ` — well-fed, healthy`;
    }
    prompt += `]\n`;

    // Минимальная инструкция по тегу
    prompt += `End reply with: <!-- NUT tp=HOURS_ELAPSED -->`;
    if (lines.length === 0) {
        prompt += ` (add food/drink tags if character eats)`;
    }
    prompt += `\n`;

    return prompt;
}

// ═══════════════════════════════════════════════════════════════
// ПРОМПТ ДЛЯ НЕСКОЛЬКИХ ПЕРСОНАЖЕЙ
// ═══════════════════════════════════════════════════════════════

/**
 * Построить промпт для нескольких отслеживаемых персонажей.
 * @param {Array<{charState, charName}>} characters
 * @param {object} globalOptions
 * @returns {string}
 */
export function buildMultiCharPrompt(characters, globalOptions = {}) {
    if (!characters || characters.length === 0) return '';

    const { compact = false, pendingFoodQueries = [] } = globalOptions;

    // Если один персонаж — полный промпт
    if (characters.length === 1) {
        const { charState, charName } = characters[0];
        if (compact) return buildCompactPrompt(charState, charName);
        return buildNutritionPrompt(charState, { charName, pendingFoodQueries });
    }

    // Несколько персонажей — компактный формат для каждого + общие инструкции
    let prompt = `[NUTRITION STATE — tracking ${characters.length} characters. Weave physical states naturally.]\n\n`;

    for (const { charState, charName } of characters) {
        const summary = getSummary(charState);
        const critical = isCriticalState(charState);

        if (critical) {
            const worst = getWorstEffect(charState);
            prompt += `⚠ ${charName}: CRITICAL — ${worst?.promptHint || 'life-threatening malnutrition'}\n`;
        } else {
            const lines = [];
            if (summary.hunger.severity >= 1) lines.push(summary.hunger.labelEn);
            if (summary.hydration.severity >= 1) lines.push(summary.hydration.labelEn);
            if (summary.stomachPct > 70) lines.push('full stomach');

            if (lines.length > 0) {
                prompt += `• ${charName}: ${lines.join(', ')}\n`;
            } else {
                prompt += `• ${charName}: well-fed, healthy\n`;
            }
        }
    }

    prompt += `\n`;

    // Общие инструкции по тегам — один раз
    prompt += buildTagInstructions('any character who eats/drinks', true, pendingFoodQueries);

    // Критический override если хоть один персонаж в критическом состоянии
    const anyCritical = characters.some(c => isCriticalState(c.charState));
    if (anyCritical) {
        prompt = CRITICAL_PROMPT_OVERRIDE + '\n' + prompt;
    }

    return prompt;
}

// ═══════════════════════════════════════════════════════════════
// УТИЛИТЫ ДЛЯ ВНЕШНЕГО ИСПОЛЬЗОВАНИЯ
// ═══════════════════════════════════════════════════════════════

/**
 * Оценить размер промпта в токенах (грубо: 1 токен ≈ 4 символа)
 */
export function estimateTokens(prompt) {
    return Math.ceil(prompt.length / 4);
}

/**
 * Нужен ли полный промпт или достаточно компактного?
 * Решает на основе severity.
 */
export function shouldUseFullPrompt(charState) {
    const summary = getSummary(charState);
    // Полный промпт если есть проблемы
    if (summary.hunger.severity >= 2) return true;
    if (summary.hydration.severity >= 2) return true;
    if (summary.effects.length > 0) return true;
    if (summary.weightCategory.id !== 'normal') return true;
    return false;
}
