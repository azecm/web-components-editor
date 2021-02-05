import styleEditableBlock from './EditableBlock.scss';
import {CSSStyle, Div, EL, eventStop, getShadow, isEnterKey} from "element";
import {contentEditable, isEditableNode, namesDataParam, namesDataType, styleCommand} from "../editor-const";
import {dialogImage} from "../dialogs/DialogImage";
import {DialogShop} from "../dialogs/DialogShop";
import {DialogVideo} from "../dialogs/DialogVideo";
import {validatePaste, validateRoot} from "../ValidateHTML";
import {IEditor} from "../Editor";
import {DialogPrice} from "../dialogs/DialogPrice";

export function editableBlock(editor: IEditor, css = '') {
    return new EditableBlock(editor, css);
}

export type IEditableBlock = EditableBlock;

class EditableBlock {
    elem = EL(new EditableBlockElem()).click(this.onEditableClick.bind(this));
    spellcheck = true;
    private _undo = {
        list: [] as string[],
        pos: -1
    };
    private state = {
        timerUndo: 0 as any,
    };
    private _obj!: any;
    private _key!: any;
    private fnTotal?: (total: number) => void;
    elemDoc = Div().attr(contentEditable, 'true')
        .click((this.onClick.bind(this)))
        .on('keydown', this.onKeydown.bind(this))
        .on('drop', this.onDrop.bind(this))
        .on('copy', this.onCopy.bind(this))
        .on('paste', this.onPaste.bind(this))
        .on('blur', this.onBlur.bind(this))

        .on('mouseup', eventStop)
        .on('pointerup', eventStop);

    private config = {attributes: true, childList: true, characterData: true, subtree: true} as MutationObserverInit;
    private observ = new MutationObserver(this.observer.bind(this));
    private readonly editor: IEditor;
    private shadowRoot!: ShadowRoot;

    constructor(editor: IEditor, css: string) {
        this.getSelection = this.getSelection.bind(this);
        this.afterEnterKey = this.afterEnterKey.bind(this);
        this.addUndo = this.addUndo.bind(this);

        this.editor = editor;
        this.spellcheckSwitch();
        this._init(css);
    }

    private _init(css: string) {
        this.shadowRoot = getShadow(this.elem.el, [
            CSSStyle().content(css + styleEditableBlock),
            this.elemDoc
        ]);
    }

    getSelection() {
        return this.shadowRoot.getSelection ? this.shadowRoot.getSelection() : window.getSelection();
    }

    getRange() {
        const selection = this.getSelection();
        return selection && selection.rangeCount ? selection.getRangeAt(0) : null;
    }

    getRangeCommon() {
        const r = this.getRange();
        if (!r || !r.commonAncestorContainer) return null;
        return r.commonAncestorContainer.nodeType != 1
            ? r.commonAncestorContainer.parentNode as HTMLElement
            : r.commonAncestorContainer as HTMLElement;
    }

    getCommonParent(regExp: RegExp) {
        let elemSrc = this.getRangeCommon();
        if (!elemSrc) return null;

        while (elemSrc && !regExp.test(elemSrc.nodeName) && !isEditableNode(elemSrc)) {
            elemSrc = elemSrc.parentNode as HTMLElement;
        }
        if (!elemSrc || !regExp.test(elemSrc.nodeName)) {
            return null;
        }
        return elemSrc;
    }

