import styleDialog from './dialog.scss';
import {Button, CSSStyle, Div, getShadow, IElem} from "./element";
import {edSelection} from "../editor/editor-const";

const dialogList = [] as Dialog[];

const styleSimple = 'simple';
const styleConfirm = 'confirm';

export function dialog() {
    return new Dialog();
}

interface IButton {
    text: string
    type: 'confirm' | 'cancel' | null
    fn?: () => void
}

class Dialog {
    elem = {
        dialog: new ElemDialog(),
        container: Div().as('container'),
        header: Div().as('header'),
        body: Div().as('body'),
        footer: Div().as('footer'),
    };

    private readonly selectionMem: Range | null = null;
    private fnCancel?: () => void;
    private fnConfirm?: () => void;
    private fnCheck?: () => boolean;
    private text = {
        confirm: 'OK', cancel: 'Отмена'
    };
    private _css = '';

    constructor() {
        this._confirm = this._confirm.bind(this);
        this._cancel = this._cancel.bind(this);
        this._open = this._open.bind(this);
        this.close = this.close.bind(this);


        const selection = edSelection.getSelection();
        if (selection && selection.rangeCount) {
            this.selectionMem = selection.getRangeAt(0);
            selection.removeAllRanges();
        }
    }

    private _style() {
        return CSSStyle().content(styleDialog + this._css);
    }

    backLeft(left: number) {
        this.elem.dialog.style.left = left + 'px';
        return this;
    }

    css(text: string) {
        this._css = text;
        return this;
    }

    alert(message: string, title?: string) {
        const {dialog, container, body, footer, header} = this.elem;

        getShadow(dialog, [
            this._style(),
            container.append(
                title ? header.append(title) : null,
                body.as('center').append(message),
                footer.append(Button().as(styleSimple).text(this.text.confirm).click(this._confirm))
            )
        ]);
        setTimeout(this._open, 0);
        return this;
    }

    confirm(message: string, title?: string) {
        const {dialog, container, body, footer, header} = this.elem;
        getShadow(dialog, [
            this._style(),
            container.append(
                title ? header.append(title) : null,
                body.as('center').append(message),
                footer
            )
        ]);
        this.doubleButton();
        setTimeout(this._open, 0);
        return this;
    }

    form(elem: IElem, title?: string) {
        const {dialog, container, body, header, footer} = this.elem;
        getShadow(dialog, [
            this._style(),
            container.append(
                title ? header.append(title) : null,
                body.append(elem),
                footer
            )
        ]);
        this.doubleButton();
        setTimeout(this._open, 0);
        return this;
    }

    buttons(...list: IButton[]) {
        this.elem.footer.drop().append(
            list.map(this._button.bind(this))
        );
        return this;
    }

    private _button(row: IButton) {
        const b = Button().text(row.text);
        if (row.fn) {
            b.click(row.fn);
        }
        switch (row.type) {
            case "cancel":
                b.click(this._cancel).as(styleSimple);
                break;
            case "confirm":
                b.click(this._confirm).as(styleConfirm);
                break;
            default:
                b.as(styleSimple);
                break;
        }
        return b;
    }

    private doubleButton() {
        this.elem.footer.append(
            Button().text(this.text.confirm).click(this._confirm).as(styleConfirm),
            Button().text(this.text.cancel).click(this._cancel).as(styleSimple),
        );
    }

    private _confirm() {
        const checked = this.fnCheck ? this.fnCheck() : true;
        if (checked) {
            this.close();
            if (this.fnConfirm) {
                const fnConfirm = this.fnConfirm;
                setTimeout(() => fnConfirm(), 0);
            }
        }
    }

    private _cancel() {
        this.close();
        if (this.fnCancel) this.fnCancel();
    }

    private _open() {
        document.body.appendChild(this.elem.dialog);
        if (dialogList.length) {
            dialogList[dialogList.length - 1].hide();
        }
        dialogList.push(this);
    }

    private hide() {
        this.elem.dialog.style.display = 'none';
    }

    private show() {
        this.elem.dialog.removeAttribute('style');
    }

    close() {
        this.elem.dialog.remove();
        let i = 0;
        for (const d of dialogList) {
            if (d === this) {
                dialogList.splice(i, 1);
                break;
            }
            i++;
        }
        if (dialogList.length) {
            dialogList[dialogList.length - 1].show();
        } else {
            if (this.selectionMem) {
                const selection = edSelection.getSelection();
                if (selection) {
                    selection.removeAllRanges();
                    selection.addRange(this.selectionMem);
                }
            }
        }
    }

    onCancel(fnCancel: () => void) {
        this.fnCancel = fnCancel;
        return this;
    }

    onConfirm(fnConfirm: () => void) {
        this.fnConfirm = fnConfirm;
        return this;
    }

    onCheck(fnCheck: () => boolean) {
        this.fnCheck = fnCheck;
        return this;
    }
}

class ElemDialog extends HTMLElement {
    static tag = 'elem-dialog';
}

window.customElements.define(ElemDialog.tag, ElemDialog);