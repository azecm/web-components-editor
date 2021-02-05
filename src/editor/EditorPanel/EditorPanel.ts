import styleEditorPanel from './EditorPanel.scss';
import {Button, CSSStyle, Div, EL, eventStop, getShadow, IElemButton} from "element";
import {PanelPath} from "./PanelPath";
import {icons} from "./icons";
import {
    attrClass,
    dropNode,
    getElement,
    moveChildren,
    nodeBefore,
    styleSelected
} from "../editor-const";
import {dialogLink} from "../dialogs/DialogLink";
import {validateRoot} from "../ValidateHTML";
import {IEditor} from "../Editor";

const styleClear = 'clear-both';
const reFontButton = /^font-(\w+)\.?(\w+)?$/;
const reTagBlockAlign = /^(p|h[\d]|blockquote)$/i;
const reRootBlock = /^p|h\d|ol|ul|blockquote$/i;

export class EditorPanel {
    elem = EL(new EditorPanelElem()).asNone();
    elemBlock = Div();
    elemText = Div();
    path = new PanelPath();
    elemButtonSpell!: IElemButton;
    elemButtonClear!: IElemButton;

    private _closeTimer: any;
    private _css = CSSStyle();
    private readonly editor: IEditor;

    constructor(editor: IEditor) {
        this.stopClose = this.stopClose.bind(this);
        this._beforeClose = this._beforeClose.bind(this);
        this.hide = this.hide.bind(this);
        this.onButton = this.onButton.bind(this);
        this.editor = editor;

        this.elem
            .onLeave(this._beforeClose)
            .onEnter(this.stopClose);
    }

    private onCloser(e: Event) {
        eventStop(e);
        this.hide();
    }

    hide() {
        this.elem.asNone();
    }

    position(x: number, y: number) {
        this.elem.style({top: y + 'px', left: x + 'px'});
    }

    openBlock() {
        this.elemBlock.asNone(false);
        this.elemText.asNone();
        this._afterOpen();
    }

    openText() {
        this.elemBlock.asNone();
        this.elemText.asNone(false);
        this._afterOpen();
    }

    private _afterOpen() {
        this.elem.asNone(false);

        const elemHost = this.elem.el;
        const oLeft = elemHost.offsetLeft;
        const oMid = elemHost.offsetWidth / 2;
        const clientWidth = document.documentElement.clientWidth;
        if (oLeft - oMid < 0) {
            elemHost.style.left = `${oMid}px`;
        } else if (oLeft + oMid > clientWidth) {
            elemHost.style.left = `${clientWidth - oMid}px`;
        }

        const oTop = elemHost.offsetTop;
        const oHeight = elemHost.offsetHeight;
        if (oTop < oHeight) {
            elemHost.style.top = `${oHeight}px`;
        }

        this._beforeClose();
        this.path.update(this.editor.current);
        this.btnClearBothState();
        this.btnSpellState();
    }

    private btnSpellState() {
        this.elemButtonSpell.as(styleSelected, this.editor.current.spellcheck);
    }

    private btnClearBothState() {
        const elemClear = this.editor.current.getCommonParent(reTagBlockAlign);
        let flag = false;
        if (elemClear != null) {
            if (elemClear.classList.contains(styleClear)) {
                flag = true;
            }
        }
        this.elemButtonClear.as(styleSelected, flag);
    }

    private toolClearBoth() {
        const elemSrc = this.editor.current.getCommonParent(reTagBlockAlign);
        if (!elemSrc) return;
        elemSrc.classList.toggle(styleClear);
        attrClass(elemSrc);
        this.btnClearBothState();
    }

    private stopClose() {
        clearTimeout(this._closeTimer);
    }

    private _beforeClose() {
        clearTimeout(this._closeTimer);
        this._closeTimer = setTimeout(this.hide, 2000);
    }

