import stylePageKeywords from './PageKeywords.scss';
import {Anchor, Button, CSSStyle, dialog, Div, EL, Input, LI, Span} from "element";
import {connectGetJsonSimple, connectPostJson, siteAdminParam} from "api";
import {KeywordsJSON} from "../../types";

type TypeResult = { message: string, list: number[] }[];

export class PageKeywords {
    container = Div().as('page-body');
    panel = Div().as('keywords-panel');
    list = EL('ol').as('list');

    input1 = Input().typeText();
    input2 = Input().typeText();

    message = EL('p').as('message').append(EL('br'));

    words = [] as WordItem[];

    private elOrderByAmount = Span().text('по количеству').as('order-var');
    private elOrderByAlpha = Span().text('по алфавиту').as('order-var');
    private flagByAmount = true;

    constructor() {
        this.view();
        this.load();
    }

    private load() {
        this.btnReset();
        connectGetJsonSimple('/json/k.json?' + Date.now(), this.loaded.bind(this));
    }

    private loaded(data: KeywordsJSON) {
        const reDgt = /^\d+$/;
        this.words = [];
        for (const [label, count] of Object.entries(data.counter)) {
            if (reDgt.test(label)) continue;
            this.words.push({label, count});
        }
        this.order();
    }

    private order() {
        if (this.flagByAmount) {
            this.words.sort((a, b) => b.count - a.count);
        } else {
            this.words.sort((a, b) => {
                const la = a.label.trim().toLowerCase(), lb = b.label.trim().toLowerCase();
                return la > lb ? 1 : (la < lb ? -1 : 0)
            });
        }
        this.viewList();
    }

    private clickOnItem(e: Event) {
        const elem = e.target as HTMLElement;
        if (!elem.hasAttribute('data-label')) return;
        this.input1.el.value = elem.getAttribute('data-label') || '';
    }

    private clickByAmount() {
        this.flagByAmount = true;
        this.viewOrderElem();
        this.order();
    }

    private clickByAlpha() {
        this.flagByAmount = false;
        this.viewOrderElem();
        this.order();
    }

    private viewOrderElem() {
        this.elOrderByAmount.as('selected', this.flagByAmount);
        this.elOrderByAlpha.as('selected', !this.flagByAmount);
    }

    private viewPanel() {
        this.panel.append(
            EL('h1').text('Список ключевых слов'),
            EL('p').append(
                this.elOrderByAmount.click(this.clickByAmount.bind(this)),
                this.elOrderByAlpha.click(this.clickByAlpha.bind(this))
            ),
            EL('p').append(
                this.input1,
                this.input2
            ),
            EL('p').append(
                Button().text('выполнить').click(this.btnMakeIt.bind(this)),
                Button().text('найти').click(this.btnFindIt.bind(this)),
                Button().text('+').click(this.btnPlus.bind(this)),
                Button().text('-').click(this.btnMinus.bind(this)),
                Button().text('очистить').click(this.btnReset.bind(this)),
            ),
            this.message
        );
    }

    private _disable() {
        for (const btn of Array.from(this.panel.el.getElementsByTagName('button'))) {
            btn.disabled = true;
        }
    }

    private _enable() {
        for (const btn of Array.from(this.panel.el.getElementsByTagName('button'))) {
            btn.disabled = false;
        }
    }

    private btnMakeIt() {
        const from = this.input1.value;
        const to = this.input2.value;
        if (!from || !to) return;

        let msg: string;
        switch (to) {
            case '+':
                msg = 'Добавить?';
                break;
            case '-':
                msg = 'Удалить?';
                break;
            default:
                msg = 'Заменить?';
                break;
        }

        dialog().confirm(msg).onConfirm(() => this._makeItConfirm(from, to));
    }

    private _makeItConfirm(from: string, to: string) {
        this._disable();
        this.message.text('***');
        connectPostJson('keywords', {from, to}, this._makeItResult.bind(this), this._makeItError.bind(this));
    }

    private _makeItError() {
        this._enable();
        this.message.text('ошибка...');
    }

    private _viewResult(data: TypeResult) {
        this.message.drop().append(
            data.map(row => Div().append(
                `<b>${row.message}:</b> `,
                row.list.map(idn =>
                    Anchor().text(idn).blank().href(siteAdminParam.pathEdit(idn))
                )
            ))
        );
    }

    private _makeItResult(_data: string | TypeResult) {
        this._enable();
        if (typeof (_data) == 'string') {
            // страрый вариант ответа
            this.message.html(_data);
        } else {
            this._viewResult(_data);
        }
        this.load();
    }

    private btnFindIt() {
        const text = this.input1.value;
        if (!text) return;
        this._disable();
        this.message.text('...поиск: ' + text);
        connectPostJson('keywords', {find: text}, this.btnFindItLoaded.bind(this), this.btnFindItError.bind(this));
    }

    private btnFindItLoaded(_data: number[] | TypeResult) {
        this._enable();
        if (_data.length && typeof (_data[0]) == 'number') {
            // страрый вариант ответа
            this.message.drop().append(
                (_data as number[]).map(idn => Anchor().text(idn).blank().href(siteAdminParam.pathEdit(idn)))
            );
        } else {
            this._viewResult(_data as TypeResult);
        }
    }

    private btnFindItError() {
        this._enable();
        this.message.text('ошибка при поиске');
    }

    private btnPlus() {
        this.input2.el.value = '+';
    }

    private btnMinus() {
        this.input2.el.value = '-';
    }

    private btnReset() {
        this.input1.el.value = '';
        this.input2.el.value = '';
    }

    private viewList() {
        this.list.drop().append(
            this.words.map(
                item => LI()
                    .attr('data-label', item.label)
                    .text(`${item.label}: ${item.count}`)
            )
        );
    }

    private view() {
        CSSStyle().content(stylePageKeywords).toHead();
        this.viewOrderElem();
        this.viewPanel();
        this.container.append(
            this.list.click(this.clickOnItem.bind(this)),
            this.panel
        ).body();
    }
}


interface WordItem {
    label: string
    count: number
}