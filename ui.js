// nutrition-framework/ui.js

import {
    getState, getSettings, updateSettings, isEnabled, setEnabled,
    getPlayerCharacter, getActiveCharacter, getEnabledCharacters,
    createCharacter, removeCharacter, updateCharacterProfile,
    setActiveCharacter, resetState, getDebugDump, exportState, importState,
} from './state.js';

import { getSummary, isCriticalState, initNutritionState } from './engine.js';
import { FOOD_DATABASE, FOOD_CATEGORIES, findFood } from './food-database.js';
import {
    HUNGER_THRESHOLDS, HYDRATION_THRESHOLDS,
    DEFAULT_PROFILES, ACTIVITY_MULTIPLIERS,
} from './constants.js';

// ═══════════════════════════════════════════════════════════════
// КОНСТАНТЫ UI
// ═══════════════════════════════════════════════════════════════

let panelOpen = false;
let activeTab = 'dashboard';

// ═══════════════════════════════════════════════════════════════
// УВЕДОМЛЕНИЯ
// ═══════════════════════════════════════════════════════════════

const NOTIFY_ICONS = {
    info: '✦',
    success: '✓',
    warning: '⚠',
    critical: '☠',
    food: '🍽',
    activity: '🏃',
};

export function showNotify(text, type = 'info', duration = 4000) {
    let container = document.getElementById('nut-notify-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'nut-notify-container';
        document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.className = `nut-notify nut-notify-${type}`;
    el.innerHTML = `
        <span class="nut-notify-ico">${NOTIFY_ICONS[type] || '✦'}</span>
        <span class="nut-notify-text">${text}</span>`;
    container.appendChild(el);

    requestAnimationFrame(() => el.classList.add('nut-notify-show'));

    const timer = setTimeout(() => {
        el.classList.remove('nut-notify-show');
        el.classList.add('nut-notify-hide');
        setTimeout(() => el.remove(), 400);
    }, duration);

    el.addEventListener('click', () => {
        clearTimeout(timer);
        el.classList.remove('nut-notify-show');
        el.classList.add('nut-notify-hide');
        setTimeout(() => el.remove(), 400);
    });
}

// ═══════════════════════════════════════════════════════════════
// ТЕМЫ
// ═══════════════════════════════════════════════════════════════

const THEMES = [
    { id: 'dark-blue', label: '🌊 Синяя' },
    { id: 'dark', label: '🌑 Тёмная' },
    { id: 'light', label: '☀ Светлая' },
    { id: 'adaptive', label: '🎨 Адаптивная' },
];

const LS_THEME_KEY = 'nutritionFramework_theme';
const LS_FLOAT_KEY = 'nutritionFramework_floatBtn';
const LS_FLOAT_POS_KEY = 'nutritionFramework_floatPos';
const LS_PANEL_POS_KEY = 'nutritionFramework_panelPos';

function getTheme() {
    return localStorage.getItem(LS_THEME_KEY) || 'dark-blue';
}

function setTheme(theme) {
    localStorage.setItem(LS_THEME_KEY, theme);
    const root = document.getElementById('nut-root');
    if (root) root.dataset.theme = theme;
}

function isFloatBtnVisible() {
    return localStorage.getItem(LS_FLOAT_KEY) !== 'false';
}

function setFloatBtnVisible(visible) {
    localStorage.setItem(LS_FLOAT_KEY, visible ? 'true' : 'false');
    const btn = document.getElementById('nut-float-btn');
    if (btn) btn.classList.toggle('nut-hidden', !visible);
}

// ═══════════════════════════════════════════════════════════════
// ПЕРЕТАСКИВАНИЕ ПАНЕЛИ
// ═══════════════════════════════════════════════════════════════

function makeDraggable(el, handle, { onDragStart, onDragEnd } = {}) {
    let startX = 0, startY = 0, origX = 0, origY = 0;
    let dragging = false;
    let moved = false;
    let pointerId = null;

    handle.style.touchAction = 'none';

    function onDown(e) {
        if (e.target.closest('button, select, input, a, .nut-close-btn, .nut-power-btn, .nut-theme-select')) {
            return;
        }

        dragging = true;
        moved = false;
        pointerId = e.pointerId;

        const rect = el.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;
        startX = e.clientX;
        startY = e.clientY;

        try { handle.setPointerCapture(e.pointerId); } catch {}
        if (onDragStart) onDragStart();
    }

    function onMove(e) {
        if (!dragging || e.pointerId !== pointerId) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!moved && Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        moved = true;

        let nx = origX + dx;
        let ny = origY + dy;

        const maxX = window.innerWidth - el.offsetWidth;
        const maxY = window.innerHeight - el.offsetHeight;
        nx = Math.max(0, Math.min(maxX, nx));
        ny = Math.max(0, Math.min(maxY, ny));

        el.style.position = 'fixed';
        el.style.left = nx + 'px';
        el.style.top = ny + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.transform = 'none';
        el.style.transition = 'none';
    }

    function onUp(e) {
        if (!dragging || e.pointerId !== pointerId) return;
        dragging = false;

        try { handle.releasePointerCapture(e.pointerId); } catch {}
        el.style.transition = '';

        if (moved && onDragEnd) onDragEnd();
    }

    handle.addEventListener('pointerdown', onDown, { passive: false });
    handle.addEventListener('pointermove', onMove, { passive: true });
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
}

// ═══════════════════════════════════════════════════════════════
// СОХРАНЕНИЕ ПОЗИЦИИ ПАНЕЛИ
// ═══════════════════════════════════════════════════════════════

function savePanelPos(el) {
    if (window.innerWidth <= 560) return;
    const rect = el.getBoundingClientRect();
    localStorage.setItem(LS_PANEL_POS_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
}

function restorePanelPos(el) {
    if (window.innerWidth <= 560) return;
    const saved = localStorage.getItem(LS_PANEL_POS_KEY);
    if (!saved) return;
    try {
        const { left, top } = JSON.parse(saved);
        const panelWidth = el.offsetWidth || 520;
        const panelHeight = el.offsetHeight || 400;
        const nx = Math.max(0, Math.min(window.innerWidth - panelWidth, left));
        const ny = Math.max(0, Math.min(window.innerHeight - panelHeight, top));
        el.style.position = 'fixed';
        el.style.left = nx + 'px';
        el.style.top = ny + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.transform = 'none';
        el.style.animation = 'none';
        el.classList.add('nut-dragged');
    } catch {}
}

function saveFloatPos(el) {
    if (window.innerWidth < 768) return;
    const rect = el.getBoundingClientRect();
    localStorage.setItem(LS_FLOAT_POS_KEY, JSON.stringify({ left: rect.left, top: rect.top }));
}

function restoreFloatPos(el) {
    if (window.innerWidth < 768) return;
    const saved = localStorage.getItem(LS_FLOAT_POS_KEY);
    if (!saved) return;
    try {
        const { left, top } = JSON.parse(saved);
        const btnSize = el.offsetWidth || 44;
        const maxX = window.innerWidth - btnSize;
        const maxY = window.innerHeight - btnSize;
        if (left < 0 || top < 0 || left > maxX || top > maxY) {
            localStorage.removeItem(LS_FLOAT_POS_KEY);
            return;
        }
        el.style.position = 'fixed';
        el.style.left = left + 'px';
        el.style.top = top + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
    } catch {
        localStorage.removeItem(LS_FLOAT_POS_KEY);
    }
}

// ═══════════════════════════════════════════════════════════════
// ПОСТРОЕНИЕ UI
// ═══════════════════════════════════════════════════════════════

export function buildUI() {
    // Защита от двойного вызова
    if (document.getElementById('nut-root')) return;

    const currentTheme = getTheme();
    const themeOptions = THEMES.map(t =>
        `<option value="${t.id}" ${t.id === currentTheme ? 'selected' : ''}>${t.label}</option>`
    ).join('');

    // ── Главная панель ──
    const root = document.createElement('div');
    root.id = 'nut-root';
    root.dataset.theme = currentTheme;
    root.innerHTML = `
        <div id="nut-panel" class="nut-hidden">
            <div class="nut-panel-header" id="nut-panel-header">
                <div class="nut-panel-title">
                    <span class="nut-panel-icon">🍎</span>
                    Калории и питание
                </div>
                <div class="nut-panel-controls">
                    <select class="nut-theme-select" id="nut-theme-select" title="Тема">
                        ${themeOptions}
                    </select>
                    <button class="nut-power-btn" id="nut-power" title="Включить/выключить">
                        <span class="nut-power-dot" id="nut-power-dot"></span>
                    </button>
                    <button class="nut-close-btn" id="nut-close">✕</button>
                </div>
            </div>

            <div class="nut-tabs">
                <button class="nut-tab nut-tab-active" data-tab="dashboard">📊 Состояние</button>
                <button class="nut-tab" data-tab="characters">👤 Персонажи</button>
                <button class="nut-tab" data-tab="food">🍲 Еда</button>
                <button class="nut-tab" data-tab="settings">⚙ Настройки</button>
                <button class="nut-tab" data-tab="debug">🔧 Debug</button>
            </div>

            <div class="nut-content" id="nut-content"></div>
        </div>
    `;
    document.body.appendChild(root);

    // ══════════════════════════════════════════════════════════
    // ПЛАВАЮЩАЯ КНОПКА
    // ══════════════════════════════════════════════════════════

    // Удаляем старую если осталась (hot reload)
    document.getElementById('nut-float-btn')?.remove();

    // Создаём кнопку
    const floatBtn = document.createElement('div');
    floatBtn.id = 'nut-float-btn';
    floatBtn.title = 'Nutrition Framework';
    floatBtn.innerHTML = `<svg class="nut-float-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5" fill="currentColor" stroke="none"/></svg>`;

    // Скрываем если пользователь отключил
    if (!isFloatBtnVisible()) {
        floatBtn.classList.add('nut-hidden');
    }

    // Вставляем в body
    document.body.appendChild(floatBtn);

    // На мобильном — сбрасываем сохранённую позицию и НЕ даём перетаскивать
    if (window.innerWidth < 768) {
        localStorage.removeItem(LS_FLOAT_POS_KEY);
        // Убираем любые inline стили позиции — пусть работает только CSS
        floatBtn.style.position = '';
        floatBtn.style.top = '';
        floatBtn.style.left = '';
        floatBtn.style.right = '';
        floatBtn.style.bottom = '';
        floatBtn.style.inset = '';
    }

    // Клик по кнопке — открыть/закрыть панель
    floatBtn.addEventListener('click', function (e) {
        // Если кнопку только что перетащили — не открываем панель
        if (this.dataset.wasDragged === 'true') {
            this.dataset.wasDragged = 'false';
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        togglePanel();
    });

    // Перетаскивание — ТОЛЬКО на десктопе (ширина >= 768)
    if (window.innerWidth >= 768) {
        let isDragging = false;
        let hasMoved = false;
        let startX = 0, startY = 0, origX = 0, origY = 0;

        floatBtn.addEventListener('pointerdown', function (e) {
            isDragging = true;
            hasMoved = false;
            this.dataset.wasDragged = 'false';
            const rect = this.getBoundingClientRect();
            origX = rect.left;
            origY = rect.top;
            startX = e.clientX;
            startY = e.clientY;
            try { this.setPointerCapture(e.pointerId); } catch {}
            e.preventDefault();
        });

        floatBtn.addEventListener('pointermove', function (e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (!hasMoved && Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            hasMoved = true;
            this.dataset.wasDragged = 'true';

            let nx = origX + dx;
            let ny = origY + dy;
            const maxX = window.innerWidth - this.offsetWidth;
            const maxY = window.innerHeight - this.offsetHeight;
            nx = Math.max(0, Math.min(maxX, nx));
            ny = Math.max(0, Math.min(maxY, ny));

            this.style.position = 'fixed';
            this.style.top = ny + 'px';
            this.style.left = nx + 'px';
            this.style.right = 'auto';
            this.style.bottom = 'auto';
        });

        floatBtn.addEventListener('pointerup', function (e) {
            if (!isDragging) return;
            isDragging = false;
            try { this.releasePointerCapture(e.pointerId); } catch {}
            if (hasMoved) {
                saveFloatPos(this);
            }
        });

        floatBtn.addEventListener('pointercancel', function () {
            isDragging = false;
        });

        // Восстанавливаем сохранённую позицию (только десктоп)
        restoreFloatPos(floatBtn);
    }

    // ══════════════════════════════════════════════════════════
    // ОБРАБОТЧИКИ ПАНЕЛИ
    // ══════════════════════════════════════════════════════════

    document.getElementById('nut-close').addEventListener('click', () => togglePanel(false));

    document.getElementById('nut-power').addEventListener('click', () => {
        setEnabled(!isEnabled());
        updatePowerIndicator();
        showNotify(isEnabled() ? 'Расширение включено' : 'Расширение выключено', 'info');
    });

    document.getElementById('nut-theme-select').addEventListener('change', (e) => {
        setTheme(e.target.value);
    });

    document.querySelectorAll('.nut-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            activeTab = btn.dataset.tab;
            document.querySelectorAll('.nut-tab').forEach(b => b.classList.remove('nut-tab-active'));
            btn.classList.add('nut-tab-active');
            renderContent();
        });
    });

    // Перетаскивание панели за хедер
    const panel = document.getElementById('nut-panel');
    const header = document.getElementById('nut-panel-header');
    makeDraggable(panel, header, {
        onDragStart: () => { panel.classList.add('nut-dragged'); },
        onDragEnd: () => savePanelPos(panel),
    });

    updatePowerIndicator();

     // ЯДЕРНЫЙ ТЕСТ — создаём кнопку заново через 3 секунды с нуля
    setTimeout(() => {
        // Удаляем всё старое
        document.getElementById('nut-float-btn')?.remove();
        document.getElementById('nut-test-btn')?.remove();

        // Создаём максимально простой div
        const test = document.createElement('div');
        test.id = 'nut-test-btn';
        test.textContent = '🍎';
        test.setAttribute('style', 'position:fixed; bottom:120px; right:15px; top:auto; left:auto; inset:auto; z-index:2147483647; width:50px; height:50px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:red; color:white; font-size:24px; cursor:pointer; box-shadow:0 4px 20px rgba(0,0,0,0.8); pointer-events:auto; opacity:1; visibility:visible;');

        document.body.appendChild(test);

        test.addEventListener('click', () => {
            alert('КНОПКА РАБОТАЕТ');
        });

        // Диагностика через 500мс
        setTimeout(() => {
            const cs = window.getComputedStyle(test);
            const rect = test.getBoundingClientRect();
            console.log('TEST BTN:', {
                rect: { top: rect.top, left: rect.left, w: rect.width, h: rect.height },
                bottom: cs.bottom,
                right: cs.right,
                top: cs.top,
                left: cs.left,
                position: cs.position,
                display: cs.display,
                inlineStyle: test.getAttribute('style')?.substring(0, 100),
            });
        }, 500);
    }, 3000);
}

// ═══════════════════════════════════════════════════════════════
// ПАНЕЛЬ — ОТКРЫТЬ / ЗАКРЫТЬ
// ═══════════════════════════════════════════════════════════════

export function togglePanel(forceState) {
    panelOpen = forceState !== undefined ? forceState : !panelOpen;
    const panel = document.getElementById('nut-panel');
    if (!panel) return;

    if (panelOpen) {
        restorePanelPos(panel);
        if (panel.classList.contains('nut-dragged')) {
            panel.style.animation = 'none';
        }
        panel.classList.remove('nut-hidden');
        renderContent();
    } else {
        if (panel.classList.contains('nut-dragged')) {
            savePanelPos(panel);
        }
        panel.classList.add('nut-hidden');
    }
}

function updatePowerIndicator() {
    const dot = document.getElementById('nut-power-dot');
    if (dot) dot.classList.toggle('nut-power-off', !isEnabled());
}

// ═══════════════════════════════════════════════════════════════
// РЕНДЕР КОНТЕНТА (по вкладкам)
// ═══════════════════════════════════════════════════════════════

function renderContent() {
    const container = document.getElementById('nut-content');
    if (!container) return;

    switch (activeTab) {
        case 'dashboard': renderDashboardTab(container); break;
        case 'characters': renderCharactersTab(container); break;
        case 'food': renderFoodTab(container); break;
        case 'settings': renderSettingsTab(container); break;
        case 'debug': renderDebugTab(container); break;
    }
}

// ═══════════════════════════════════════════════════════════════
// ВКЛАДКА: ДАШБОРД
// ═══════════════════════════════════════════════════════════════

export function renderDashboard() {
    if (!panelOpen || activeTab !== 'dashboard') return;
    const container = document.getElementById('nut-content');
    if (container) renderDashboardTab(container);
}

function renderDashboardTab(container) {
    const char = getActiveCharacter();
    if (!char) {
        container.innerHTML = `<div class="nut-empty">Нет активного персонажа. Создайте во вкладке «Персонажи».</div>`;
        return;
    }

    const summary = getSummary(char.nutrition);
    const critical = summary.critical;

    container.innerHTML = `
        <div class="nut-dashboard ${critical ? 'nut-critical-state' : ''}">
            <div class="nut-dash-header">
                <h3 class="nut-char-name">${char.name}</h3>
                <span class="nut-char-meta">${char.profile.sex === 'male' ? '♂' : '♀'} ${char.profile.age} лет, ${summary.weightKg} кг</span>
            </div>

            ${critical ? '<div class="nut-critical-banner">⚠ КРИТИЧЕСКОЕ СОСТОЯНИЕ — персонаж при смерти!</div>' : ''}

            <div class="nut-gauges">
                ${renderGauge('Голод', summary.satiety, 100, summary.hunger.labelRu, getHungerColor(summary.hunger))}
                ${renderGauge('Гидратация', summary.hydrationPct, 100, summary.hydration.labelRu, getHydrationColor(summary.hydration))}
                ${renderGauge('Желудок', summary.stomachPct, 100, `${summary.stomachPct}% заполнен`, '#8a7fb3')}
            </div>

            <div class="nut-stats-grid">
                <div class="nut-stat">
                    <span class="nut-stat-label">Вес</span>
                    <span class="nut-stat-value">${summary.weightKg} кг</span>
                    <span class="nut-stat-sub">${summary.weightCategory.labelRu} (BMI ${summary.bmi})</span>
                </div>
                <div class="nut-stat">
                    <span class="nut-stat-label">BMR</span>
                    <span class="nut-stat-value">${summary.bmr} ккал/день</span>
                    <span class="nut-stat-sub">базовый обмен</span>
                </div>
                <div class="nut-stat">
                    <span class="nut-stat-label">TDEE</span>
                    <span class="nut-stat-value">${summary.tdee} ккал/день</span>
                    <span class="nut-stat-sub">общий расход</span>
                </div>
                <div class="nut-stat">
                    <span class="nut-stat-label">Энергия</span>
                    <span class="nut-stat-value">${summary.availableEnergy} ккал</span>
                    <span class="nut-stat-sub">доступно сейчас</span>
                </div>
            </div>

            ${summary.effects.length > 0 ? `
                <div class="nut-effects">
                    <h4>Активные эффекты</h4>
                    ${summary.effects.map(e => `
                        <div class="nut-effect nut-effect-${e.type}">
                            <span class="nut-effect-icon">${e.type === 'critical' ? '☠' : '⚠'}</span>
                            <div>
                                <b>${e.nameRu}</b>
                                <div class="nut-effect-desc">${e.description}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${summary.stomachContents.length > 0 ? `
                <div class="nut-stomach">
                    <h4>В желудке</h4>
                    ${summary.stomachContents.map(item => `
                        <div class="nut-stomach-item">
                            <span>${item.name}</span>
                            <div class="nut-mini-bar">
                                <div class="nut-mini-fill" style="width:${item.remainingPct}%"></div>
                            </div>
                            <span class="nut-stomach-pct">${item.remainingPct}%</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div class="nut-meal-log">
                <h4>Последние приёмы пищи</h4>
                ${renderMealLog(char.nutrition.mealLog)}
            </div>

            <div class="nut-quick-actions">
                <button id="nut-quick-water" class="nut-action-btn">💧 Выпить воды</button>
                <button id="nut-quick-snack" class="nut-action-btn">🍎 Перекус</button>
                <button id="nut-quick-meal" class="nut-action-btn">🍲 Полноценная еда</button>
            </div>
        </div>
    `;

    document.getElementById('nut-quick-water')?.addEventListener('click', () => {
        window.NutritionFramework.manualAddWater(250);
        renderDashboardTab(container);
    });

    document.getElementById('nut-quick-snack')?.addEventListener('click', () => {
        window.NutritionFramework.manualAddFood({
            raw: 'Лёгкий перекус',
            food: null,
            portionG: 80,
            kcal: 150,
            protein: 3,
            fat: 5,
            carbs: 20,
            waterMl: 20,
            digestSpeed: 'fast',
            caffeine: false,
            alcohol: false,
            confidence: 1,
            source: 'manual',
        });
        renderDashboardTab(container);
    });

    document.getElementById('nut-quick-meal')?.addEventListener('click', () => {
        window.NutritionFramework.manualAddFood({
            raw: 'Полноценный обед',
            food: null,
            portionG: 400,
            kcal: 550,
            protein: 25,
            fat: 18,
            carbs: 60,
            waterMl: 200,
            digestSpeed: 'medium',
            caffeine: false,
            alcohol: false,
            confidence: 1,
            source: 'manual',
        });
        renderDashboardTab(container);
    });
}

function renderGauge(label, value, max, sublabel, color) {
    const pct = Math.max(0, Math.min(100, (value / max) * 100));
    return `
        <div class="nut-gauge">
            <div class="nut-gauge-label">${label}</div>
            <div class="nut-gauge-bar">
                <div class="nut-gauge-fill" style="width:${pct}%;background:${color}"></div>
            </div>
            <div class="nut-gauge-sub">${sublabel}</div>
        </div>
    `;
}

function renderMealLog(log) {
    if (!log || log.length === 0) {
        return '<div class="nut-empty-small">Пока ничего не ела</div>';
    }

    const recent = log.slice(-8).reverse();
    return recent.map(entry => `
        <div class="nut-log-item">
            <span class="nut-log-name">${entry.name}</span>
            <span class="nut-log-kcal">${entry.kcal} ккал</span>
            <span class="nut-log-portion">${entry.portionG}г</span>
        </div>
    `).join('');
}

function getHungerColor(threshold) {
    const colors = { stuffed: '#8a7fb3', full: '#4caf50', satisfied: '#66bb6a', peckish: '#ffc107', hungry: '#ff9800', very_hungry: '#f44336', starving: '#b71c1c' };
    return colors[threshold.id] || '#999';
}

function getHydrationColor(threshold) {
    const colors = { optimal: '#42a5f5', mild: '#66bb6a', moderate: '#ffc107', severe: '#ff9800', critical: '#f44336' };
    return colors[threshold.id] || '#999';
}

// ═══════════════════════════════════════════════════════════════
// ВКЛАДКА: ПЕРСОНАЖИ
// ═══════════════════════════════════════════════════════════════

function renderCharactersTab(container) {
    const state = getState();
    const characters = Object.values(state.characters);
    const activeId = state.activeCharId;

    container.innerHTML = `
        <div class="nut-characters">
            <div class="nut-char-list">
                ${characters.map(char => {
                    const summary = getSummary(char.nutrition);
                    const isActive = char.id === activeId;
                    return `
                    <div class="nut-char-card ${isActive ? 'nut-char-active' : ''}" data-id="${char.id}">
                        <div class="nut-char-card-header">
                            <span class="nut-char-card-name">${char.isPlayer ? '⭐ ' : ''}${char.name}</span>
                            ${isActive ? '<span class="nut-char-badge">активен</span>' : ''}
                        </div>
                        <div class="nut-char-card-stats">
                            <span>${char.profile.sex === 'male' ? '♂' : '♀'} ${char.profile.age}л</span>
                            <span>${summary.weightKg}кг / ${char.profile.heightCm}см</span>
                            <span>${summary.hunger.labelRu}</span>
                        </div>
                        <div class="nut-char-card-actions">
                            ${!isActive ? `<button class="nut-btn-small nut-btn-activate" data-id="${char.id}">Сделать активным</button>` : ''}
                            <button class="nut-btn-small nut-btn-edit" data-id="${char.id}">Редактировать</button>
                            ${!char.isPlayer ? `<button class="nut-btn-small nut-btn-danger nut-btn-delete" data-id="${char.id}">Удалить</button>` : ''}
                        </div>
                    </div>`;
                }).join('')}
            </div>

            <div class="nut-char-create">
                <h4>Добавить персонажа</h4>
                <div class="nut-form-row">
                    <label>Имя</label>
                    <input type="text" id="nut-new-name" placeholder="Имя персонажа" maxlength="30">
                </div>
                <div class="nut-form-row">
                    <label>Пол</label>
                    <select id="nut-new-sex">
                        <option value="female">Женский</option>
                        <option value="male">Мужской</option>
                    </select>
                </div>
                <div class="nut-form-row">
                    <label>Возраст</label>
                    <input type="number" id="nut-new-age" value="25" min="10" max="100">
                </div>
                <div class="nut-form-row">
                    <label>Рост (см)</label>
                    <input type="number" id="nut-new-height" value="165" min="100" max="250">
                </div>
                <div class="nut-form-row">
                    <label>Вес (кг)</label>
                    <input type="number" id="nut-new-weight" value="58" min="30" max="300">
                </div>
                <div class="nut-form-row">
                    <label>Активность</label>
                    <select id="nut-new-activity">
                        <option value="sedentary">Сидячая</option>
                        <option value="light" selected>Лёгкая</option>
                        <option value="moderate">Умеренная</option>
                        <option value="active">Высокая</option>
                        <option value="extreme">Экстремальная</option>
                    </select>
                </div>
                <button id="nut-create-char" class="nut-btn-primary">Создать</button>
            </div>
        </div>
    `;

    container.querySelectorAll('.nut-btn-activate').forEach(btn => {
        btn.addEventListener('click', () => {
            setActiveCharacter(btn.dataset.id);
            renderCharactersTab(container);
            showNotify('Активный персонаж изменён', 'info');
        });
    });

    container.querySelectorAll('.nut-btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!confirm('Удалить этого персонажа?')) return;
            removeCharacter(btn.dataset.id);
            renderCharactersTab(container);
            showNotify('Персонаж удалён', 'info');
        });
    });

    container.querySelectorAll('.nut-btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            renderEditCharacter(container, btn.dataset.id);
        });
    });

    document.getElementById('nut-create-char')?.addEventListener('click', () => {
        const name = document.getElementById('nut-new-name')?.value.trim();
        if (!name) { showNotify('Укажите имя', 'warning'); return; }

        createCharacter(name, {
            sex: document.getElementById('nut-new-sex')?.value || 'female',
            age: parseInt(document.getElementById('nut-new-age')?.value) || 25,
            heightCm: parseInt(document.getElementById('nut-new-height')?.value) || 165,
            weightKg: parseInt(document.getElementById('nut-new-weight')?.value) || 58,
            activityLevel: document.getElementById('nut-new-activity')?.value || 'light',
        });

        showNotify(`Персонаж «${name}» создан`, 'success');
        renderCharactersTab(container);
    });
}