    private viewButton(key: string) {
        const button = Button().as('icon').attr('data-key', key);

        switch (key) {
            case 'spell':
                this.elemButtonSpell = button;
                break;
            case 'clear':
                this.elemButtonClear = button;
                break;
        }

        const data = icons.get(key);
        if (data) {
            button.title(data.title).append(data.icon);
            switch (key) {
                case 'bold':
                case 'italic':
                case 'underline':
                case 'quote':
                    button.as('height-min');
                    break;
            }
        } else {

            const m = key.match(reFontButton);
            if (m) {
                const tag = m[1];
                const tagClass = m[2];
                button.append(EL(tag).as(tagClass).text('Аб'));
            }
        }

        return button;
    }

    setCSS(css: string){
        this._css.el.textContent+=css;
        return this;
    }

    private viewLine(keys: string[]) {
        return Div().as('buttons-line').append(
            keys.map(k => this.viewButton(k))
        );
    }

    view() {
        getShadow(this.elem.el, [
            this._css.content(styleEditorPanel),
            Div().as('closer').click(this.onCloser.bind(this)),
            this.path.container,
            this.path.menu.container,
            this.elemBlock.click(this.onButton).onDown(eventStop).append(
                this.viewLine(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ol', 'ul', 'blockquote']),
                this.viewLine(['save', 'spell', 'clear', 'align-left', 'align-center', 'align-right', 'align-justify', 'hr', 'undo', 'redo'])
            ),
            this.elemText.click(this.onButton).onDown(eventStop).append(
                this.viewLine(['font-strong', 'font-strong.attention', 'font-strong.notice', 'font-em', 'font-em.attention', 'font-em.notice', 'dfn', 'ul', 'eraser']),
                this.viewLine(['bold', 'italic', 'underline', 'strike', 'quote', 'sub', 'sup', 'link', 'unlink'])
            )
        ]);
    }

    private onButton(e: Event) {
        eventStop(e);
        const el = e.target as HTMLElement;
        if (!el.hasAttribute('data-key')) {
            return;
        }

        const key = el.getAttribute('data-key');
        switch (key) {
            case 'spell':
                this.editor.current.spellcheckSwitch();
                this.btnSpellState();
                break;
            case 'bold':
            case 'italic':
            case 'underline':
            case 'strike':
            case 'quote':
            case 'sub':
            case 'sup':
            case 'dfn':
                toolText(this.editor, key);
                break;
            case 'font-strong':
            case 'font-strong.attention':
            case 'font-strong.notice':
            case 'font-em':
            case 'font-em.attention':
            case 'font-em.notice': {
                const m = key.match(reFontButton);
                if (m) {
                    const tag = m[1];
                    const tagClass = m[2];
                    toolText(this.editor, tag, tagClass);
                }
                break;
            }
            case 'eraser':
                document.execCommand('RemoveFormat', false, '');
                break;
            case 'ol':
            case 'ul':
            case 'p':
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
            case 'blockquote':
                toolBlock(key, this.editor);
                this.path.update(this.editor.current);
                break;
            case 'clear':
                this.toolClearBoth();
                break;
            case 'align-left':
            case 'align-center':
            case 'align-right':
            case 'align-justify':
                toolAlign(this.editor, key);
                break;
            case 'hr':
                toolHR(this.editor);
                break;
            case 'link':
                toolLink(this.editor, this.editor.userAdmin);
                break;
            case 'unlink':
                toolUnlink(this.editor);
                break;
            case 'save':
                validateRoot(this.editor.current.elemDoc.el);
                this.editor.data.save();
                break;
            case 'undo':
                this.editor.current.undo();
                break;
            case 'redo':
                this.editor.current.redo();
                break;
        }
    }

}

class EditorPanelElem extends HTMLElement {
    static tag = 'editor-panel';
}

window.customElements.define(EditorPanelElem.tag, EditorPanelElem);

// =============

const toolTextMap = new Map([
    ['bold', 'b'],
    ['italic', 'i'],
    ['underline', 'u'],
    ['strike', 'del'],
    ['quote', 'q']
]);

function toolHR(editor: IEditor) {
    const elemParent = editor.current.getCommonParent(reRootBlock);
    if (!elemParent) return;
    elemParent.parentNode?.insertBefore(document.createElement('hr'), elemParent);
}

function toolAlign(editor: IEditor, key: string) {
    const elemSrc = editor.current.getCommonParent(reTagBlockAlign);
    if (!elemSrc) return;

    const align = key.substring(6);
    const classList = elemSrc.classList;
    if (classList.contains(align)) {
        classList.remove(align);
    } else {
        classList.remove('left');
        classList.remove('center');
        classList.remove('right');
        classList.remove('justify');
        classList.add(align);
    }
    attrClass(elemSrc);
}

function toolText(editor: IEditor, tagName: string, className?: string) {
    if (toolTextMap.has(tagName)) {
        tagName = toolTextMap.get(tagName) as string;
    }

    const elemTag = editor.current.getCommonParent(new RegExp('^' + tagName + '$', 'i'));
    if (elemTag == null) {
        const range = editor.current.getRange();
        if (!range) return;
        const newNode = document.createElement(tagName);
        if (className != null) {
            newNode.classList.add(className);
        }
        newNode.append(range.extractContents());
        range.insertNode(newNode);
    } else {
        const selection = editor.current.getSelection();
        if (!selection) return;
        const range = document.createRange();
        range.selectNode(elemTag);
        selection.removeAllRanges();
        selection.addRange(range);
        dropNode(elemTag);
    }
}

function toolBlock(tagName: string, editor:IEditor) {
    const range = editor.current.getRange();
    if (!range) return;
    const reList = /^ol|ul$/i;
    const flagTrgList = reList.test(tagName);

    if (range.collapsed) {
        const elemSrc = editor.current.getCommonParent(reRootBlock);
        if (!elemSrc) return;

        const elemRef = document.createElement('span');
        range.insertNode(elemRef);

        const flagSrcList = reList.test(elemSrc.nodeName);

        if ((!flagSrcList && !flagTrgList) || (flagSrcList && flagTrgList)) {
            moveChildren(elemSrc, nodeBefore(tagName, elemSrc));
        } else if (flagSrcList) {
            while (elemSrc.firstChild != null) {
                const nodeChild = elemSrc.firstChild;
                if (nodeChild.nodeName == 'LI') {
                    moveChildren(nodeChild, nodeBefore(tagName, elemSrc));
                }
                elemSrc.firstChild.remove();
            }
        } else if (flagTrgList) {
            const elemTarget = nodeBefore(tagName, elemSrc);
            const elemLi = document.createElement('li');
            elemTarget.append(elemLi);
            moveChildren(elemSrc, elemLi);
        }

        if (elemSrc.firstChild === null) {
            elemSrc.remove();
        }
        editor.current.setSelectionBeforeNode(elemRef);
        elemRef.remove();
    } else {

        if (flagTrgList) {
            let elemParent: HTMLElement | undefined;
            const reFrom = /^p|h\d$/i;
            let child = editor.current.elemDoc.el.firstChild as Node;
            while (child) {
                const current = child;
                child = child.nextSibling as Node;
                if (current.nodeType === 1) {
                    if (range.isPointInRange(current, 0) ||
                        range.isPointInRange(current, current.childNodes.length) &&
                        reFrom.test(current.nodeName)) {
                        const elemSrc = current;
                        if (!elemParent) {
                            elemParent = document.createElement(tagName);
                            elemSrc.parentNode?.insertBefore(elemParent, elemSrc);
                        }
                        const elemLi = document.createElement('li');
                        elemParent.append(elemLi);
                        moveChildren(elemSrc, elemLi);
                        current.parentNode?.removeChild(current);
                    }
                }
            }
        }
    }
}

function toolLink(editor: IEditor, userAdmin: boolean) {
    const elemLink = editor.current.getCommonParent(/^a$/i);
    dialogLink(editor, elemLink, userAdmin);
}

function toolUnlink(editor: IEditor) {
    const range = editor.current.getRange();
    if (!range) return;

    const remove = [] as Element[];
    for (const elem of [
        getElement(range.startContainer),
        getElement(range.commonAncestorContainer),
        getElement(range.endContainer)
    ]) {
        if (elem.nodeName == 'A') {
            remove.push(elem);
        }
    }

    const frag = range.extractContents();
    for (const link of Array.from(frag.querySelectorAll('a'))) {
        dropNode(link);
    }
    range.insertNode(frag);

    for (const link of remove) {
        dropNode(link);
    }
}