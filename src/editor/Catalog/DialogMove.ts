import {ICatalogItem} from "./CatalogItem";
import {dialog, Div, Input} from "element";


export class DialogMove {
    item: ICatalogItem;
    prev: number;
    pos: number;
    max: number;

    constructor(item: ICatalogItem) {
        this.item = item;
        this.max = this.item.catalog.items.length;
        this.pos = this.prev = this.item.catalog.items.indexOf(this.item) + 1;
        this.view();
    }

    private view() {
        const form = Div().append(
            Input().bind(this, 'pos')
                .min(1)
                .step(1)
                .max(this.max)
                .type('number')
                .style({boxSizing: 'border-box', width: '100%'})
        );
        dialog().form(form, '<b>Порядковый номер</b>').onConfirm(this.onConfirm.bind(this));
    }

    private onConfirm() {
        if (this.pos < 1) this.pos = 1;
        if (this.pos > this.max) this.pos = this.max;
        if (this.pos == this.prev) return;

        this.item.remove();
        if (this.pos == this.max) {
            this.item.elem.container.lastIn(this.item.catalog.elem.items);
            this.item.catalog.items.push(this.item);
        } else {
            const pos = this.pos - 1;
            this.item.elem.container.beforeThat(this.item.catalog.items[pos].elem.container);
            this.item.catalog.items.splice(pos, 0, this.item);
        }

        if (this.item.flagNode) {
            this.item.catalog.editor.sidebar.updateArticleImages();
        }

        this.item.catalog.editor.data.catalogMove(this.item.idf, this.pos);
    }
}