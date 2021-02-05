import {dialog, Div, Input} from "element";
import {onCancel} from "./dialog-common";
import {namesDataParam, namesDataType} from "../editor-const";

const youtube = 'watch?v=';

export class DialogVideo {
    static type = 'video';
    elem: HTMLElement;
    link = '';
    constructor(el: HTMLElement) {
        this.elem = el;
        this.init();
        this.view();
    }

    private init() {
        if (this.elem.hasAttribute(namesDataParam)) {
            this.link = youtube + this.elem.getAttribute(namesDataParam);
        }
    }

    private view() {
        const form = Div().append(
            Input().bind(this, 'link').valueSelect().typeText().placeholder('youtube').title('ссылка на видео').style({width: '25em'})
        );
        dialog().form(form, '<b>Свойства видео</b>')
            .onConfirm(this.onConfirm.bind(this))
            .onCancel(() => onCancel(this.elem));
    }

    private onConfirm() {
        let uri: URL | undefined;
        try {
            uri = new URL(this.link);
        } catch (e) {
        }

        if (!uri || !uri.hostname.includes('you') || !uri.searchParams || !uri.searchParams.get('v')) {
            this.elem.remove();
            return;
        }

        this.elem.setAttribute(namesDataType, DialogVideo.type);
        this.elem.setAttribute(namesDataParam, uri.searchParams.get('v') || '');
    }
}