import {Div, EL, LI} from "element";
import {StatDateSelect} from "./StatDateSelect";
import {connectPostJson} from "api";
import {blockStatus, IStatHost, r, stylePageStat, viewBest, viewTime} from "./StatCommon";
import {StatGraph} from "./StatGraph";
import {statTable} from "./StatTable";

const periodMax = 96;

export class PageLog {
    container = Div().as('page-body');
    private _content = Div().as('page-body').style({marginBottom: '7em'});

    constructor() {
        this.loaded = this.loaded.bind(this);
        this.view();
    }

    private loaded(_data: any) {
        const data = new DataLog(_data.hosts);
        this._content.drop().append(
            EL('h2').text(_data.date),
            blockTop(data),
            blockStatus(data.status, data.statusAll),
            new StatGraph(data.period).container,
            statTable(`Партнерки: ${data.affiliate}`, data.affiliateData, false),
            statTable(`Ссылающиеся сайты: ${data.referer}`, data.refererData, false)
        );
    }

    private onDate(date: string) {
        connectPostJson('log', {date}, this.loaded);
    }

    private view() {
        stylePageStat();
        this.container.append(
            EL('h1').text('Логи'),
            new StatDateSelect().onUpdate(this.onDate.bind(this)),
            this._content
        ).body();
    }
}

function blockTop(data: DataLog) {
    const g0 = viewBest(data.hit, data.user, 0);
    const g1 = viewBest(data.hit, data.user, 1);

    const t0 = viewTime(data.time, data.hit, 0);
    const t1 = viewTime(data.time, data.hit, 1);

    return EL('ul').append(
        LI().html(`Пользователей: <b>${data.user[1]}</b> <small>${data.user[0]}</small>`),
        LI().html(`Просмотров: <b>${data.hit[1]}</b> <small>${data.hit[0]}</small>`),
        LI().html(`Хорошесть:  <b>${g1}</b> <small>${g0}</small>`),
        LI().html(`Время: <b>${t1}</b> <small>${t0}</small>`),
        LI().html(`Трафик вх: ${r(data.amount[0], 'Гб')} исх: ${r(data.amount[1], 'Гб')}`),
        LI().html(`Затраченное время: ${r(data.duration, 'ч')}`),
        LI().html(`Партнерских переходов: ${data.affiliate}`),
        LI().html(`Всего старниц: ${data.pages}`),
        LI().html(`Статусы: ${data.statusAll}`),
    );
}

class DataLog {
    user = [0, 0];
    hit = [0, 0];
    time = [0, 0];
    pages = 0;
    duration = 0;
    amount = [0, 0];

    affiliate = 0;
    referer = 0;

    status = {} as IONumber;
    affiliateData = {} as IONumber;
    refererData = {} as IONumber;

    period = [] as number[][];

    statusAll = 0;

    constructor(data: { [s: string]: IStatHost }) {
        this.init(data);
    }

    private init(data: { [s: string]: IStatHost }) {

        for (let i = 0; i < periodMax; i++) {
            const list = [] as number[];
            this.period.push(list);
            for (let i2 = 0; i2 < 4; i2++) {
                list.push(0);
            }
        }

        const sum = (key: 'user' | 'hit' | 'time' | 'amount', d: IStatHost) => {
            this[key][0] += d[key][0];
            this[key][1] += d[key][1];
        };

        for (const d of Object.values(data)) {
            sum('user', d);
            sum('hit', d);
            sum('time', d);
            sum('amount', d);

            this.duration += d.duration;
            this.pages += d.pages;

            this.affiliate += d.total.affiliate;
            this.referer += d.total.referer;

            for (let i = 0; i < periodMax; i++) {
                for (let i2 = 0; i2 < 4; i2++) {
                    this.period[i][i2] += d.period[i][i2];
                }
            }

            for (const [key, value] of Object.entries(d.status)) {
                if (!this.status[key]) {
                    this.status[key] = 0;
                }
                this.status[key] += value;
                this.statusAll += value;
            }

            for (const [key, value] of Object.entries(d.affiliate.host)) {
                if (!this.affiliateData[key]) {
                    this.affiliateData[key] = 0;
                }
                this.affiliateData[key] += value;
            }

            for (const [key, value] of Object.entries(d.referer)) {
                if (!this.refererData[key]) {
                    this.refererData[key] = 0;
                }
                this.refererData[key] += value;
            }
        }

        const status = {} as { [s: string]: number };
        for (const [k, v] of Object.entries(this.status).sort((a, b) => parseFloat(b[0]) - parseFloat(a[0]))) {
            status[k] = v;
        }
        this.status = status;

    }
}

type IONumber = { [s: string]: number };