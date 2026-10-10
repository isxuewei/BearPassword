export var API_CONTEXT_PATH = '/api';
export function buildDesktopUpdateFeedUrl(serverOrigin, platform) {
    var sub = platform === 'darwin' ? 'mac' : 'win';
    return "".concat(serverOrigin.replace(/\/+$/, '')).concat(API_CONTEXT_PATH, "/desktop-updates/").concat(sub);
}