function renderEditCharacter(container, charId) {
    const state = getState();
    const char = state.characters[charId];
    if (!char) return;

    container.innerHTML = `
        <div class="nut-edit-char">
            <h4>Редактирование: ${char.name}</h4>
            <div class="nut-form-row">
                <label>Пол</label>
                <select id="nut-edit-sex">
                    <option value="female" ${char.profile.sex === 'female' ? 'selected' : ''}>Женский</option>
                    <option value="male" ${char.profile.sex === 'male' ? 'selected' : ''}>Мужской</option>
                </select>
            </div>
            <div class="nut-form-row">
                <label>Возраст</label>
                <input type="number" id="nut-edit-age" value="${char.profile.age}" min="10" max="100">
            </div>
            <div class="nut-form-row">
                <label>Рост (см)</label>
                <input type="number" id="nut-edit-height" value="${char.profile.heightCm}" min="100" max="250">
            </div>
            <div class="nut-form-row">
                <label>Вес (кг)</label>
                <input type="number" id="nut-edit-weight" value="${char.nutrition.weightKg.toFixed(1)}" min="30" max="300" step="0.1">
            </div>
            <div class="nut-form-row">
                <label>Активность</label>
                <select id="nut-edit-activity">
                    ${Object.keys(ACTIVITY_MULTIPLIERS).map(k => `
                        <option value="${k}" ${char.profile.activityLevel === k ? 'selected' : ''}>${k}</option>
                    `).join('')}
                </select>
            </div>
            <div class="nut-form-row">
                <label>Насыщение (0–100)</label>
                <input type="number" id="nut-edit-satiety" value="${Math.round(char.nutrition.satiety)}" min="0" max="100">
            </div>
            <div class="nut-form-row">
                <label>Гидратация (0–100)</label>
                <input type="number" id="nut-edit-hydration" value="${Math.round(char.nutrition.hydration)}" min="0" max="100">
            </div>
            <div class="nut-edit-btns">
                <button id="nut-edit-save" class="nut-btn-primary">Сохранить</button>
                <button id="nut-edit-back" class="nut-btn-secondary">Назад</button>
            </div>
        </div>
    `;

    document.getElementById('nut-edit-save')?.addEventListener('click', () => {
        updateCharacterProfile(charId, {
            sex: document.getElementById('nut-edit-sex')?.value,
            age: parseInt(document.getElementById('nut-edit-age')?.value) || 25,
            heightCm: parseInt(document.getElementById('nut-edit-height')?.value) || 165,
            weightKg: parseFloat(document.getElementById('nut-edit-weight')?.value) || 58,
            activityLevel: document.getElementById('nut-edit-activity')?.value || 'light',
        });

        const c = state.characters[charId];
        if (c) {
            const sat = parseInt(document.getElementById('nut-edit-satiety')?.value);
            if (!isNaN(sat)) c.nutrition.satiety = Math.max(0, Math.min(100, sat));
            const hyd = parseInt(document.getElementById('nut-edit-hydration')?.value);
            if (!isNaN(hyd)) c.nutrition.hydration = Math.max(0, Math.min(100, hyd));
        }

        showNotify('Сохранено', 'success');
        renderCharactersTab(container);
    });

    document.getElementById('nut-edit-back')?.addEventListener('click', () => {
        renderCharactersTab(container);
    });
}

