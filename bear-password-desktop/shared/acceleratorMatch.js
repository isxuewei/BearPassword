var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export var DEFAULT_SHORTCUT_BINDINGS = {
    open: 'Alt+B',
    lock: 'Alt+L'
};
/** 判断按键事件是否匹配 Electron Accelerator */
export function matchAccelerator(input, accelerator) {
    if (input.type && input.type !== 'keyDown')
        return false;
    var parts = accelerator.split('+').filter(Boolean);
    if (parts.length < 2)
        return false;
    var keyToken = parts[parts.length - 1];
    var mods = parts.slice(0, -1);
    var wantCmdOrCtrl = mods.includes('CommandOrControl');
    var wantCmd = mods.includes('Command');
    var wantCtrl = mods.includes('Control');
    var wantAlt = mods.includes('Alt') || mods.includes('Option');
    var wantShift = mods.includes('Shift');
    var hasCmdOrCtrl = input.meta || input.control;
    if (wantCmdOrCtrl && !hasCmdOrCtrl)
        return false;
    if (!wantCmdOrCtrl && wantCmd && !input.meta)
        return false;
    if (!wantCmdOrCtrl && wantCtrl && !input.control)
        return false;
    if (wantAlt !== input.alt)
        return false;
    if (wantShift !== input.shift)
        return false;
    if (extraModifiers(input, { wantCmdOrCtrl: wantCmdOrCtrl, wantCmd: wantCmd, wantCtrl: wantCtrl, wantAlt: wantAlt, wantShift: wantShift })) {
        return false;
    }
    return matchKeyToken(input, keyToken);
}
function extraModifiers(input, wanted) {
    if (!wanted.wantCmdOrCtrl && !wanted.wantCmd && input.meta)
        return true;
    if (!wanted.wantCmdOrCtrl && !wanted.wantCtrl && input.control)
        return true;
    if (!wanted.wantAlt && input.alt)
        return true;
    if (!wanted.wantShift && input.shift)
        return true;
    return false;
}
function matchKeyToken(input, keyToken) {
    var _a, _b, _c;
    if (/^F\d{1,2}$/i.test(keyToken)) {
        return ((_a = input.key) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === keyToken.toUpperCase();
    }
    if (keyToken.length === 1 && /[A-Z0-9]/i.test(keyToken)) {
        var upper = keyToken.toUpperCase();
        if (input.code === "Key".concat(upper) || input.code === "Digit".concat(upper))
            return true;
        if (((_b = input.key) === null || _b === void 0 ? void 0 : _b.toUpperCase()) === upper)
            return true;
        return false;
    }
    var specialCodes = {
        Space: ['Space'],
        Esc: ['Escape'],
        Escape: ['Escape'],
        Enter: ['Enter'],
        Tab: ['Tab'],
        Backspace: ['Backspace'],
        Delete: ['Delete']
    };
    var codes = specialCodes[keyToken];
    if (codes)
        return codes.includes((_c = input.code) !== null && _c !== void 0 ? _c : '');
    return input.key === keyToken || input.code === keyToken;
}
export function keyboardEventToShortcutInput(event) {
    return {
        type: 'keyDown',
        alt: event.altKey,
        shift: event.shiftKey,
        control: event.ctrlKey,
        meta: event.metaKey,
        key: event.key,
        code: event.code
    };
}
var MODIFIER_ORDER = ['CommandOrControl', 'Command', 'Control', 'Alt', 'Option', 'Shift'];
/** 规范化 Accelerator 字符串，便于注册与匹配 */
export function normalizeAcceleratorString(accelerator) {
    var parts = accelerator.split('+').filter(Boolean);
    if (parts.length < 2)
        return accelerator;
    var keyToken = parts[parts.length - 1];
    var mods = parts.slice(0, -1).map(function (part) { return (part === 'Option' ? 'Alt' : part); });
    var uniqueMods = [];
    for (var _i = 0, MODIFIER_ORDER_1 = MODIFIER_ORDER; _i < MODIFIER_ORDER_1.length; _i++) {
        var mod = MODIFIER_ORDER_1[_i];
        if (mods.includes(mod) && !uniqueMods.includes(mod === 'Option' ? 'Alt' : mod)) {
            if (mod === 'Option') {
                if (!uniqueMods.includes('Alt'))
                    uniqueMods.push('Alt');
            }
            else {
                uniqueMods.push(mod);
            }
        }
    }
    return __spreadArray(__spreadArray([], uniqueMods, true), [keyToken], false).join('+');
}
/** 检测是否为录制时产生的无效 accelerator（如 Alt+特殊符号） */
export function isBrokenAccelerator(accelerator) {
    if (!accelerator)
        return false;
    var parts = accelerator.split('+').filter(Boolean);
    if (parts.length < 2)
        return true;
    var keyToken = parts[parts.length - 1];
    if (/^F\d{1,2}$/i.test(keyToken))
        return false;
    if (keyToken.length === 1 && /[A-Z0-9]/i.test(keyToken))
        return false;
    return !['Space', 'Esc', 'Escape', 'Enter', 'Tab', 'Backspace', 'Delete'].includes(keyToken);
}
