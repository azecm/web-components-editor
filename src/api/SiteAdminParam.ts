import {SiteSession, storageMenuKey} from "./session";
import {testHostFlag} from "env";
import {stateParam} from "./api";

export const pathControl = '/ctrl/';

const pathRoot = testHostFlag ? '/ts-2018/ts-admin-2021' : '';

class SiteParam {

    readonly enabledElements = !!window.customElements;

    u1 = '';
    userIsAdmin = false;

    session = new SiteSession().load();

    menu = [] as string[];

    constructor() {
        stateParam.key = () => this.session.key;
        this.initMenu();
    }

    initMenu() {
        const text = localStorage.getItem(storageMenuKey);
        if (text) {
            let list = [] as string[];
            try {
                list = JSON.parse(text);
            } catch (e) {
            }
            if (list.length) {
                this.menu = list;
                this.u1 = list[1];
                this.userIsAdmin = list.length > 5;
            } else {
                localStorage.removeItem(storageMenuKey);
                this.session.reset();
            }
        }
    }

    pathEdit(idn: number | string) {
        return pathRoot + pathControl + 'ed#' + idn;
    }

    pathUser(user: string) {
        return pathRoot + pathControl + 'u/' + encodeURI(user);
    }

    pathAdmin(path: string) {
        const l = path.split('/');
        if (l.length == 3) {
            l[l.length - 1] = '?' + l[l.length - 1];
        }
        return pathRoot + l.join('/');
    }
}

export const siteAdminParam = new SiteParam();