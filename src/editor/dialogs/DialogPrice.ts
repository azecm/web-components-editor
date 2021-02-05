import {namesDataParam, namesDataType} from "../editor-const";
import {dialog, Div, Input, InputCheckbox, TextArea} from "element";
import {onCancel} from "./dialog-common";


export class DialogPrice {
    static type = 'price';
    elem: HTMLElement;

    data = {
        phrase: '',
        tags: '',
        isBook: false,
        soft: false
    };

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
            if(!this.data.soft) this.data.soft = false;
            if(!this.data.isBook) this.data.isBook = false;
            if(!this.data.phrase) this.data.phrase = '';
            if(!this.data.tags) this.data.tags = '';
        } catch (e) {
        }
    }

    private view() {
        // + для уточнения выборки
        // shift+enter несколько выборок с заголовком
        //    / отделение заголовка
        const form = Div().append(
            Div().append(
                TextArea().focus().bind(this.data, 'phrase')
                    .style({width: '30em', boxSizing: 'border-box'})
                    .placeholder('поиск по наименованию')
                    .title('поиск по наименованию')
            ),
            Div().append(
                Input().typeText().bind(this.data, 'tags')
                    .style({width: '29.2em', boxSizing: 'border-box'})
                    .placeholder('поиск по тегам и по наименованию')
                    .title('поиск по тегам и по наименованию')
            ),
            Div().append(
                InputCheckbox().bind(this.data, 'soft').textLeft('мягкий поиск').style({cssFloat: 'right'}),
                InputCheckbox().bind(this.data, 'isBook').textRight('книга')
            )
        );

        dialog().form(form, '<b>Выбор товаров</b>')
            .onConfirm(this.onConfirm.bind(this))
            .onCancel(() => onCancel(this.elem));
    }

    private onConfirm() {
        const {data} = this;
        data.phrase = data.phrase.trim();
        data.tags = data.tags.trim();
        if (data.phrase || data.tags) {
            if (!this.data.soft) delete (this.data.soft);
            if (!this.data.isBook) delete (this.data.isBook);
            if (!this.data.phrase) delete (this.data.phrase);
            if (!this.data.tags) delete (this.data.tags);
            this.elem.setAttribute(namesDataType, DialogPrice.type);
            this.elem.setAttribute(namesDataParam, JSON.stringify(this.data));
        } else {
            this.elem.remove();
        }
    }

}