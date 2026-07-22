// nutrition-framework/index.js

import {
    chat, chat_metadata, name1,
    setExtensionPrompt, extension_prompt_types, extension_prompt_roles,
    saveChatDebounced,
} from '../../../../script.js';

import { eventSource, event_types } from '../../../../scripts/events.js';

// ── Наши модули ──
import {
    getState, loadState, saveState, resetState,
    getSettings, updateSettings, isEnabled, setEnabled,
    getPlayerCharacter, getActiveCharacter, getEnabledCharacters,
    createCharacter, removeCharacter, updateCharacterProfile,
    setActiveCharacter, syncPlayerName,
    updateGameTime, getElapsedMinutes, isMessageProcessed, markMessageProcessed,
    addPendingFoodQuery, clearPendingFoodQueries, getPendingFoodQueries,
    getDebugDump, onChatChanged as stateChatChanged,
} from './state.js';

import {
    tick, addFoodToStomach, addHydration,
    getSummary, isCriticalState,
    initNutritionState,
} from './engine.js';

import {
    parseMessage, parseNutTags, extractFoodMentions,
    parseTimePassed, parseHoraeTime,
} from './parser.js';

import {
    buildNutritionPrompt, buildCompactPrompt, buildMultiCharPrompt,
    shouldUseFullPrompt, estimateTokens,
} from './prompt.js';

import { buildUI, renderDashboard, renderDebug, showNotify, togglePanel } from './ui.js';

// ═══════════════════════════════════════════════════════════════
// КОНСТАНТЫ
// ═══════════════════════════════════════════════════════════════

const MODULE_NAME = 'nutritionFramework';
const PROMPT_KEY = 'nutrition_state';
const LOG_PREFIX = '[Nutrition]';

// ═══════════════════════════════════════════════════════════════
// ТИХИЙ РЕЖИМ (уведомления копятся и показываются после ответа ИИ)
// ═══════════════════════════════════════════════════════════════

let silentMode = false;
let pendingNotices = [];

function queueNotice(text, type = 'info', duration = 4000) {
    if (silentMode) {
        pendingNotices.push({ text, type, duration });
    } else {
        showNotify(text, type, duration);
    }
}

function flushNotices() {
    for (const n of pendingNotices) {
        showNotify(n.text, n.type, n.duration);
    }
    pendingNotices = [];
}

// ═══════════════════════════════════════════════════════════════
// ОБРАБОТКА ЕДЫ — применить к персонажу
// ═══════════════════════════════════════════════════════════════

/**
 * Обработать найденную еду и применить к состоянию персонажа
 */
function processFoodItem(charState, item) {
    const entry = {
        foodId: item.food?.id || 'unknown',
        name: item.raw || item.food?.names?.[0] || 'Unknown',
        portionG: item.portionG || 200,
        kcal: item.kcal || 0,
        protein: item.protein || 0,
        fat: item.fat || 0,
        carbs: item.carbs || 0,
        waterMl: item.waterMl || 0,
        digestSpeed: item.digestSpeed || 'medium',
        satietyBonus: getSatietyBonus(item),
    };

    addFoodToStomach(charState, entry);

    // Кофеин
    if (item.caffeine) {
        charState.caffeinActive = true;
        charState.caffeineUntil = (charState.currentTime || 0) + 120; // 2 часа
    }

    // Алкоголь
    if (item.alcohol) {
        charState.alcoholActive = true;
        charState.alcoholUntil = (charState.currentTime || 0) + 180; // 3 часа
    }

    const kcalText = item.kcal > 0 ? ` (≈${item.kcal} ккал)` : '';
    queueNotice(`🍽 ${entry.name}${kcalText}`, 'food', 3000);

    console.log(`${LOG_PREFIX} Food added:`, entry.name, `${entry.portionG}g, ${entry.kcal}kcal`);
}

/**
 * Обработать AI-оценку еды (из тега <!-- NUT -->)
 */
function processAiEstimate(charState, estimate) {
    if (estimate.type === 'activity') {
        processActivity(charState, estimate);
        return;
    }

    const entry = {
        foodId: 'ai_estimate',
        name: estimate.food || 'Food (AI estimate)',
        portionG: estimate.portionG || 200,
        kcal: estimate.kcal || 150,
        protein: estimate.protein || 5,
        fat: estimate.fat || 5,
        carbs: estimate.carbs || 20,
        waterMl: estimate.waterMl || 50,
        digestSpeed: estimate.digestSpeed || 'medium',
        satietyBonus: 0,
    };

    addFoodToStomach(charState, entry);

    const kcalText = entry.kcal > 0 ? ` (≈${entry.kcal} ккал)` : '';
    queueNotice(`🍽 ${entry.name}${kcalText}`, 'food', 3000);

    console.log(`${LOG_PREFIX} AI food estimate applied:`, entry.name, `${entry.kcal}kcal`);
}