// ═══════════════════════════════════════════════════════════════
// ВКЛАДКА: ЕДА
// ═══════════════════════════════════════════════════════════════

function renderFoodTab(container) {
    container.innerHTML = `
        <div class="nut-food-tab">
            <div class="nut-food-search">
                <h4>Добавить еду вручную</h4>
                <div class="nut-form-row">
                    <input type="text" id="nut-food-search" placeholder="Введите название продукта..." autocomplete="off">
                </div>
                <div id="nut-food-results" class="nut-food-results"></div>
                <div id="nut-food-custom" class="nut-food-custom nut-hidden">
                    <h5>Ручной ввод</h5>
                    <div class="nut-form-row">
                        <label>Название</label>
                        <input type="text" id="nut-custom-name" placeholder="Пельмени с майонезом">
                    </div>
                    <div class="nut-form-grid">
                        <div class="nut-form-row">
                            <label>Ккал</label>
                            <input type="number" id="nut-custom-kcal" value="300" min="0" max="5000">
                        </div>
                        <div class="nut-form-row">
                            <label>Порция (г)</label>
                            <input type="number" id="nut-custom-portion" value="200" min="1" max="5000">
                        </div>
                        <div class="nut-form-row">
                            <label>Белки (г)</label>
                            <input type="number" id="nut-custom-protein" value="10" min="0" max="500">
                        </div>
                        <div class="nut-form-row">
                            <label>Жиры (г)</label>
                            <input type="number" id="nut-custom-fat" value="10" min="0" max="500">
                        </div>
                        <div class="nut-form-row">
                            <label>Углеводы (г)</label>
                            <input type="number" id="nut-custom-carbs" value="30" min="0" max="500">
                        </div>
                        <div class="nut-form-row">
                            <label>Вода (мл)</label>
                            <input type="number" id="nut-custom-water" value="50" min="0" max="2000">
                        </div>
                    </div>
                    <button id="nut-custom-add" class="nut-btn-primary">Добавить</button>
                </div>
            </div>

            <div class="nut-food-catalog">
                <h4>Справочник продуктов</h4>
                <div class="nut-catalog-tabs">
                    ${Object.entries(FOOD_CATEGORIES).map(([key, cat]) => `
                        <button class="nut-cat-btn" data-cat="${key}">${cat.ru}</button>
                    `).join('')}
                </div>
                <div id="nut-catalog-list" class="nut-catalog-list"></div>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('nut-food-search');
    const resultsDiv = document.getElementById('nut-food-results');
    const customDiv = document.getElementById('nut-food-custom');

    let searchTimeout;
    searchInput?.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = searchInput.value.trim();
            if (query.length < 2) {
                resultsDiv.innerHTML = '';
                customDiv.classList.add('nut-hidden');
                return;
            }

            const found = findFood(query);
            if (found && found.confidence >= 0.5) {
                const food = found.food;
                const kcal = Math.round((food.per100g.kcal / 100) * food.defaultPortionG);
                resultsDiv.innerHTML = `
                    <div class="nut-food-result" id="nut-found-food">
                        <div class="nut-food-result-name">${food.names[0]}</div>
                        <div class="nut-food-result-info">
                            ${kcal} ккал / ${food.defaultPortionG}г · Б${food.per100g.protein} Ж${food.per100g.fat} У${food.per100g.carbs}
                        </div>
                        <div class="nut-form-row" style="margin-top:8px;">
                            <label>Порция (г)</label>
                            <input type="number" id="nut-found-portion" value="${food.defaultPortionG}" min="1" max="5000" style="width:80px;">
                        </div>
                        <button class="nut-btn-primary" id="nut-found-add">Добавить</button>
                    </div>
                `;
                customDiv.classList.add('nut-hidden');

                document.getElementById('nut-found-add')?.addEventListener('click', () => {
                    const portion = parseInt(document.getElementById('nut-found-portion')?.value) || food.defaultPortionG;
                    const actualKcal = Math.round((food.per100g.kcal / 100) * portion);
                    window.NutritionFramework.manualAddFood({
                        raw: food.names[0],
                        food: food,
                        portionG: portion,
                        kcal: actualKcal,
                        protein: Math.round((food.per100g.protein / 100) * portion * 10) / 10,
                        fat: Math.round((food.per100g.fat / 100) * portion * 10) / 10,
                        carbs: Math.round((food.per100g.carbs / 100) * portion * 10) / 10,
                        waterMl: Math.round(food.hydrationMl * (portion / food.defaultPortionG)),
                        digestSpeed: food.digestSpeed,
                        caffeine: food.caffeine,
                        alcohol: food.alcohol,
                        confidence: 1,
                        source: 'manual',
                    });
                    searchInput.value = '';
                    resultsDiv.innerHTML = '<div class="nut-food-added">✓ Добавлено!</div>';
                    setTimeout(() => { resultsDiv.innerHTML = ''; }, 2000);
                });
            } else {
                resultsDiv.innerHTML = `<div class="nut-food-notfound">«${query}» не найден в базе</div>`;
                customDiv.classList.remove('nut-hidden');
                document.getElementById('nut-custom-name').value = query;
            }
        }, 300);
    });

    document.getElementById('nut-custom-add')?.addEventListener('click', () => {
        const name = document.getElementById('nut-custom-name')?.value.trim() || 'Еда';
        window.NutritionFramework.manualAddFood({
            raw: name,
            food: null,
            portionG: parseInt(document.getElementById('nut-custom-portion')?.value) || 200,
            kcal: parseInt(document.getElementById('nut-custom-kcal')?.value) || 300,
            protein: parseInt(document.getElementById('nut-custom-protein')?.value) || 10,
            fat: parseInt(document.getElementById('nut-custom-fat')?.value) || 10,
            carbs: parseInt(document.getElementById('nut-custom-carbs')?.value) || 30,
            waterMl: parseInt(document.getElementById('nut-custom-water')?.value) || 50,
            digestSpeed: 'medium',
            caffeine: false,
            alcohol: false,
            confidence: 1,
            source: 'manual',
        });
        showNotify(`Добавлено: ${name}`, 'food');
        customDiv.classList.add('nut-hidden');
        searchInput.value = '';
    });

    container.querySelectorAll('.nut-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.cat;
            const list = document.getElementById('nut-catalog-list');
            const foods = FOOD_DATABASE.filter(f => f.category === cat);

            list.innerHTML = foods.map(food => {
                const kcal = Math.round((food.per100g.kcal / 100) * food.defaultPortionG);
                return `
                <div class="nut-catalog-item" data-food-id="${food.id}">
                    <span class="nut-cat-name">${food.names[0]}</span>
                    <span class="nut-cat-info">${kcal} ккал / ${food.defaultPortionG}г</span>
                    <button class="nut-btn-tiny nut-cat-add" data-food-id="${food.id}">+</button>
                </div>`;
            }).join('') || '<div class="nut-empty-small">Пусто</div>';

            list.querySelectorAll('.nut-cat-add').forEach(addBtn => {
                addBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const food = FOOD_DATABASE.find(f => f.id === addBtn.dataset.foodId);
                    if (!food) return;
                    const kcal2 = Math.round((food.per100g.kcal / 100) * food.defaultPortionG);
                    window.NutritionFramework.manualAddFood({
                        raw: food.names[0],
                        food,
                        portionG: food.defaultPortionG,
                        kcal: kcal2,
                        protein: Math.round((food.per100g.protein / 100) * food.defaultPortionG * 10) / 10,
                        fat: Math.round((food.per100g.fat / 100) * food.defaultPortionG * 10) / 10,
                        carbs: Math.round((food.per100g.carbs / 100) * food.defaultPortionG * 10) / 10,
                        waterMl: food.hydrationMl,
                        digestSpeed: food.digestSpeed,
                        caffeine: food.caffeine,
                        alcohol: food.alcohol,
                        confidence: 1,
                        source: 'manual',
                    });
                    showNotify(`Добавлено: ${food.names[0]}`, 'food', 2000);
                });
            });
        });
    });
}

// ═══════════════════════════════════════════════════════════════
// ВКЛАДКА: НАСТРОЙКИ
// ═══════════════════════════════════════════════════════════════

function renderSettingsTab(container) {
    const settings = getSettings();

    container.innerHTML = `
        <div class="nut-settings">
            <h4>Основные</h4>
            <div class="nut-setting-row">
                <label for="nut-set-enabled">Расширение активно</label>
                <input type="checkbox" id="nut-set-enabled" ${settings.enabled ? 'checked' : ''}>
            </div>
            <div class="nut-setting-row">
                <label for="nut-set-float">Показывать плавающую кнопку</label>
                <input type="checkbox" id="nut-set-float" ${isFloatBtnVisible() ? 'checked' : ''}>
            </div>
            <div class="nut-setting-row">
                <label for="nut-set-theme">Тема оформления</label>
                <select id="nut-set-theme">
                    ${THEMES.map(t => `<option value="${t.id}" ${getTheme() === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
                </select>
            </div>
            <div class="nut-setting-row">
                <label for="nut-set-prompt-mode">Режим промпта</label>
                <select id="nut-set-prompt-mode">
                    <option value="auto" ${settings.promptMode === 'auto' ? 'selected' : ''}>Авто (экономит токены)</option>
                    <option value="full" ${settings.promptMode === 'full' ? 'selected' : ''}>Всегда полный</option>
                    <option value="compact" ${settings.promptMode === 'compact' ? 'selected' : ''}>Всегда компактный</option>
                </select>
            </div>
            <div class="nut-setting-row">
                <label for="nut-set-ai-estimate">AI оценивает неизвестную еду</label>
                <input type="checkbox" id="nut-set-ai-estimate" ${settings.aiEstimate ? 'checked' : ''}>
            </div>
            <div class="nut-setting-row">
                <label for="nut-set-auto-detect">Автопарсинг еды из текста</label>
                <input type="checkbox" id="nut-set-auto-detect" ${settings.autoDetectFood ? 'checked' : ''}>
            </div>
            <div class="nut-setting-row">
                <label for="nut-set-weight">Отслеживать вес</label>
                <input type="checkbox" id="nut-set-weight" ${settings.weightTracking ? 'checked' : ''}>
            </div>
            <div class="nut-setting-row">
                <label for="nut-set-critical">Критический override (стоп-ролплей при голоде)</label>
                <input type="checkbox" id="nut-set-critical" ${settings.criticalOverride ? 'checked' : ''}>
            </div>
            <div class="nut-setting-row">
                <label for="nut-set-notif">Уведомления</label>
                <input type="checkbox" id="nut-set-notif" ${settings.showNotifications ? 'checked' : ''}>
            </div>

            <h4>Опасная зона</h4>
            <div class="nut-setting-row">
                <button class="nut-btn-danger nut-btn-small" id="nut-set-reset">Сбросить все данные чата</button>
                <button class="nut-btn-small" id="nut-set-export">Экспорт</button>
                <button class="nut-btn-small" id="nut-set-import">Импорт</button>
            </div>
        </div>
    `;

    const bind = (id, key) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('change', () => {
            const val = el.type === 'checkbox' ? el.checked : el.value;
            updateSettings({ [key]: val });
            showNotify('Настройки сохранены', 'info', 2000);
        });
    };

    bind('nut-set-enabled', 'enabled');
    bind('nut-set-prompt-mode', 'promptMode');
    bind('nut-set-ai-estimate', 'aiEstimate');
    bind('nut-set-auto-detect', 'autoDetectFood');
    bind('nut-set-weight', 'weightTracking');
    bind('nut-set-critical', 'criticalOverride');
    bind('nut-set-notif', 'showNotifications');

    document.getElementById('nut-set-float')?.addEventListener('change', (e) => {
        setFloatBtnVisible(e.target.checked);
        showNotify(e.target.checked ? 'Кнопка показана' : 'Кнопка скрыта', 'info', 2000);
    });

    document.getElementById('nut-set-theme')?.addEventListener('change', (e) => {
        setTheme(e.target.value);
        const headerSelect = document.getElementById('nut-theme-select');
        if (headerSelect) headerSelect.value = e.target.value;
        showNotify('Тема изменена', 'info', 2000);
    });

    document.getElementById('nut-set-reset')?.addEventListener('click', () => {
        if (!confirm('Сбросить ВСЕ данные о питании в этом чате? Действие необратимо.')) return;
        resetState();
        showNotify('Данные сброшены', 'info');
        renderContent();
    });

    document.getElementById('nut-set-export')?.addEventListener('click', () => {
        const data = exportState();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `nutrition_backup_${Date.now()}.json`; a.click();
        URL.revokeObjectURL(url);
        showNotify('Экспортировано', 'success');
    });

    document.getElementById('nut-set-import')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    importState(data);
                    showNotify('Импортировано', 'success');
                    renderContent();
                } catch (err) {
                    showNotify('Ошибка: ' + err.message, 'critical');
                }
            };
            reader.readAsText(file);
        });
        input.click();
    });
}

