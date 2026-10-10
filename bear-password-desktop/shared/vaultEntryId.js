export function toVaultEntryId(id) {
    if (id === null || id === undefined)
        return '';
    if (typeof id === 'bigint')
        return id.toString();
    if (typeof id === 'number') {
        if (!Number.isFinite(id))
            return '';
        return String(id);
    }
    return id.trim();
}
export function sameVaultEntryId(a, b) {
    return toVaultEntryId(a) === toVaultEntryId(b);
}
