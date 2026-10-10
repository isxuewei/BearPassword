export var DEFAULT_DOCK_SETTINGS = {
    hidden: false
};
export function normalizeDockSettings(raw) {
    return {
        hidden: (raw === null || raw === void 0 ? void 0 : raw.hidden) === true
    };
}
