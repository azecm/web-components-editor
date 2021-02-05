import {Button, dialog, Div, EL, Input, InputCheckbox} from "element";
import {namesDataParam, namesDataType} from "../editor-const";
import {onCancel} from "./dialog-common";

const shopList = ['1', '2', '3', '4'];
const shopSearch = ['1', '2', '3'];

interface IItem {
    search: boolean
    link: string
    text: string
}

export class DialogShop {
    static type = 'shop';
    elem: HTMLElement;

    data = {
        phrase: '',
        list: [] as IItem[]
    };

    inputPhrase = Input();
    elemItems = Div();
    items = [] as Item[];

    constructor(el: HTMLElement) {
        this.elem = el;
        this.init();
        this.view();
    }

    private init() {
        const paramText = this.elem.getAttribute(namesDataParam);
        if (!paramText) return;
        try {
            this.data = JSON.parse(paramText);
        } catch (e) {
        }
    }

    private addNew() {
        if (!this.items.length && this.data.phrase.trim()) {
            for (const link of shopSearch) {
                this.addItem({search: true, link, text: ''});
            }
        } else {
            this.addItem(null);
        }
    }

    private addItem(row: IItem | null) {
        const item = new Item(row, this.items);
        this.items.push(item);
        item.container.lastIn(this.elemItems);
    }

    private view() {
        const form = Div().append(
            EL('datalist').attr('id', 'shop-options').append(
                shopSearch.map(label => new Option(label))
            ),
            Div().append(
                this.inputPhrase.focus().typeText().bind(this.data, 'phrase')
                    .style({width: '30em'})
                    .placeholder('фраза для поиска')
                    .title('фраза для поиска')
            ),
            this.elemItems.append(
                Button().text('+').click(this.addNew.bind(this))
            )
        );

        for (const itemData of this.data.list) {
            this.addItem(itemData);
        }

        dialog().form(form, '<b>Где...</b>')
            .onCheck(this.onCheck.bind(this))
            .onConfirm(this.onConfirm.bind(this))
            .onCancel(() => onCancel(this.elem));
    }

    private onCheck() {
        let result = true;

        let flagSearch = false;
        for (const item of this.items) {
            let flagFail = false;
            item.text = item.text.trim();
            item.link = item.link.trim();

            if (item.search) {
                flagSearch = true;
                if (item.link.includes('/')) {
                    item.link = item.link.substring(0, item.link.indexOf('/'));
                }
                if (!shopSearch.includes(item.link)) {
                    item.link = '';
                    flagFail = true;
                }
            } else {
                if (!item.link.includes('/')) {
                    flagFail = true;
                }

                let flagHost = false;
                for (const hostName of shopList) {
                    if (item.link.includes(hostName)) {
                        flagHost = true;
                        item.link = item.link.substring(item.link.indexOf(hostName));
                    }
                }
                if (!flagHost) {
                    flagFail = true;
                }
            }
            if (flagFail) {
                result = false;
            }
            item.setFail(flagFail);
        }

        this.data.phrase = this.data.phrase?.trim() ?? '';

        const flagPhrase = flagSearch && !this.data.phrase;
        this.inputPhrase.as('fail', flagPhrase);
        if (flagPhrase) result = false;

        return result;
    }

    private onConfirm() {
        const list = [] as IItem[];
        for (const item of this.items) {
            if (!item.link.trim()) continue;
            list.push({search: item.search, link: item.link, text: item.text});
        }

        if (list.length) {
            this.data.list = list;
            this.elem.setAttribute(namesDataType, DialogShop.type);
            this.elem.setAttribute(namesDataParam, JSON.stringify(this.data));
        } else {
            this.elem.remove();
        }
    }
}

class Item {
    container = Div().as('row');

    search = false;
    link = '';
    text = '';
    private items: Item[];

    constructor(data: IItem | null, items: Item[]) {
        if (data) {
            this.search = data.search;
            this.link = data.link;
            this.text = data.text;
        }

        this.items = items;
        this.view();
    }

    setFail(flag: boolean) {
        this.container.as('fail', flag);
        return this;
    }

    private view() {
        this.container.append(
            InputCheckbox().title('поиск').bind(this, 'search'),
            Input().typeText().bind(this, 'link')
                .placeholder('ссылка')
                .title('ссылка')
                .style({width: '12em'})
                .attr('list', 'shop-options'),
            Input().typeText().bind(this, 'text')
                .placeholder('текст ссылки')
                .title('текст ссылки')
                .style({width: '14em'}),
            Button().text('-').click(this.remove.bind(this))
        );
    }

    private remove() {
        this.container.remove();
        this.items.splice(this.items.indexOf(this), 1);
    }

}