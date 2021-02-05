export const styleSelected = 'selected';
export const styleCommand = 'command';


export const contentEditable = 'contenteditable';

export const namesDataType = 'data-type';
export const namesDataParam = 'data-param';
export const namesDataOmit = 'data-omit';

export const reDgt = /^\d+$/;
export const reSrc = /\/file\/(\d{4})\/(?:(150|250|600)\/)?(\d{4})\.(jpg|png|svg)/i;
export const reIsImage = /\.(jpg|png|svg)$/i;
const reIsImageJPEG = /\.(jpg|jpeg)$/i;

export function getElement(node: Node) {
    return node.nodeType != 1 ? node.parentNode as Element : node as Element;
}

export enum EFileType {
    none, image, audio, video
}

export function getFileType(src: string) {
    let res = EFileType.none;

    if (src) {
        if (reIsImage.test(src) || reIsImageJPEG.test(src)) {
            res = EFileType.image;
        } else if (src.endsWith('.mp3')) {
            res = EFileType.audio;
        } else if (src.endsWith('.mp4')) {
            res = EFileType.video;
        }
    }
    return res;
}

export function getSrcKey(src: string) {
    const m = src.match(reSrc);
    return m ? m[1] + '/' + m[3] + '.' + m[4] : null;
}

export function getSrcSize(src: string) {
    const m = src.match(reSrc);
    return m && m[2] ? parseInt(m[2], 10) as 150 | 250 | 600: null;
}

export function getSrcByAttach(attach: IAttach, size: null | 150 | 250 | 600) {
    let src = '';
    if (attach.src) {
        src = getSrcByKey(attach.src, size);
    }
    return src;
}

export function getSrcByKey(src: string, size: null | 150 | 250 | 600) {
    if (src.endsWith('.svg') || !size) {

    } else {
        src = src.replace('/', '/' + size + '/');
    }
    src = '/file/' + src;
    return src;
}



// ==============

type TSelection = ()=>Selection|null;
class EditorSelection{
    private fnSelection!:TSelection;
    constructor() {
        this.fnSelection = ()=>window.getSelection();
    }
    getSelection(){
        return this.fnSelection ? this.fnSelection() : null;
    }
    setFnSelection(fnSelection:TSelection){
        this.fnSelection = fnSelection;
    }
}
export const edSelection = new EditorSelection();
/*
export function getRange() {
    const selection = edSelection.getSelection();
    return selection && selection.rangeCount ? selection.getRangeAt(0) : null;
}
export function getRangeCommon() {
    const r = getRange();
    if (r == null || r.commonAncestorContainer == null) return null;
    return r.commonAncestorContainer.nodeType != 1
        ? r.commonAncestorContainer.parentNode as HTMLElement
        : r.commonAncestorContainer as HTMLElement;
}
export function getCommonParent(regExp: RegExp) {
    let elemSrc = getRangeCommon();
    if (!elemSrc) return null;

    while (elemSrc != null && !regExp.test(elemSrc.nodeName) && !isEditableNode(elemSrc)) {
        elemSrc = elemSrc.parentNode as HTMLElement;
    }
    if (elemSrc == null || !regExp.test(elemSrc.nodeName)) {
        return null;
    }
    return elemSrc;
}
export function setSelectionBeforeNode(node: Node) {
    if (node == null) return;
    const selection = window.getSelection();
    if (selection) {
        const range = document.createRange();
        range.setStartBefore(node);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}
*/
// ==============

export function isEditableNode(node: HTMLElement) {
    return node.hasAttribute(contentEditable)
}

export function dropNode(elem: Node) {
    if (!elem) return;
    const parent = elem.parentNode;
    if (parent != null) {
        while (elem.firstChild != null) {
            parent.insertBefore(elem.firstChild, elem);
        }
        parent.removeChild(elem);
    }
}

export function moveChildren(nodeSrc: Node, nodeTarget: Node) {
    while (nodeSrc.firstChild != null) {
        nodeTarget.appendChild(nodeSrc.firstChild);
    }
}

export function nodeBefore(tagName: string, nodeSrc: Node) {
    const elemTarget = document.createElement(tagName);
    nodeSrc.parentNode?.insertBefore(elemTarget, nodeSrc);
    return elemTarget;
}

export function attrClass(elem: HTMLElement) {
    if (elem.hasAttribute('class') && !elem.className) {
        elem.removeAttribute('class')
    }
}

export function imageResized(e: Event) {
    const img = e.target as HTMLImageElement;
    img.removeEventListener('load', imageResized);
    img.setAttribute('width', img.naturalWidth + '');
    img.setAttribute('height', img.naturalHeight + '');
}

export interface INode {
    idp?: number; // у новых статей
    idn: number;
    title: string;
    searchPhrase: string;
    descr: string;
    content: string;
    linkText: string;
    linkPath: string;
    folder: string;
    flagValid: boolean;
    flagBlock: boolean;
    flagBook: boolean;
    labels: number[];
    keywords: string[];
    attach?: IAttach[];

    linked: IAffiliateLinks
    notice: INodeNotice;
}

export interface IAffiliateLinks {
    links: string[];
    flagFull: boolean;
}

export interface INodeNotice {
    date: string
    message: string
    email: string
}

export interface IAttach {
    idf: number;
    content: string;
    src: string;
    like: number;
    flagNode: boolean;
    flagCatalog: boolean;
    flagComment: boolean;
    group?: number[];
    quiz: string;
}