// ═══════════════════════════════════════════════════════════════
// ВКЛАДКА: DEBUG
// ═══════════════════════════════════════════════════════════════

export function renderDebug() {
    if (!panelOpen || activeTab !== 'debug') return;
    const container = document.getElementById('nut-content');
    if (container) renderDebugTab(container);
}

function renderDebugTab(container) {
    const dump = getDebugDump();
    const lastPrompt = window.NutritionFramework?.getLastPrompt?.() || '(unavailable)';
    const char = getActiveCharacter();
    const summary = char ? getSummary(char.nutrition) : null;

    container.innerHTML = `
        <div class="nut-debug">
            <h4>Debug Info</h4>

            <div class="nut-debug-section">
                <h5>Active Character State</h5>
                <pre class="nut-debug-pre">${JSON.stringify(char?.nutrition || {}, null, 2)}</pre>
            </div>

            <div class="nut-debug-section">
                <h5>Summary</h5>
                <pre class="nut-debug-pre">${JSON.stringify(summary || {}, null, 2)}</pre>
            </div>

            <div class="nut-debug-section">
                <h5>Last Injected Prompt (${lastPrompt.length} chars, ≈${Math.ceil(lastPrompt.length / 4)} tokens)</h5>
                <pre class="nut-debug-pre nut-debug-prompt">${escapeHtml(lastPrompt)}</pre>
            </div>

            <div class="nut-debug-section">
                <h5>Global State</h5>
                <pre class="nut-debug-pre">${JSON.stringify(dump, null, 2)}</pre>
            </div>
        </div>
    `;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&')
        .replace(/</g, '<')
        .replace(/>/g, '>');
}
