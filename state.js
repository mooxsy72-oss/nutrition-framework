// nutrition-framework/state.js

import { initNutritionState } from './engine.js';
import { DEFAULT_PROFILES } from './constants.js';

import {
    chat_metadata,
    saveChatDebounced,
    name1,
} from '../../../../script.js';

// ═══════════════════════════════════════════════════════════════
// КОНСТАНТЫ
// ═══════════════════════════════════════════════════════════════

const META_KEY = 'nutritionFramework';
const STATE_VERSION = 1;

// ═══════════════════════════════════════════════════════════════
// СТРУКТУРА ГЛОБАЛЬНОГО СОСТОЯНИЯ
// ═══════════════════════════════════════════════════════════════

/**
 * Глобальное состояние расширения (хранится в chat_metadata).
 * Содержит данные ВСЕХ отслеживаемых персонажей текущего чата.
 *
 * Структура:
 * {
 *   version: number,
 *   settings: { ... },
 *   characters: {
 *     [charId]: {
 *       name: string,
 *       profile: { sex, age, heightCm, weightKg, ... },
 *       nutrition: { ... состояние из engine.js ... },
 *       enabled: boolean,
 *       createdAt: number,
 *     }
 *   },
 *   activeCharId: string,       — кто сейчас «главный» (чьё состояние в промпте)
 *   lastProcessedMsgId: number, — защита от свайпов
 *   lastGameTime: number|null,  — последнее известное игровое время (минуты)
 *   pendingFoodQueries: [],     — продукты, которые парсер не определил
 * }
 */

function defaultGlobalState() {
    return {
        version: STATE_VERSION,
        settings: defaultSettings(),
        characters: {},
        activeCharId: null,
        lastProcessedMsgId: null,
        lastGameTime: null,
        pendingFoodQueries: [],
    };
}

