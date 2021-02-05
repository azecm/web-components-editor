import {IEditorData} from "../EditorData";
import {Button, dialog, Div, Input, InputCheckbox} from "element";
import {IAffiliateLinks} from "../editor-const";

export class DialogAffiliateLinks {
    data: IAffiliateLinks;
    editorData: IEditorData;
    elemList = Div();
    items = [] as Item[];

    constructor(editorData: IEditorData) {
        this.data = Object.assign({
            flagFull: false,
            links: []
        }, editorData.nodeUpd.linked || editorData.nodeSrc.linked);
        this.editorData = editorData;
        this.view();
    }

    private add(text: string) {
        const item = new Item(text, this.items);
        this.items.push(item);
        item.elem.lastIn(this.elemList);
    }

    private view() {

        for (const t of this.data.links) {
            this.add(t);
        }

        const form = Div().append(
            Div().append(
                InputCheckbox().bind(this.data, 'flagFull').textRight('все страницы')
            ),
            Div().append(
                Button().text('+').click(() => this.add(''))
            ),
            this.elemList
        );
        dialog().form(form, '<b>Ссылки на магазины</b>').onConfirm(this.confirm.bind(this));
    }

    private confirm() {
        this.data.links = this.items.map(item=>item.text.trim()).filter(text=>!!text);
        this.editorData.nodeUpd.linked = this.editorData.nodeSrc.linked = this.data;
    }
}

class Item {
    elem = Div();
    items: Item[];
    text: string;

    constructor(text: string, items: Item[]) {
        this.text = text;
        this.items = items;
        this.elem.append(
            Input().typeText().bind(this, 'text').selectAllonFocus().style({width: '30em'}),
            Button().text('-').click(this.remove.bind(this))
        );
    }

    private remove() {
        this.elem.remove();
        this.items.splice(this.items.indexOf(this), 1);
    }
}