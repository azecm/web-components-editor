import {connectPostJson} from "api";
import {Anchor, Div, EL, LI, UL} from "element";
import {StatDateSelect} from "./StatDateSelect";
import {blockStatus, IStatHost, r, stylePageStat, viewBest, viewTime} from "./StatCommon";
import {StatGraph} from "./StatGraph";
import {statTable} from "./StatTable";
import {testHostFlag, testHostName} from "env";


export class PageStat {
    container = Div().as('page-body');
    private _content = Div().as('page-body').style({marginBottom: '7em'});
    private _hostName = testHostFlag ? testHostName : location.hostname;
    private statusAll = 0;

    constructor() {
        this.loaded = this.loaded.bind(this);
        this.view();
    }

    private onDate(date: string) {
        connectPostJson('stat', {date}, this.loaded);
    }

    private loaded(_data: any) {
        const data = _data.hosts[this._hostName] as IStatHost;
        this._content.drop().append(
            this.blockCE(),
            EL('h2').text(_data.date),
            this.blockTop(data),
            blockStatus(data.status, this.statusAll),
            new StatGraph(data.period).container,

            statTable(`Поисковые фразы: ${data.total.phrase}`, data.phrase),
            statTable(`Точки входа: ${data.total.entry}`, data.entry),
            statTable(`Ссылающиеся сайты: ${data.total.referer}`, data.referer),

            statTable(`Партнерки: ${data.total.affiliate}`, data.affiliate.host),
            statTable(`Партнерки (откуда)`, data.affiliate.src),
            statTable(`Партнерки (куда)`, data.affiliate.dst),

            statTable(`Переходы: ${data.total.go}`, data.go.host),
            statTable(`Переходы (откуда)`, data.go.src),
            statTable(`Переходы (куда)`, data.go.dst),

            statTable(`Внутриходы (откуда)`, data.follow.src),
            statTable(`Внутриходы (куда)`, data.follow.dst),
        );
    }

    private blockTop(data: IStatHost) {
        const g0 = viewBest(data.hit, data.user, 0);
        const g1 = viewBest(data.hit, data.user, 1);

        const t0 = viewTime(data.time, data.hit, 0);
        const t1 = viewTime(data.time, data.hit, 1);

        this.statusAll = 0;
        for (const val of Object.values(data.status)) {
            this.statusAll += val;
        }

        return UL().append(
            LI().html(`Пользователей: <b>${data.user[1]}</b> <small>${data.user[0]}</small>`),
            LI().html(`Просмотров: <b>${data.hit[1]}</b> <small>${data.hit[0]}</small>`),
            LI().html(`Хорошесть:  <b>${g1}</b> <small>${g0}</small>`),
            LI().html(`Время: <b>${t1}</b> <small>${t0}</small>`),
            LI().html(`1: ${r(data.amount[0], 'Гб')} исх: ${r(data.amount[1], 'Гб')}`),
            LI().html(`2: ${r(data.duration, 'ч')}`),
            LI().html(`3: ${data.total.affiliate}`),
            LI().html(`4: ${data.total.go}`),
            LI().html(`5: ${data.total.follow}`),
            LI().html(`6: ${data.pages}`),
            LI().html(`7: ${this.statusAll}`),
        );
    }

    private blockCE() {
        return EL('p').append(
            'Yandex: ',
            Anchor().text(1).href(`?text=host:${this._hostName}`).blank(),
            ', ',
            Anchor().text(2).href(`?text=site:${this._hostName}`).blank(),
            EL('br'),
            'Google: ',
            Anchor().text(1).href(`?q=site%3A${this._hostName}`).blank(),
            ', ',
            Anchor().text(2).href(`?q=site:${this._hostName}%2F%26`).blank(),
        );
    }

    private view() {
        stylePageStat();
        this.container.append(
            EL('h1').text('С'),
            new StatDateSelect().onUpdate(this.onDate.bind(this)),
            this._content
        ).body();
    }
}
