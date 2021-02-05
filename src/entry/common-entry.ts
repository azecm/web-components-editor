import {AdminMenu} from "../menu/menu";
import {createElement, CSSStyle} from "element";
import {siteAdminParam} from "api";
import {initLogin} from "../login/login";
import {testHostFlag, testHostPref} from "env";


export function initPage(fnNext: () => void) {
    CSSStyle().add('body', {color: '#444', backgroundColor: '#f2f2f2'}).toHead();

    if (siteAdminParam.enabledElements) {
        if (siteAdminParam.session.opened) {
            siteAdminParam.session.test(() => afterLogin(fnNext));
        } else {
            initLogin(() => afterLogin(fnNext));
        }
    }
}

export function pageNotFound() {
    initTitle('Страница не найдена');
    document.body.append(createElement('h1', null, ['Страница не найдена']));
}

export function initTitle(title: string) {
    title += ` - ${window.location.hostname.replace('www.', '')}`;
    document.getElementsByTagName('title')[0].text = title;
}

export function initBack() {
    const pref = (testHostFlag ? testHostPref : '');
    CSSStyle().content(`body{background-repeat: repeat-y;background-image: url("${pref}/apple-touch-icon-152x152.png");}`).toHead();
}

function afterLogin(fnNext: () => void) {
    document.body.appendChild(new AdminMenu());
    fnNext();
}