/**
 * Обработать физическую активность
 */
function processActivity(charState, activity) {
    const duration = activity.duration || 30; // минуты
    const kcalPerMin = activity.kcalPerMin || 5;
    const totalBurn = duration * kcalPerMin;

    // Вычитаем из доступной энергии
    charState.availableEnergy = Math.max(0, (charState.availableEnergy || 0) - totalBurn);

    // Ускоряем потерю воды
    const waterLoss = duration * 0.5; // мл в минуту при нагрузке
    charState.hydration = Math.max(0, (charState.hydration || 70) - (waterLoss / 25));

    const actName = activity.activity || 'activity';
    queueNotice(`🏃 ${actName} (${duration} мин, −${totalBurn} ккал)`, 'activity', 3000);

    console.log(`${LOG_PREFIX} Activity:`, actName, `${duration}min, -${totalBurn}kcal`);
}

function getSatietyBonus(item) {
    const map = { low: 2, medium: 5, high: 10, very_high: 15 };
    if (item.food?.satiety) return map[item.food.satiety] || 5;
    return 5;
}

// ═══════════════════════════════════════════════════════════════
// ОБРАБОТКА ВРЕМЕНИ
// ═══════════════════════════════════════════════════════════════

/**
 * Обработать прошедшее время для всех персонажей
 */
function processTimePassed(elapsedMinutes) {
    if (elapsedMinutes <= 0) return;

    const characters = getEnabledCharacters();
    const notifications = [];

    for (const char of characters) {
        const result = tick(char.nutrition, elapsedMinutes);

        // Уведомления
        for (const notif of result.notifications) {
            if (notif.type === 'critical') {
                queueNotice(`⚠️ ${char.name}: ${notif.text}`, 'critical', 8000);
            } else if (notif.type === 'warning') {
                queueNotice(`⚠ ${char.name}: ${notif.text}`, 'warning', 5000);
            } else if (notif.type === 'recovery') {
                queueNotice(`✓ ${char.name}: ${notif.text}`, 'success', 4000);
            }
        }

        notifications.push(...result.notifications);
    }

    return notifications;
}

// ═══════════════════════════════════════════════════════════════
// ПРОМПТ ИНЖЕКТ
// ═══════════════════════════════════════════════════════════════

function injectPrompt() {
    if (!isEnabled()) {
        setExtensionPrompt(PROMPT_KEY, '', extension_prompt_types.IN_CHAT, 0, true, extension_prompt_roles.SYSTEM);
        return;
    }

    const settings = getSettings();
    const characters = getEnabledCharacters();

    if (characters.length === 0) {
        setExtensionPrompt(PROMPT_KEY, '', extension_prompt_types.IN_CHAT, 0, true, extension_prompt_roles.SYSTEM);
        return;
    }

    let prompt;
    const pendingQueries = getPendingFoodQueries();

    if (characters.length === 1) {
        const char = characters[0];
        const useFullPrompt = settings.promptMode === 'full'
            || (settings.promptMode === 'auto' && shouldUseFullPrompt(char.nutrition));

        if (useFullPrompt) {
            prompt = buildNutritionPrompt(char.nutrition, {
                charName: char.name,
                enableAiEstimate: settings.aiEstimate,
                pendingFoodQueries: pendingQueries,
            });
        } else {
            prompt = buildCompactPrompt(char.nutrition, char.name);
        }
    } else {
        // Мультиперсонаж
        const charData = characters.map(c => ({
            charState: c.nutrition,
            charName: c.name,
        }));
        prompt = buildMultiCharPrompt(charData, {
            compact: settings.promptMode === 'compact',
            pendingFoodQueries: pendingQueries,
        });
    }

    console.log(`${LOG_PREFIX} Prompt injected (${estimateTokens(prompt)} tokens est.)`);

    setExtensionPrompt(
        PROMPT_KEY,
        prompt,
        extension_prompt_types.IN_CHAT,
        2,      // depth — вставляется близко к концу
        true,   // scan
        extension_prompt_roles.SYSTEM
    );
}

// ═══════════════════════════════════════════════════════════════
// ОБРАБОТЧИКИ СОБЫТИЙ SILLYTAVERN
// ═══════════════════════════════════════════════════════════════

/**
 * GENERATION_STARTED — перед отправкой запроса к ИИ.
 * Обновляем промпт.
 */
function onGenerationStarted(type, params, dryRun) {
    if (!isEnabled() || dryRun) return;
    injectPrompt();
}

