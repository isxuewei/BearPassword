export var DEFAULT_TRAY_SETTINGS = {
    enabled: true,
    clickAction: 'vault'
};
export var TRAY_CLICK_ACTIONS = ['vault', 'favorites', 'recent', 'settings'];
var LEGACY_TRAY_CLICK_ACTIONS = {
    open: 'vault',
    'quick-search': 'vault'
};
export function normalizeTrayClickAction(raw) {
    if (typeof raw === 'string' && LEGACY_TRAY_CLICK_ACTIONS[raw]) {
        return LEGACY_TRAY_CLICK_ACTIONS[raw];
    }
    if (TRAY_CLICK_ACTIONS.includes(raw)) {
        return raw;
    }
    return DEFAULT_TRAY_SETTINGS.clickAction;
}
export function normalizeTraySettings(raw) {
    return {
        enabled: (raw === null || raw === void 0 ? void 0 : raw.enabled) !== false,
        clickAction: normalizeTrayClickAction(raw === null || raw === void 0 ? void 0 : raw.clickAction)
    };
}
