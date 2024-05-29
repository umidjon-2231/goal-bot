export function escapeRegex(string: string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export default {escapeRegex}