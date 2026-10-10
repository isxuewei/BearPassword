export function getDefaultWindowState(defaultWidth, defaultHeight) {
    return {
        width: defaultWidth,
        height: defaultHeight,
        isMaximized: false
    };
}
export function normalizeWindowState(raw, minWidth, minHeight, defaultWidth, defaultHeight) {
    if (defaultWidth === void 0) { defaultWidth = minWidth; }
    if (defaultHeight === void 0) { defaultHeight = minHeight; }
    var fallback = getDefaultWindowState(defaultWidth, defaultHeight);
    var width = Number(raw === null || raw === void 0 ? void 0 : raw.width);
    var height = Number(raw === null || raw === void 0 ? void 0 : raw.height);
    var x = (raw === null || raw === void 0 ? void 0 : raw.x) === undefined ? undefined : Number(raw.x);
    var y = (raw === null || raw === void 0 ? void 0 : raw.y) === undefined ? undefined : Number(raw.y);
    return {
        x: x !== undefined && Number.isFinite(x) ? Math.round(x) : undefined,
        y: y !== undefined && Number.isFinite(y) ? Math.round(y) : undefined,
        width: Number.isFinite(width) && width >= minWidth ? Math.round(width) : fallback.width,
        height: Number.isFinite(height) && height >= minHeight ? Math.round(height) : fallback.height,
        isMaximized: (raw === null || raw === void 0 ? void 0 : raw.isMaximized) === true
    };
}
