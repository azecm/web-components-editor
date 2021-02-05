import {Div, eventStop} from "element";
import {IEditor} from "../Editor";

export class LabelsComplete {
    opened = false;
    pos = -1;
    container = Div().asNone();
    items = [] as CompleteItem[];

    private readonly _fnComplete: (text: string, idn: number) => void;
    private editor: IEditor;
    constructor(editor: IEditor, fnComplete: (text: string, idn: number) => void) {
        this.close = this.close.bind(this);
        this.click = this.click.bind(this);
        this.editor = editor;
        this._fnComplete = fnComplete;
        this.init();
    }

    private init() {
        for (const [text, ind] of this.editor.data.labelsByText.entries()) {
            this.items.push(new CompleteItem(text, ind, this.editor.data.keywordsCount[ind] || 0, this.click));
        }

        for (const text of this.editor.data.keywordsList) {
            this.items.push(new CompleteItem(text, 0, this.editor.data.keywordsCount[text] || 0, this.click));
        }
        this.items.sort((a, b) => b.count - a.count);
        this.container.append(this.items.map(i => i.elem));
    }

    private click(item: CompleteItem) {
        this.close();
        this._fnComplete(item.text, item.idn);
    }

    private setPos(ind: number) {
        if (this.items[this.pos]) {
            this.items[this.pos].elem.as('selected', false);
        }

        if (this.items[ind]) {
            this.items[ind].elem.as('selected');
            this.pos = ind;
            this.container.el.scrollTop = this.items[ind].elem.el.offsetTop - 60;
        } else if (ind == -1) {
            this.pos = ind;
        }
    }

    move(delta: number) {
        let pos = this.pos + delta;
        while (this.items[pos] && !this.items[pos].active) {
            pos += delta;
        }

        if (this.items[pos]) {
            this.setPos(pos);
        }
    }

    find(text: string) {
        const reText = new RegExp(text, 'i');
        for (const item of this.items) {
            item.setActive(reText.test(item.text));
        }
    }

    open(used: Set<string>) {
        this.opened = true;
        this.setPos(-1);
        this.container.asNone(false);
        this.container.el.scrollTop = 0;

        for (const item of this.items) {
            item.setUsed(used.has(item.text));
        }

        setTimeout(() => {
            window.addEventListener('click', this.close);
        }, 1);
    }

    close() {
        this.opened = false;
        this.container.asNone();
        window.removeEventListener('click', this.close);
    }
}

class CompleteItem {
    elem = Div();
    text: string;
    idn: number;
    count: number;
    used = false;
    active = true;
    private readonly fnClick: (item: CompleteItem) => void;

    constructor(text: string, idn: number, count: number, fnclick: (item: CompleteItem) => void) {
        this.text = text;
        this.idn = idn;
        this.count = count;
        this.fnClick = fnclick;
        this.elem.as('complete-item').attr('data-text', text).click(this.click.bind(this));
    }

    setUsed(flag: boolean) {
        this.active = !flag;
        this.used = flag;
        this.elem.asNone(flag);
    }

    setActive(flag: boolean) {
        if (this.used) return;
        this.active = flag;
        this.elem.asNone(!flag);
    }

    private click(e: Event) {
        eventStop(e);
        this.fnClick(this);
    }
}
