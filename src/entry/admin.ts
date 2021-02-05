import {initBack, initPage, initTitle, pageNotFound} from "./common-entry";
import {PageVerify} from "../admin/verify/PageVerify";
import {PageTree} from "../admin/tree/PageTree";
import {PageKeywords} from "../admin/keywords/PageKeywords";
import {PageStat} from "../admin/stat/PageStat";
import {PageLog} from "../admin/stat/PageLog";

initPage(init);

function init() {
    const pathSubType = location.search.substr(1);
    switch (pathSubType) {
        case 'verify':
            initTitle('Новые публикации');
            initBack();
            new PageVerify();
            break;
        case 'tree':
            initTitle('Структура сайта');
            initBack();
            new PageTree();
            break;
        case 'keywords':
            initTitle('Список ключевых слов');
            initBack();
            new PageKeywords();
            break;
        case 'statistic':
            initTitle('Статистика');
            initBack();
            new PageStat();
            break;
        case 'log':
            initTitle('Логи');
            initBack();
            new PageLog();
            break;
        default:
            pageNotFound();
            break;
    }
}