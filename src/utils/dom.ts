import { Log } from './logger';

export function getIframeElement(id: string): HTMLIFrameElement | null {
    if (typeof document === 'undefined') {
        Log.warn('getElementById called in non-browser environment');
        return null;
    }

    return document.getElementById(id) as HTMLIFrameElement;
}

export function setIframeHeight(iframe: HTMLIFrameElement, height: number | string): void {
    iframe.height = `${height}`;
}
