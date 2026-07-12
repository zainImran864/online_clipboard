export const NAVIGATION_START_EVENT = 'pasteport:navigation-start';
export const TOAST_EVENT = 'pasteport:toast';

export function startNavigation() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}

export function showToast(message: string) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }));
}