function defaultSettings() {
    return {
        enabled: true,
        promptMode: 'auto',       // 'full' | 'compact' | 'auto'
        trackPlayer: true,        // отслеживать персонажа игрока
        trackNPCs: false,         // отслеживать NPC (будущее)
        showNotifications: true,
        showDebug: false,
        sidebarEnabled: true,
        sidebarSide: 'right',     // 'left' | 'right'
        theme: 'dark',            // 'dark' | 'light' | 'adaptive'
        language: 'ru',           // 'ru' | 'en'
        autoDetectFood: true,     // парсить еду из текста автоматически
        aiEstimate: true,         // просить ИИ оценивать неизвестную еду
        weightTracking: true,     // отслеживать изменение веса
        criticalOverride: true,   // разрешить «стоп ролплей» при severity 4
    };
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON — ТЕКУЩЕЕ СОСТОЯНИЕ
// ═══════════════════════════════════════════════════════════════

let _state = null;
let _saveTimeout = null;

/**
 * Получить текущее глобальное состояние (загружает если нужно)
 */
export function getState() {
    if (!_state) loadState();
    return _state;
}

/**
 * Загрузить состояние из chat_metadata
 */
export function loadState() {
    const raw = chat_metadata[META_KEY];

    if (!raw) {
        _state = defaultGlobalState();
        // Автоматически создаём персонажа игрока
        createPlayerCharacter();
    } else {
        _state = raw;
        migrateState();
        ensureDefaults();
    }

    return _state;
}

/**
 * Сохранить состояние в chat_metadata (с дебаунсом)
 */
export function saveState() {
    if (!_state) return;
    chat_metadata[META_KEY] = _state;
    saveChatDebounced();
}

/**
 * Немедленное сохранение (без дебаунса) — для критических моментов
 */
export function saveStateImmediate() {
    if (!_state) return;
    chat_metadata[META_KEY] = _state;
    saveChatDebounced();
}

/**
 * Полный сброс состояния текущего чата
 */
export function resetState() {
    _state = defaultGlobalState();
    createPlayerCharacter();
    saveState();
    return _state;
}

// ═══════════════════════════════════════════════════════════════
// МИГРАЦИИ
// ═══════════════════════════════════════════════════════════════

function migrateState() {
    if (!_state.version || _state.version < STATE_VERSION) {
        // Будущие миграции будут здесь
        // if (_state.version < 2) { migrateV1toV2(); }
        _state.version = STATE_VERSION;
    }
}

function ensureDefaults() {
    const def = defaultGlobalState();

    // Settings
    if (!_state.settings) _state.settings = defaultSettings();
    for (const key of Object.keys(def.settings)) {
        if (_state.settings[key] === undefined) {
            _state.settings[key] = def.settings[key];
        }
    }

    // Characters
    if (!_state.characters) _state.characters = {};

    // Поля верхнего уровня
    if (_state.lastProcessedMsgId === undefined) _state.lastProcessedMsgId = null;
    if (_state.lastGameTime === undefined) _state.lastGameTime = null;
    if (!Array.isArray(_state.pendingFoodQueries)) _state.pendingFoodQueries = [];

    // Убедиться что есть персонаж игрока
    if (_state.settings.trackPlayer && !getPlayerCharacter()) {
        createPlayerCharacter();
    }
}

// ═══════════════════════════════════════════════════════════════
// УПРАВЛЕНИЕ ПЕРСОНАЖАМИ
// ═══════════════════════════════════════════════════════════════

/**
 * Создать персонажа игрока (автоматически при первой загрузке)
 */
function createPlayerCharacter() {
    const playerName = name1 || 'Player';
    const id = `player_${sanitizeId(playerName)}`;

    if (_state.characters[id]) return _state.characters[id];

    _state.characters[id] = {
        name: playerName,
        id: id,
        isPlayer: true,
        profile: { ...DEFAULT_PROFILES.female_average },
        nutrition: initNutritionState(DEFAULT_PROFILES.female_average),
        enabled: true,
        createdAt: Date.now(),
    };

    _state.activeCharId = id;
    return _state.characters[id];
}

/**
 * Создать нового отслеживаемого персонажа
 * @param {string} name
 * @param {object} profile — { sex, age, heightCm, weightKg, ... }
 * @returns {object} — созданный персонаж
 */
export function createCharacter(name, profile = {}) {
    const id = `char_${sanitizeId(name)}_${Date.now().toString(36)}`;

    // Выбираем базовый профиль
    let baseProfile;
    if (profile.sex === 'male') {
        baseProfile = { ...DEFAULT_PROFILES.male_average, ...profile };
    } else {
        baseProfile = { ...DEFAULT_PROFILES.female_average, ...profile };
    }

    _state.characters[id] = {
        name,
        id,
        isPlayer: false,
        profile: baseProfile,
        nutrition: initNutritionState(baseProfile),
        enabled: true,
        createdAt: Date.now(),
    };

    saveState();
    return _state.characters[id];
}

/**
 * Удалить персонажа
 */
export function removeCharacter(charId) {
    if (!_state.characters[charId]) return false;
    if (_state.characters[charId].isPlayer) return false; // нельзя удалить игрока

    delete _state.characters[charId];

    // Если удалили активного — переключаемся на игрока
    if (_state.activeCharId === charId) {
        const player = getPlayerCharacter();
        _state.activeCharId = player?.id || null;
    }

    saveState();
    return true;
}

/**
 * Получить персонажа по ID
 */
export function getCharacter(charId) {
    return _state?.characters[charId] || null;
}

/**
 * Получить персонажа игрока
 */
export function getPlayerCharacter() {
    if (!_state) return null;
    return Object.values(_state.characters).find(c => c.isPlayer) || null;
}

/**
 * Получить активного персонажа (чьё состояние в промпте)
 */
export function getActiveCharacter() {
    if (!_state || !_state.activeCharId) return getPlayerCharacter();
    return _state.characters[_state.activeCharId] || getPlayerCharacter();
}

/**
 * Получить всех включённых персонажей
 */
export function getEnabledCharacters() {
    if (!_state) return [];
    return Object.values(_state.characters).filter(c => c.enabled);
}

/**
 * Переключить активного персонажа
 */
export function setActiveCharacter(charId) {
    if (_state.characters[charId]) {
        _state.activeCharId = charId;
        saveState();
    }
}

/**
 * Обновить профиль персонажа
 */
export function updateCharacterProfile(charId, profileUpdates) {
    const char = _state.characters[charId];
    if (!char) return false;

    Object.assign(char.profile, profileUpdates);

    // Синхронизируем с nutrition state
    if (profileUpdates.sex !== undefined) char.nutrition.sex = profileUpdates.sex;
    if (profileUpdates.age !== undefined) char.nutrition.age = profileUpdates.age;
    if (profileUpdates.heightCm !== undefined) char.nutrition.heightCm = profileUpdates.heightCm;
    if (profileUpdates.weightKg !== undefined) char.nutrition.weightKg = profileUpdates.weightKg;
    if (profileUpdates.activityLevel !== undefined) char.nutrition.activityLevel = profileUpdates.activityLevel;

    saveState();
    return true;
}

/**
 * Обновить имя персонажа игрока (если сменилось в ST)
 */
export function syncPlayerName() {
    const player = getPlayerCharacter();
    if (player && name1 && player.name !== name1) {
        player.name = name1;
        saveState();
    }
}

// ═══════════════════════════════════════════════════════════════
// НАСТРОЙКИ
// ═══════════════════════════════════════════════════════════════

/**
 * Получить настройки
 */
export function getSettings() {
    return getState().settings;
}

/**
 * Обновить настройки
 */
export function updateSettings(updates) {
    Object.assign(_state.settings, updates);
    saveState();
}

/**
 * Включено ли расширение
 */
export function isEnabled() {
    return getState().settings.enabled;
}

/**
 * Включить/выключить
 */
export function setEnabled(val) {
    _state.settings.enabled = !!val;
    saveState();
}

// ═══════════════════════════════════════════════════════════════
// ВРЕМЯ
// ═══════════════════════════════════════════════════════════════

/**
 * Обновить последнее известное игровое время
 */
export function updateGameTime(totalMinutes) {
    if (totalMinutes == null) return;
    if (_state.lastGameTime == null || totalMinutes > _state.lastGameTime) {
        _state.lastGameTime = totalMinutes;
    }
}

/**
 * Получить прошедшее время с последнего обновления (в минутах)
 */
export function getElapsedMinutes(currentTotalMinutes) {
    if (_state.lastGameTime == null || currentTotalMinutes == null) return 0;
    const diff = currentTotalMinutes - _state.lastGameTime;
    return Math.max(0, diff);
}

/**
 * Защита от свайпов — проверить, обработано ли это сообщение
 */
export function isMessageProcessed(msgId) {
    return _state.lastProcessedMsgId === Number(msgId);
}

/**
 * Пометить сообщение как обработанное
 */
export function markMessageProcessed(msgId) {
    _state.lastProcessedMsgId = Number(msgId);
}

// ═══════════════════════════════════════════════════════════════
// PENDING FOOD QUERIES (для AI-оценки)
// ═══════════════════════════════════════════════════════════════

/**
 * Добавить неопознанный продукт в очередь для AI
 */
export function addPendingFoodQuery(foodName) {
    if (!_state.pendingFoodQueries.includes(foodName)) {
        _state.pendingFoodQueries.push(foodName);
        // Ограничиваем очередь
        if (_state.pendingFoodQueries.length > 5) {
            _state.pendingFoodQueries = _state.pendingFoodQueries.slice(-5);
        }
    }
}

/**
 * Очистить очередь (после того как ИИ ответил)
 */
export function clearPendingFoodQueries() {
    _state.pendingFoodQueries = [];
}

/**
 * Получить текущую очередь
 */
export function getPendingFoodQueries() {
    return _state.pendingFoodQueries || [];
}

// ═══════════════════════════════════════════════════════════════
// ЭКСПОРТ ОТЛАДКИ
// ═══════════════════════════════════════════════════════════════

/**
 * Получить полный дамп состояния (для debug-панели)
 */
export function getDebugDump() {
    return {
        state: _state,
        meta_key: META_KEY,
        version: STATE_VERSION,
        characters: Object.keys(_state?.characters || {}),
        activeChar: _state?.activeCharId,
        lastGameTime: _state?.lastGameTime,
        lastMsgId: _state?.lastProcessedMsgId,
    };
}

/**
 * Импортировать состояние (для восстановления из бэкапа)
 */
export function importState(newState) {
    if (!newState || typeof newState !== 'object') return false;
    _state = newState;
    migrateState();
    ensureDefaults();
    saveState();
    return true;
}

/**
 * Экспортировать состояние (для бэкапа)
 */
export function exportState() {
    return JSON.parse(JSON.stringify(_state));
}

// ═══════════════════════════════════════════════════════════════
// УТИЛИТЫ
// ═══════════════════════════════════════════════════════════════

function sanitizeId(name) {
    return name
        .toLowerCase()
        .replace(/[^a-zа-я0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 20);
}

/**
 * Вызывается при смене чата — полная перезагрузка
 */
export function onChatChanged() {
    _state = null;
    loadState();
}
