import {Button, CSSStyle, em, getShadow, Input} from "element";

export class StatDateSelect extends HTMLElement {
    static tag = 'stat-tools';

    private _date!: string;
    private _dateTime = new Date();
    private _input = Input().typeDate();
    private _fn!: (date: string) => void;
    private _timer: any;


    constructor() {
        super();

        this.emit = this.emit.bind(this);

        setTimeout(() => {
            this._prev();
            this._view();
        }, 0)
    }

    onUpdate(fn: (date: string) => void) {
        this._fn = fn;
        return this;
    }

    private _testDate() {
        if (this._dateTime.getTime() > Date.now()) {
            this._dateTime = new Date();
        }
    }

    private _dateUpdate() {
        this._testDate();
        const prevDate = this._date;
        this._date = this._input.el.value = this._dateTime.toISOString().substring(0, 10);
        if (prevDate != this._date && this._fn) {
            clearTimeout(this._timer);
            this._timer = setTimeout(this.emit, 300);
        }
    }

    private emit() {
        this._fn(this._date);
    }

    private _prev() {
        addDays(this._dateTime, -1);
        this._dateUpdate();
    }

    private _next() {
        addDays(this._dateTime, 1);
        this._dateUpdate();
    }

    private _onInput() {
        const d = this._input.el.valueAsDate;
        if (d) this._dateTime = d;
        this._dateUpdate();
    }

    private _view() {
        getShadow(this, [
            CSSStyle().addHost({display: 'flex', margin: em(1,0)}),
            Button().html('&lt;').click(this._prev.bind(this)),
            this._input.onInput(this._onInput.bind(this)),
            Button().html('&gt;').click(this._next.bind(this))
        ]);
    }
}

function addDays(d: Date, val: number) {
    d.setHours(d.getHours() + 24 * val);
}

window.customElements.define(StatDateSelect.tag, StatDateSelect);


