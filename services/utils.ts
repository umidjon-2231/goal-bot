export function escapeRegex(string: string) {
    return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function uppercaseStart(text: string) {
    return text.at(0).toUpperCase() + text.slice(1);
}


export function bold(text: string) {
    return `<b>${text}</b>`;
}

export function italic(text: string) {
    return `<i>${text}</i>`;
}


export function userUrl(chatId: string|number, name: string){
    return `<a href="tg://user?id=${chatId}">${name}</a>`
}