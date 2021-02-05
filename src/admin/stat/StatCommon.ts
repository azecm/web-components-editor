import {CSSStyle, LI, UL} from "element";


export function stylePageStat() {
    CSSStyle()
        .add('.page-body', {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        })
        .toHead();
}


export function r(data: number, ext?: 'Гб' | 'ч' | 'мин') {
    switch (ext) {
        case 'Гб':
            data = data / (1024 * 1024 * 1024);
            break;
        case 'ч':
            data = data / 3600;
            break;
        case 'мин':
            data = data / 60;
            break;
        default:
            break;
    }
    return (Math.round(100 * data) / 100).toString() +
        (ext ? ' ' + ext : '');
}

export function viewBest(hit: number[], user: number[], pos: number) {
    return user[pos] > 0 ? r(hit[pos] / user[pos]) : '';
}

export function viewTime(time: number[], hit: number[], pos: number) {
    return hit[pos] > 0 ? r(time[pos] / hit[pos], 'мин') : '';
}

export function blockStatus(data: IONumber, statusAll: number) {
    const view = ([k, v]: [string, number]) => {
        return LI().html(`${k}: ${r(100 * v / statusAll)}% <small>${v}</small>`);
    };
    return UL().append(
        Object.entries(data).map(view)
    );
}

export interface IStatHost {
    user: number[];
    hit: number[];
    time: number[];
    pages: number;
    duration: number;
    amount: number[];
    period: number[][];
    status: IONumber;
    phrase: IONumber;
    referer: IONumber;
    entry: IONumber;
    total: Total;
    follow: Follow;
    affiliate: Affiliate;
    go: Go;
}

type IONumber = { [s: string]: number };

interface Total {
    phrase: number;
    referer: number;
    entry: number;
    follow: number;
    affiliate: number;
    go: number;
}

interface Follow {
    src: IONumber;
    dst: IONumber;
}

interface Go {
    host: IONumber;
    src: IONumber;
    dst: IONumber;
}

interface Affiliate {
    host: IONumber;
    src: IONumber;
    dst: IONumber;
}
