var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { toVaultEntryId } from './vaultEntryId';
export var OFFLINE_VAULT_DATA_FILE = 'vault-data.json';
export var OFFLINE_VAULT_SETTINGS_FILE = 'offline-vault-settings.json';
export var DEFAULT_OFFLINE_VAULT_SNAPSHOT = {
    version: 1,
    nextId: 1,
    entries: [],
    favorites: [],
    recentVisits: []
};
export function normalizeOfflineVaultSettings(raw, defaultDataDir) {
    var dataDir = typeof (raw === null || raw === void 0 ? void 0 : raw.dataDir) === 'string' && raw.dataDir.trim() ? raw.dataDir.trim() : defaultDataDir;
    return {
        enabled: (raw === null || raw === void 0 ? void 0 : raw.enabled) === true,
        dataDir: dataDir
    };
}
export function normalizeOfflineVaultSnapshot(raw) {
    if (!raw || typeof raw !== 'object') {
        return __assign({}, DEFAULT_OFFLINE_VAULT_SNAPSHOT);
    }
    var source = raw;
    var nextId = typeof source.nextId === 'number' && source.nextId > 0 ? source.nextId : 1;
    return {
        version: 1,
        nextId: nextId,
        entries: Array.isArray(source.entries)
            ? source.entries.map(function (entry) { return (__assign(__assign({}, entry), { id: toVaultEntryId(entry.id) })); })
            : [],
        favorites: Array.isArray(source.favorites)
            ? source.favorites.map(function (item) { return (__assign(__assign({}, item), { passwordId: toVaultEntryId(item.passwordId) })); })
            : [],
        recentVisits: Array.isArray(source.recentVisits)
            ? source.recentVisits.map(function (item) { return (__assign(__assign({}, item), { passwordId: toVaultEntryId(item.passwordId) })); })
            : []
    };
}
function mergeRelationMeta(localItems, incomingItems) {
    var localIds = new Set(localItems.map(function (item) { return item.passwordId; }));
    var merged = __spreadArray([], localItems, true);
    for (var _i = 0, incomingItems_1 = incomingItems; _i < incomingItems_1.length; _i++) {
        var item = incomingItems_1[_i];
        if (!localIds.has(item.passwordId)) {
            merged.push(item);
        }
    }
    return merged;
}
function mergeRecentVisits(localItems, incomingItems) {
    return mergeRelationMeta(localItems, incomingItems).slice(0, 200);
}
/**
 * 合并离线快照：相同 ID 以本地为准，仅补充对方独有的条目与元数据。
 */
export function mergeOfflineVaultSnapshots(local, incoming) {
    var normalizedLocal = normalizeOfflineVaultSnapshot(local);
    var normalizedIncoming = normalizeOfflineVaultSnapshot(incoming);
    var localEntryIds = new Set(normalizedLocal.entries.map(function (entry) { return toVaultEntryId(entry.id); }));
    var mergedEntries = __spreadArray([], normalizedLocal.entries, true);
    for (var _i = 0, _a = normalizedIncoming.entries; _i < _a.length; _i++) {
        var entry = _a[_i];
        var entryId = toVaultEntryId(entry.id);
        if (!localEntryIds.has(entryId)) {
            mergedEntries.push(__assign(__assign({}, entry), { id: entryId }));
            localEntryIds.add(entryId);
        }
    }
    return {
        version: 1,
        nextId: 1,
        entries: mergedEntries,
        favorites: mergeRelationMeta(normalizedLocal.favorites, normalizedIncoming.favorites),
        recentVisits: mergeRecentVisits(normalizedLocal.recentVisits, normalizedIncoming.recentVisits)
    };
}
