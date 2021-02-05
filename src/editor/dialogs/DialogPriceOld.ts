import {Button, dialog, Div, EL, GroupCheckbox, Input, InputCheckbox} from "element";
import {namesDataParam, namesDataType} from "../editor-const";
import {onCancel} from "./dialog-common";
import {IEditor} from "../Editor";


export class DialogPriceOld {

    static type = 'price-old';

    elem: HTMLElement;

    data = {
        name: '',
        order: '',
        orient: 'h',
        price: 0
    };

    items = [] as Item[];
    elemItems = Div();
    editor: IEditor;
    constructor(editor: IEditor, el: HTMLElement) {
        this.elem = el;
        this.editor = editor;
        this.init();
        this.view();
    }

    private init() {
        const paramText = this.elem.getAttribute(namesDataParam);
        if (!paramText) return;

        let param = {} as ISourceData;
        try {
            param = JSON.parse(paramText);
        } catch (e) {
        }

        const {data} = this;
        data.name = this.editor.data.labelsByIdn.get(param.idn) as string || '';
        data.price = param.min || 0;
        data.order = param.order || '';
        data.orient = param.orient || 'h';

        if (param.keys) {
            for(const text of param.keys){
                this.items.push(new Item(text, this.items));
            }
        }
    }

    private newItem() {
        const item = new Item('', this.items);
        this.items.push(item);
        item.elem.lastIn(this.elemItems);
    }

    private view() {
        const list = Array.from(this.editor.data.labelsLinked)
            .map(
                idn => this.editor.data.labelsByIdn.get(idn)
            );
        list.sort();

        const form = Div().append(
            Div().append(
                Input()
                    .focus()
                    .style({width: '30em'})
                    .typeText()
                    .bind(this.data, 'name')
                    .attr('list', 'list-labels')
                    .placeholder('наименование ключевика')
                    .title('наименование ключевика'),
                EL('datalist').attr('id', 'list-labels').append(
                    list.map(text => new Option(text))
                )
            ),
            Div().append(
                GroupCheckbox().setOptions(
                    InputCheckbox().value('').textRight('случайно'),
                    InputCheckbox().value('desc').textRight('по убыванию'),
                    InputCheckbox().value('asc').textRight('по возрастанию')
                ).bind(this.data, 'order')
            ),
            Div().append(
                GroupCheckbox().setOptions(
                    InputCheckbox().value('h').textRight('горизонтально'),
                    InputCheckbox().value('v').textRight('вертикально')
                ).bind(this.data, 'orient')
            ),
            Div().append(
                Input().type('number').bind(this.data, 'price').min(0).step(1).title('минимальная цена').style({width: '7em'})
            ),
            this.elemItems.append(
                Button().text('+').click(this.newItem.bind(this)),
                this.items.map(item => item.elem)
            )
        );
        dialog().form(form, '<b>Настройка списка товаров</b>')
            .onConfirm(this.onConfirm.bind(this))
            .onCancel(()=>onCancel(this.elem));
    }

    private getIdn(){
        const idn = this.editor.data.labelsByText.get(this.data.name);
        if (!idn) {
            this.elem.remove();
            return null;
        }
        return idn;
    }

    private onConfirm() {
        const idn = this.getIdn();
        if(!idn) return;

        const keys = [] as string[];
        for (const item of this.items) {
            const t = item.text.trim();
            if (t) {
                keys.push(t);
            }
        }

        const {data} = this;
        const param = {idn, orient: data.orient} as ISourceData;
        if (data.order) param.order = data.order as any;
        if (data.price) param.min = data.price as any;
        if (keys.length) param.keys = keys;

        this.elem.setAttribute(namesDataType, DialogPriceOld.type);
        this.elem.setAttribute(namesDataParam, JSON.stringify(param));
    }
}

class Item {
    elem = Div();
    text = '';
    private items: Item[];

    constructor(text: string, items: Item[]) {
        this.items = items;
        this.text = text;
        this.elem.append(
            Input().typeText().style({width: '25em'}).bind(this, 'text'),
            Button().text('-').click(this.remove.bind(this))
        );
    }

    private remove() {
        this.elem.remove();
        this.items.splice(this.items.indexOf(this), 1);
    }
}

interface ISourceData {
    idn: number
    orient: 'h' | 'v'
    order: '' | 'desc' | 'asc'
    min: number
    keys: string[]
}