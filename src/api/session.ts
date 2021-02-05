import {connectInit} from "./api";

export const storageMenuKey = 'm';
const storageSessionKey = 'o';

export class SiteSession {

    private sesKey = storageSessionKey;
    key!: string;
    pin!: string;

    private fnResult!: () => void;
    private fnError!: () => void;
    private fnTested!: () => void;

    get opened() {
        return !!this.key;
    }

    named(key: string) {
        this.sesKey = key;
        return this;
    }

    onResult(fn: () => void) {
        this.fnResult = fn;
        return this;
    }

    onError(fn: () => void) {
        this.fnError = fn;
        return this;
    }

    test(fnTested: () => void) {
        if (!this.key || !this.pin) return;
        this.fnTested = fnTested;
        connectInit().path('o/t')
            .auth()
            .bodyText('')
            .onResult(this.testNext.bind(this))
            .resultJson()
            .post();
    }

    private testNext(res: 'ok' | '') {
        if (res == 'ok') {
            this.fnTested();
            return;
        }
        const _list = [_browserParam().join('-'), this.pin];
        connectInit().path('o/u')
            .auth()
            .bodyText(_encode(_list).join('*'))
            .onResult(this.testUpdated.bind(this))
            .resultJson()
            .post();
    }

    private testUpdated(newPin: string) {
        if (newPin) {
            this.save(this.key, newPin);
            this.fnTested();
        } else {
            this.reset();
        }
    }

    open(u1: string, u2: string, u3?: string | null) {
        const _list = [u1, u2];
        if (u3 != null) _list.push(u3);

        connectInit()
            .path('o')
            .bodyText(_encode(_list).join('*'))
            .onResult(this._openResult.bind(this))
            .onError(this._openError.bind(this))
            .resultJson()
            .post();
    }

    private save(key: string, pin: string) {
        this.key = key;
        this.pin = pin;
        window.localStorage.setItem(this.sesKey, key + ' ' + pin);
    }

    private _openResult([key, pin, menu]: [string, string, string[]]) {
        if (key && pin) {
            this.save(key, pin);

            if (menu && Array.isArray(menu)) {
                window.localStorage.setItem(storageMenuKey, JSON.stringify(menu));
            }

            if (this.fnResult) this.fnResult();
        } else {
            if (this.fnError) this.fnError();
        }
    }

    private _openError() {
        if (this.fnError) this.fnError();
    }

    load() {
        if (window.localStorage.getItem(this.sesKey)) {
            const list = window.localStorage[this.sesKey].split(' ');
            if (list.length == 2) {
                this.key = list[0];
                this.pin = list[1];
            }
        }
        return this;
    }

    reset() {
        window.localStorage.removeItem(this.sesKey);
        window.localStorage.removeItem(storageMenuKey);
        this.key = this.pin = void (0) as any;
    }
}

function _encode(args: string[]) {
    const res = [] as string[];
    for (let num = 0; num < args.length; num++) {
        const a = args[num];
        const text = [] as string[];
        for (let i = 0; i < a.length; i++) {
            const key = (num + i) % 4 + 1;
            text.push(String.fromCharCode(a.charCodeAt(i) + ((num + i) % 2 ? key : -key)));
        }
        res.push(encodeURIComponent(text.join('')));
    }
    return res;
}

function _browserParam() {
    const screen = window.screen;
    return [
        Math.min(screen.width || 1, screen.height || 1),
        screen.colorDepth || 1,
        window.devicePixelRatio || 1
    ];
}