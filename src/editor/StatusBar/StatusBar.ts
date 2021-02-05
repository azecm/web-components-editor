import styleStatusBar from './StatusBar.scss';
import {Anchor, Button, CSSStyle, Div, getShadow, Span} from "element";
import {DialogNotice} from "./DialogNotice";
import {DialogNodeStatus} from "./DialogNodeStatus";
import {DialogAffiliateLinks} from "./DialogAffiliateLinks";
import {IEditor} from "../Editor";


class StatusBarTag extends HTMLElement {
    static tag = 'editor-statusbar';
}

window.customElements.define(StatusBarTag.tag, StatusBarTag);

export class EditorStatusBar {
    private elem = {
        container: new StatusBarTag(),
        saved: Div(),
        total: Span(),
        btnStatus: Button()
    };

    private editor: IEditor
    constructor(editor: IEditor) {
        this.total = this.total.bind(this);
        this.updateNodeStatus = this.updateNodeStatus.bind(this);
        this.editor = editor;
    }

    saveError() {
        this.elem.saved.drop().append(
            `ошибка при записи ${new Date().toLocaleTimeString()}`
        );
    }

    saved(url: string) {
        this.elem.saved.drop().append(
            `сохранили ${new Date().toLocaleTimeString()} `,
            Anchor().href(url).text('посмотреть результат').blank()
        );
    }

    total(total: number) {
        this.elem.total.text(total);
    }

    updateNodeStatus(){
        this.elem.btnStatus.as('no-valid', !this.editor.data.nodeSrc.flagValid);
    }

    view(userAdmin: boolean) {
        this.updateNodeStatus();
        getShadow(this.elem.container, [
                CSSStyle().content(styleStatusBar),
                this.elem.saved.as('first'),
                Div().as('second').append(
                    this.elem.total.as('element'),
                    userAdmin ? [
                        Button().text('заметка').as('element').click(this.onNotice.bind(this)),
                        this.elem.btnStatus.text('статус').as('element').click(this.onStatus.bind(this)),
                        Button().text('ссылки').as('element').click(this.onLinks.bind(this))
                    ] : null
                )
            ]
        );

        return this.elem.container;
    }

    private onNotice() {
        new DialogNotice(this.editor.data);
    }

    private onStatus() {
        new DialogNodeStatus(this.updateNodeStatus, this.editor.data);
    }

    private onLinks() {
        new DialogAffiliateLinks(this.editor.data);
    }

}
