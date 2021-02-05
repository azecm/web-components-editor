import {dropNode, reDgt} from "../editor-const";
import {dialog, Div, Input, InputCheckbox} from "element";
import * as punycode from 'punycode';
import {IEditor} from "../Editor";

const attrHref = 'href';
const attrTarget = 'target';
const attrDirect = 'data-d';
const attrTargetBlank = '_blank';

const hrefGotoS = '/gt/s/';
const hrefGoto = '/gt/';
const protocolHTTPS = 'https://';
const protocolHTTP = 'http://';

export function dialogLink(editor:IEditor, elem: HTMLElement | null, userAdmin: boolean) {
    return new DialogLink(editor, elem, userAdmin);
}

class DialogLink {

    elem: HTMLElement | null;
    withDirect: boolean;

    elemImage!: HTMLImageElement;
    src!: string;
    title!: string;
    blank!: boolean;
    direct!: boolean;

    editor:IEditor;

    constructor(editor:IEditor,  elem: HTMLElement | null, userAdmin: boolean) {
        this.editor = editor;
        this.elem = elem;
        this.withDirect = userAdmin;

        if (this.elem && this.elem.nodeName == 'IMG') {
            this.elemImage = elem as HTMLImageElement;
            if (this.elem.parentNode?.nodeName == 'A') {
                this.elem = this.elem.parentNode as HTMLElement;
            } else {
                this.elem = null;
            }
        }
        this._init();
    }

    private _init() {
        if (this.elem == null) {
            this.title = '<b>Введите ссылку</b>';
            this.blank = false;
            this.direct = false;
            this.src = protocolHTTP;
        } else {
            this.title = '<b>Свойства ссылки</b>';
            this.src = this.elem.getAttribute(attrHref) + '';
            this.blank = this.elem.hasAttribute(attrTarget) && this.elem.getAttribute(attrTarget) == attrTargetBlank;
            this.direct = this.elem.hasAttribute(attrDirect);

            if (reDgt.test(this.src)) {

            } else {

                if (this.src.startsWith(hrefGotoS)) {
                    this.src = protocolHTTPS + this.src.substring(hrefGotoS.length);
                } else if (this.src.startsWith(hrefGoto)) {
                    this.src = protocolHTTP + this.src.substring(hrefGoto.length);
                } else if (this.src.startsWith('/')) {
                    const location = window.location;
                    this.src = location.protocol + '//' + location.hostname + this.src;
                }

                let url: URL | undefined;
                try {
                    url = new URL(this.src);
                } catch (e) {
                }

                if (url) {
                    this.src = url.protocol + '//' + punycode.toUnicode(url.hostname) + (url.pathname.split('/').map(v => decodeURIComponent(v)).join('/'));
                    if (url.search) {
                        this.src += decodeURIComponent(url.search);
                    }
                    if (url.hash) {
                        this.src += decodeURIComponent(url.hash);
                    }
                }
            }
        }

        this.view();
    }

    private view() {
        const form = Div().append(
            Div().append(
                Input().typeText()
                    .bind(this, 'src')
                    .placeholder('Ссылка')
                    .valueSelect()
                    .style({width: '35em', maxWidth: '100%', boxSizing: 'border-box'})
            ),
            Div().append(
                this.withDirect ? InputCheckbox().bind(this, 'direct').textRight('прямая ссылка').style({cssFloat: 'right'}) : null,
                InputCheckbox().bind(this, 'blank').textLeft('в новом окне')
            )
        );

        dialog().form(form, this.title).onConfirm(this.confirm.bind(this));
    }

    private confirm() {
        this.src = this.src.trim();
        if (!this.src.trim()) {
            if (this.elem) {
                dropNode(this.elem);
            }
            return;
        }

        if(!reDgt.test(this.src)) {
            const location = window.location;
            if (this.src.startsWith('//')) {
                this.src = location.protocol + this.src;
            } else if (this.src.startsWith('/')) {
                this.src = location.protocol + '//' + location.hostname + this.src;
            }

            let url: URL | undefined;
            try {
                url = new URL(this.src);
            }
            catch (e) { }

            if (url) {
                if (url.hostname == location.hostname) {
                    this.src = url.pathname + url.search + url.hash;
                }
                else {
                    if (decodeURIComponent(url.hostname) != url.hostname) {
                        url.hostname = punycode.encode(decodeURIComponent(url.hostname));
                    }

                    this.src = url.toString();
                    const pos = this.src.indexOf('//') + 2;
                    this.src = (this.src.startsWith(protocolHTTPS) ? hrefGotoS : hrefGoto) + this.src.substr(pos);
                }
            }
        }

        if (!this.elem) {
            if (this.elemImage) {
                this.elem = document.createElement('a');
                this.elemImage.parentNode?.insertBefore(this.elem, this.elemImage);
                this.elem.append(this.elemImage);
            } else {
                const r = this.editor.current.getRange();
                if (r) {
                    this.elem = document.createElement('a');
                    this.elem.append(r.extractContents());
                    r.deleteContents();
                    r.insertNode(this.elem);
                }
            }
        }

        if (this.elem) {
            this.elem.setAttribute(attrHref, this.src);
            this.elem.removeAttribute(attrTarget);
            this.elem.removeAttribute(attrDirect);
            if (this.blank) {
                this.elem.setAttribute(attrTarget, attrTargetBlank);
            }
            if (this.direct) {
                this.elem.setAttribute(attrDirect, '');
            }
        }
    }
}

