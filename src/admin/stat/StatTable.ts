import styleStatTable from './StatTable.scss';
import {EL, getShadow, CSSStyle} from "element";


export function statTable(title: string, data: { [s: string]: number }, closed = true) {
    return new StatTable()._init(title, data, closed);
}
class StatTable extends HTMLElement {
    static tag = 'stat-table';

    private table = EL('table');
    private closed = true;

    _init(title: string, data: { [s: string]: number }, closed = true){
        this.closed = closed;
        this.table.asNone(closed);
        this._viewTable(data);
        this._view(title);
        return this;
    }


    private _click() {
        this.closed = !this.closed;
        this.table.asNone(this.closed);
    }

    private _viewTable(data: { [s: string]: number }) {
        const tbody = EL('tbody').lastIn(this.table);
        const sorted = [...Object.entries(data)].sort((a, b) => b[1] - a[1]);
        for (const [text, val] of sorted) {
            EL('tr').lastIn(tbody).append(
                EL('td').text(text),
                EL('td').text(val)
            );
        }
    }

    private _view(title: string) {
        getShadow(this, [
            CSSStyle().content(styleStatTable),
            EL('h3').text(title).click(this._click.bind(this)),
            this.table
        ]);
    }

}

window.customElements.define(StatTable.tag, StatTable);