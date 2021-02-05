import styleControl from './control.scss';
import {initBack, initPage, initTitle} from "./common-entry";
import {PageAbout} from "../user/about/PageAbout";
import {PageNodes} from "../user/nodes/PageNodes";
import {CSSStyle} from "element";
import {initEditor} from "../editor/Editor";

initPage(init);

function init() {
    CSSStyle().content(styleControl).toHead();
    const pathControl = '/control/';
    const pathList = location.pathname.substr(location.pathname.indexOf(pathControl)).split('/');
    switch (pathList[2]) {
        case 'user': {
            const userName = decodeURI(pathList[3]);
            if (pathList.length == 4) {
                initTitle('Пользователь ' + userName);
                initBack();
                new PageAbout(userName);
            } else {
                initTitle('Статьи пользователя ' + userName);
                initBack();
                new PageNodes(userName);
            }
            break;
        }
        case 'edit': {
            initEditor();
            break;
        }
    }
}

