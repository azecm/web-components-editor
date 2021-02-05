import {testHostFlag, testHostHeader, testHostPref, testHostValue} from "env";


const apiPath = '/_path_/';
const headerUser = 'X-Data';
export const stateParam = {
    key: () => ''
};

class ConnectParam {
    headers = new Headers();
    url!: string;
    method!: string;
    body: any;
    isSimple!: boolean;
    isJson!: boolean;
    fnResult!: (obj: any) => void;
    fnError!: () => void;
}

export function connectInit() {
    return new ConnectInit();
}

function getURL(path: string) {
    let url = path.startsWith('/') ? path : apiPath + path;
    if (testHostFlag) {
        url = testHostPref + url;
    }
    return url;
}

class ConnectInit {

    param = new ConnectParam();

    constructor() {
        if (testHostFlag) {
            this.param.headers.append(testHostHeader, testHostValue);
        }
    }

    simple() {
        this.param.isSimple = true;
        return this;
    }

    auth() {
        this.param.headers.append(headerUser, stateParam.key());
        return this;
    }

    resultJson() {
        this.param.isJson = true;
        return this;
    }

    path(path: string) {
        this.param.url = getURL(path);
        return this;
    }

    bodyJson(obj: Object) {
        this.param.body = JSON.stringify(obj);
        this.param.headers.append('Content-Type', 'application/json; charset=utf-8');
        return this;
    }

    bodyText(str: string) {
        this.param.body = str;
        this.param.headers.append('Content-Type', 'text/plain; charset=UTF-8');
        return this;
    }

    get(flagSend = true) {
        this.param.method = 'get';
        if (flagSend) this.send();
        return this;
    }

    post(flagSend = true) {
        this.param.method = 'post';
        if (flagSend) this.send();
        return this;
    }

    onResult(fn: (obj: any) => void) {
        this.param.fnResult = fn;
        return this;
    }

    onError(fn?: () => void) {
        if (fn) this.param.fnError = fn;
        return this;
    }

    fetch() {
        const init = {
            credentials: 'include',
            method: this.param.method,
            headers: this.param.headers
        } as RequestInit;

        if (this.param.body) {
            init.body = this.param.body;
        }

        return fetch(this.param.url, init);
    }

    private send() {
        if (this.param.isJson) {
            this.fetch().then(r => connectSendJson(r, this.param)).then(data => connectData(data, this.param)).catch(err => connectError(err, this.param));
        }
    }
}

function connectSendJson(r: Response, param: ConnectParam) {
    if (r.status < 200 || r.status > 399) {
        console.error('status', r.status);
        if (param.fnError) param.fnError();
    }
    return r.json();
}

function connectData(_data: any, param: ConnectParam) {
    if (param.isSimple) {
        param.fnResult(_data);
    } else {
        const data = _data as { code: number, result: any };
        if (data && data.code == 200 && data.result != void (0)) {
            param.fnResult(data.result);
        } else {
            console.error('onDataJson', data);
            if (param.fnError) param.fnError();
        }
    }
}

function connectError(err: Error, param: ConnectParam) {
    console.error(err);
    if (param.fnError) param.fnError();
}

export function connectGetJsonSimple(path: string, fnResult: (obj: any) => void) {
    connectInit().resultJson().simple().path(path).onResult(fnResult).get();
}

export function connectGetJson(path: string, fnResult: (obj: any) => void, fnErr?: () => void) {
    connectInit().resultJson().auth().path(path).onResult(fnResult).onError(fnErr).get();
}

export function connectPostJson(path: string, obj: Object, fnResult: (obj: any) => void, fnErr?: () => void) {
    connectInit().resultJson().auth().path(path).bodyJson(obj).onResult(fnResult).onError(fnErr).post();
}


export function connectPostForm(path: 'files' | 'update', form: FormData, fnProgress: (val: string) => void, fnResult: (data: any) => void, fnError: () => void) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', getURL('e/' + path), true);
    xhr.setRequestHeader(headerUser, stateParam.key());

    xhr.upload.onprogress = (e) =>
        fnProgress(Math.round((e.loaded * 100.0 / e.total)) + '%');

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            let data: { code: number, result: any } | undefined;
            try {
                data = JSON.parse(xhr.responseText);
            } catch (e) {
            }
            if (data && data.code == 200) {
                fnResult(data.result);
            } else {
                fnError();
            }
        } else {
            fnError();
        }
    };
    xhr.onerror = () => fnError();

    xhr.send(form);
}