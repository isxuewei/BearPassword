export var DEFAULT_ISLAND_SETTINGS = {
    enabled: true
};
export function normalizeIslandSettings(raw) {
    return {
        enabled: (raw === null || raw === void 0 ? void 0 : raw.enabled) !== false
    };
}