    setSelectionBeforeNode(node: Node) {
        if (node == null) return;
        const selection = this.getSelection();
        if (selection) {
            const range = document.createRange();
            range.setStartBefore(node);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    private onEditableClick(e: Event) {
        this.elemDoc.el.focus();
        this.onClick(e);
    }

    private observer() {
        clearTimeout(this.state.timerUndo);
        this.state.timerUndo = setTimeout(this.addUndo, 500);
        this.outHTML();
    }

    private addUndo() {
        const {_undo} = this;

        if (_undo.list.length - 1 != _undo.pos) {
            _undo.list = _undo.list.slice(0, _undo.pos + 1);
        }

        _undo.list.push(this.elemDoc.el.innerHTML);
        _undo.pos = _undo.list.length - 1;
    }

    private setHTML(html: string) {
        this.observ.disconnect();
        this.elemDoc.el.innerHTML = html;
        this.outHTML();
        this.observ.observe(this.elemDoc.el, this.config);
    }

    private outHTML() {
        if (!this.elemDoc.el.firstChild) {
            EL('p').append('<br>').lastIn(this.elemDoc);
        }
        this._obj[this._key] = this.elemDoc.el.innerHTML;
        this.viewTotal();
    }

    private viewTotal() {
        if (this.fnTotal) {
            const total = (this.elemDoc.el.textContent || '').replace(/\s/g, '').length;
            this.fnTotal(total);
        }
    }

    private onBlur() {
        validateRoot(this.elemDoc.el);
    }

    private onCopy(_e: Event) {
        const e = _e as ClipboardEvent;
        const elem = this.getRangeCommon();
        if (e.clipboardData && elem && elem.nodeName == 'P' &&
            elem.classList.contains(styleCommand) &&
            elem.hasAttribute(namesDataParam) &&
            elem.hasAttribute(namesDataType)) {

            eventStop(e);
            e.clipboardData.setData(
                'application/json',
                JSON.stringify({
                    command: true,
                    type: elem.getAttribute(namesDataType),
                    param: elem.getAttribute(namesDataParam)
                }));
        }
    }

    private onPaste(_e: Event) {
        const e = _e as ClipboardEvent;
        eventStop(e);
        if (!e.clipboardData) return;

        const textJson = e.clipboardData.getData('application/json');
        if (textJson) {
            const param = JSON.parse(textJson) as { command: boolean, type: string, param: string };
            if (param.command && param.param && param.type) {
                const elem = this.getRangeCommon();
                if (elem && elem.nodeName == 'P' && !elem.innerText.trim()) {
                    elem.className = styleCommand;
                    elem.innerHTML = '<br>';
                    elem.setAttribute(namesDataType, param.type);
                    elem.setAttribute(namesDataParam, param.param);
                }
            }
            return;
        }

        let text = e.clipboardData.getData('text/html');
        if (!text.trim()) {
            text = e.clipboardData.getData('text/plain')
                .replace(/\r/g, '').trim();
            const reBR = /\s*\n\s*/g;
            const reParag = /\s*\n\s*\n\s*/g;
            if (reParag.test(text)) {
                text = text.replace(reParag, '<br></p><p>').replace(reBR, '<br>');
                text = '<p>' + text.trim() + '<br></p>';
            } else if (reBR.test(text)) {
                text = text.replace(reBR, '<br>');
            }
        }
        text = text.trim();
        if (!text) return;

        const div = document.createElement('div');
        text = text
            .replace(/\u00A0/, ' ')
            .replace(/<[\/!]?(html|body|--)[^>]*>\r?\n?/i, '')

            .replace(/«/g, '<q>')
            .replace(/»/g, '</q>')

            .replace(/“/g, '<q>')
            .replace(/”/g, '</q>');
        div.innerHTML = text;

        validatePaste(div);

        document.execCommand('insertHtml', false, div.innerHTML);

        setTimeout(() => validateRoot(this.editor.current.elemDoc.el), 1);
        validateRoot(this.editor.current.elemDoc.el);
    }

    private onDrop(_e: Event) {
        //https://api.dartlang.org/stable/2.5.2/dart-html/Element/dragEvent-constant.html
        //https://github.com/dart-archive/dart-samples/blob/master/html5/web/dnd/basics/basics.dart'

        const e = _e as DragEvent;
        if (e.dataTransfer) {
            const text = e.dataTransfer.getData('text/html');

            if (!text.trim() || /<img/i.test(text)) {
                eventStop(e);
            }
        } else {
            eventStop(e);
        }
    }

    private onKeydown(_e: Event) {
        const e = _e as KeyboardEvent;

        const reTagEnabled = /^(dfn|q|sub|sup|b|i|u|del|em|strong)$/i;

        //console.log('e.code', e.code)
        if (isEnterKey(e) && !e.shiftKey) {
            if (_dialogTest(this.editor, this.getRangeCommon(), false)) {
                e.preventDefault();
            } else {
                setTimeout(this.afterEnterKey, 1);
            }
        } else if (e.code == 'Space' || e.code == 'Period') {
            const range = this.getRange();
            if (range && range.collapsed) {
                const length = (range.commonAncestorContainer as any)?.length;
                console.log('fix::', e.code, length, range.endOffset);
                if (range.endOffset == length) {
                    const commonNode = this.getRangeCommon();
                    //console.log('>>', range, commonNode, reTagEnabled.test(commonNode?.nodeName ?? ''));
                    if (commonNode && reTagEnabled.test(commonNode.nodeName)) {
                        eventStop(e);
                        range.setStartAfter(commonNode);
                        range.insertNode(document.createTextNode(e.code == 'Space' ? ' ' : '.'));
                        range.collapse();
                    }
                }
            }
        } else if (e.shiftKey && e.ctrlKey && e.code == 'KeyL') {
            const range = this.getRange();
            if (range && !range.collapsed) {
                eventStop(e);
                const frag = range.extractContents();
                _walkToLowercase(frag);
                range.insertNode(frag);
            }
        }
    }

    private onClick(e: Event) {
        if (!this.getRange()) return;
        this.editor.setCurrent(this, e as MouseEvent);

        const el = (e.target as HTMLElement).nodeType == 1 ? e.target as HTMLElement : null;

        if (el != null && el.nodeName == 'IMG') {
            dialogImage(this.editor, el as HTMLImageElement, this.editor.userAdmin);
        } else if (!_dialogTest(this.editor, el, true)) {
            this._beforePanelShow();
        }
    }

    spellcheckSwitch() {
        this.spellcheck = !this.spellcheck;
        this.elemDoc.attrRemove('spellcheck').attrRemove(contentEditable);
        if (!this.spellcheck) {
            this.elemDoc.attr('spellcheck', 'false');
        }
        this.elemDoc.attr(contentEditable, 'true');
    }

    undo() {
        const {_undo} = this;
        if (_undo.pos == _undo.list.length - 1) {
            this.addUndo();
        }
        if (_undo.list.length && _undo.pos > 0) {
            this.setHTML(_undo.list[--_undo.pos]);
            this.outHTML();
        }
        return this;
    }

    redo() {
        const {_undo} = this;
        if (_undo.pos < _undo.list.length - 1) {
            this.setHTML(_undo.list[++_undo.pos]);
            this.outHTML();
        }
        return this;
    }

    bind<T, K extends keyof T>(obj: T, key: K, html: string, fnTotal?: (total: number) => void) {
        this._obj = obj;
        this._key = key;
        this.fnTotal = fnTotal;
        this.elemDoc.el.innerHTML = html || '<p><br></p>';
        this.viewTotal();
        this.observ.observe(this.elemDoc.el, this.config);
        this.addUndo();
        return this;
    }

    private afterEnterKey() {
        const elemParag = this.getCommonParent(/^P$/i);
        if (elemParag) {
            for (const el of Array.from(elemParag.querySelectorAll('b,i,em,strong,dfn,del,u,q,sub,sup,a'))) {
                if (!el.textContent) {
                    el.remove();
                }
            }
            if (!elemParag.firstChild) {
                EL('br').lastIn(elemParag);
            }

            for (const attr of Array.from(elemParag.attributes)) {
                elemParag.removeAttribute(attr.name);
            }
        }

        for (const div of Array.from(this.editor.current.elemDoc.el.querySelectorAll('div'))) {
            const parag = document.createElement('p');
            div.before(parag);
            while (div.firstChild) {
                parag.appendChild(div.firstChild);
            }
            div.remove();
            if (!parag.firstChild) {
                EL('br').lastIn(parag);
            }
        }
    }

    private _beforePanelShow() {
        const range = this.getRange();
        if (!range) return;

        let rect = range.getBoundingClientRect();
        if (rect.top == 0 && rect.left == 0) {
            const elCommon = this.getRangeCommon();
            if (elCommon) {
                rect = elCommon.getBoundingClientRect();
            } else {
                return;
            }
        }

        const delta = parseInt(window.getComputedStyle(this.elem.el, null).fontSize || '0', 10) * 1.5;
        const x = rect.left + rect.width / 2;
        const y = rect.top - delta;

        this.editor.panel.position(x, y);

        if (range.collapsed) {
            this.editor.panel.openBlock();
        } else {
            this.editor.panel.openText();
        }
    }
}

class EditableBlockElem extends HTMLElement {
    static tag = 'editable-block';
}

window.customElements.define(EditableBlockElem.tag, EditableBlockElem);

// ===============

function _dialogTest(editor: IEditor, elem: HTMLElement | null, isClick: boolean) {
    if (elem == null) return false;
    let commandKey = '';

    if (elem.nodeName == 'P') {
        if (isClick) {
            if (elem.classList.contains(styleCommand) && elem.hasAttribute(namesDataType) && elem.hasAttribute(namesDataParam)) {
                commandKey = elem.getAttribute(namesDataType) as string;
            }
        } else {
            commandKey = elem.innerText.trim().toLowerCase();
        }
    }

    let flagCommand = false;
    switch (commandKey) {
        case DialogPrice.type:
            new DialogPrice(elem);
            flagCommand = true;
            break;
        //case DialogPrice.type:
        //    new DialogPrice(editor, elem);
        //    flagCommand = true;
        //    break;
        case DialogShop.type:
            new DialogShop(elem);
            flagCommand = true;
            break;
        case DialogVideo.type:
            new DialogVideo(elem);
            flagCommand = true;
            break;
    }
    if (flagCommand) {
        elem.classList.add(styleCommand);
        if (!elem.firstChild || elem.firstChild.nodeName != 'BR') {
            elem.innerHTML = '<br>';
        }
    }
    return flagCommand;
}

function _walkToLowercase(n: Node) {
    let f = n.firstChild;
    while (f) {
        if (f.nodeType == 1) {
            _walkToLowercase(f);
        } else if (f.nodeType == 3 && f.textContent) {
            f.textContent = f.textContent.toLowerCase();
        }
        f = f.nextSibling;
    }
}