/**
 * MESSAGE_SENT — игрок отправил сообщение.
 * Парсим еду из текста игрока.
 */
async function onMessageSent(messageId) {
    if (!isEnabled()) return;

    const state = getState();
    const msg = chat[messageId];
    if (!msg || !msg.is_user) return;

    silentMode = true;

    // Парсим сообщение игрока
    const parsed = parseMessage(msg.mes, false);

    // Обрабатываем найденную еду
    const activeChar = getActiveCharacter();
    if (activeChar && parsed.foodItems.length > 0) {
        for (const item of parsed.foodItems) {
            processFoodItem(activeChar.nutrition, item);

            // Если уверенность низкая — просим ИИ уточнить
            if (item.needsAiEstimate) {
                addPendingFoodQuery(item.raw);
            }
        }
    }

    // Обрабатываем активность
    if (activeChar && parsed.activity) {
        // Активность без длительности — ИИ укажет в теге
        // Пока просто отмечаем что персонаж активен
        activeChar.nutrition.activityLevel = mapActivityToLevel(parsed.activity.activity);
    }

    silentMode = false;

    // Обновляем промпт перед генерацией
    injectPrompt();
    saveState();
}

/**
 * MESSAGE_RECEIVED — пришёл ответ ИИ.
 * Парсим AI-тег, обновляем время, применяем данные.
 */
async function onMessageReceived(messageId) {
    if (!isEnabled()) return;

    const state = getState();
    const msg = chat[messageId];
    if (!msg || msg.is_user) return;

    // Защита от свайпов
    const msgIdNum = Number(messageId);
    if (isMessageProcessed(msgIdNum)) {
        console.log(`${LOG_PREFIX} Message ${msgIdNum} already processed (swipe/regen), skipping`);
        return;
    }

    silentMode = true;

    // ── 1) Парсим AI-ответ ──
    const parsed = parseMessage(msg.mes, true);

    // ── 2) Определяем прошедшее время ──
    let elapsedMinutes = 0;

    // Приоритет: Horae время > AI tp-тег
    if (parsed.horaeTime) {
        const prevTime = state.lastGameTime;
        if (prevTime != null) {
            const diff = parsed.horaeTime.totalMinutes - prevTime;
            if (diff > 0) elapsedMinutes = diff;
        }
        updateGameTime(parsed.horaeTime.totalMinutes);
    } else if (parsed.timePassed != null) {
        elapsedMinutes = parsed.timePassed * 60; // часы → минуты
        // Обновляем относительное время
        if (state.lastGameTime != null) {
            updateGameTime(state.lastGameTime + elapsedMinutes);
        } else {
            updateGameTime(elapsedMinutes);
        }
    }

    console.log(`${LOG_PREFIX} Time elapsed: ${elapsedMinutes} minutes (${(elapsedMinutes / 60).toFixed(1)} hours)`);

    // ── 3) Тик времени для всех персонажей ──
    if (elapsedMinutes > 0) {
        processTimePassed(elapsedMinutes);
    }

    // ── 4) Обрабатываем AI-оценки еды ──
    const activeChar = getActiveCharacter();
    if (activeChar && parsed.aiEstimates.length > 0) {
        for (const estimate of parsed.aiEstimates) {
            processAiEstimate(activeChar.nutrition, estimate);
        }
        // AI ответил — очищаем очередь
        clearPendingFoodQueries();
    }

    // ── 5) Парсим еду из нарратива ИИ (если персонаж ел в сцене) ──
    if (activeChar && parsed.foodItems.length > 0) {
        // Если AI уже дал точные данные через тег — не дублируем
        const aiCoveredFoods = new Set(parsed.aiEstimates.map(e => e.food?.toLowerCase()).filter(Boolean));

        for (const item of parsed.foodItems) {
            const itemName = (item.raw || '').toLowerCase();
            // Пропускаем если AI уже дал оценку для этого продукта
            if (aiCoveredFoods.has(itemName)) continue;
            // Пропускаем с низкой уверенностью — ждём AI-тег
            if (item.confidence < 0.5) {
                addPendingFoodQuery(item.raw);
                continue;
            }
            processFoodItem(activeChar.nutrition, item);
        }
    }

    // ── 6) Активность из AI-тега ──
    if (activeChar) {
        const activityEstimates = parsed.aiEstimates.filter(e => e.type === 'activity');
        for (const act of activityEstimates) {
            processActivity(activeChar.nutrition, {
                activity: act.activity,
                duration: act.duration || 30,
                kcalPerMin: getActivityKcalPerMin(act.activity),
            });
        }
    }

    // ── 7) Помечаем сообщение обработанным ──
    markMessageProcessed(msgIdNum);

    silentMode = false;
    flushNotices();

    // ── 8) Сохраняем и обновляем UI ──
    saveState();
    renderDashboard();
    if (getSettings().showDebug) renderDebug();
}

/**
 * GENERATION_STOPPED — генерацию оборвали.
 */
function onGenerationStopped() {
    if (!isEnabled()) return;
    silentMode = false;
    flushNotices();
}

/**
 * CHAT_CHANGED — переключились на другой чат.
 */
function onChatChanged() {
    silentMode = false;
    pendingNotices = [];
    stateChatChanged();
    syncPlayerName();
    injectPrompt();
    renderDashboard();
}

// ═══════════════════════════════════════════════════════════════
// УТИЛИТЫ
// ═══════════════════════════════════════════════════════════════

function mapActivityToLevel(activity) {
    const map = {
        resting: 'sedentary',
        walking: 'light',
        dancing: 'moderate',
        swimming: 'active',
        running: 'active',
        fighting: 'extreme',
        climbing: 'active',
        heavy_labor: 'extreme',
        sex: 'moderate',
    };
    return map[activity] || 'light';
}

function getActivityKcalPerMin(activity) {
    const map = {
        running: 10,
        walking: 4,
        fighting: 12,
        swimming: 8,
        dancing: 6,
        climbing: 9,
        heavy_labor: 8,
        sex: 5,
        resting: 1,
    };
    return map[activity] || 5;
}

// ═══════════════════════════════════════════════════════════════
// ПУБЛИЧНЫЙ API (для UI и внешних модулей)
// ═══════════════════════════════════════════════════════════════

export const NutritionAPI = {
    // State
    getState,
    isEnabled,
    setEnabled,
    getSettings,
    updateSettings,
    resetState,

    // Characters
    getPlayerCharacter,
    getActiveCharacter,
    getEnabledCharacters,
    createCharacter,
    removeCharacter,
    updateCharacterProfile,
    setActiveCharacter,

    // Engine
    getSummary: (charId) => {
        const state = getState();
        const char = state.characters[charId] || getActiveCharacter();
        return char ? getSummary(char.nutrition) : null;
    },

    // Manual actions
    manualAddFood: (foodEntry) => {
        const char = getActiveCharacter();
        if (!char) return;
        processFoodItem(char.nutrition, foodEntry);
        saveState();
        renderDashboard();
        injectPrompt();
    },

    manualAddWater: (ml) => {
        const char = getActiveCharacter();
        if (!char) return;
        addHydration(char.nutrition, ml);
        queueNotice(`💧 +${ml} мл воды`, 'info', 2500);
        saveState();
        renderDashboard();
        injectPrompt();
    },

    manualSetSatiety: (value) => {
        const char = getActiveCharacter();
        if (!char) return;
        char.nutrition.satiety = Math.max(0, Math.min(100, value));
        saveState();
        renderDashboard();
        injectPrompt();
    },

    // Debug
    getDebugDump,
    getLastPrompt: () => {
        const chars = getEnabledCharacters();
        if (chars.length === 0) return '(no characters)';
        if (chars.length === 1) {
            return buildNutritionPrompt(chars[0].nutrition, {
                charName: chars[0].name,
                pendingFoodQueries: getPendingFoodQueries(),
            });
        }
        return buildMultiCharPrompt(
            chars.map(c => ({ charState: c.nutrition, charName: c.name })),
            { pendingFoodQueries: getPendingFoodQueries() }
        );
    },

    // UI triggers
    togglePanel,
    renderDashboard,
    showNotify,
};

// Делаем API доступным глобально (для консоли и других расширений)
window.NutritionFramework = NutritionAPI;

// ═══════════════════════════════════════════════════════════════
// ИНИЦИАЛИЗАЦИЯ
// ═══════════════════════════════════════════════════════════════

function init() {
    console.log(`${LOG_PREFIX} Initializing...`);

    // Загружаем состояние
    loadState();
    syncPlayerName();

    // Строим UI
    buildUI();

    // Инжектим промпт
    injectPrompt();

    // Рендерим дашборд
    renderDashboard();

    // Подписываемся на события ST
    eventSource.on(event_types.GENERATION_STARTED, onGenerationStarted);
    eventSource.on(event_types.GENERATION_STOPPED, onGenerationStopped);
    eventSource.on(event_types.MESSAGE_SENT, onMessageSent);
    eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
    eventSource.on(event_types.CHAT_CHANGED, onChatChanged);

    console.log(`${LOG_PREFIX} Ready. Tracking ${getEnabledCharacters().length} character(s).`);
}

// SillyTavern запускает расширение при загрузке модуля
jQuery(() => init());

export { init };
