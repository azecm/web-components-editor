import {dropNode, namesDataOmit, namesDataParam, namesDataType, reDgt, reSrc} from "./editor-const";

const blockClass = ['left', 'right', 'center', 'justify',];

// 'command', 'like'
const attrClass = 'class';
const attrTarget = 'target';
const hrefPref = location.protocol + '//' + location.hostname;

const tags = new Map<string, { attrs?: string[], class?: string[], fn?: any } | null>([
    ['p', {attrs: [attrClass, 'data-like', namesDataType, namesDataParam], class: [...blockClass, 'command', 'like']}],
    ['ol', null],
    ['ul', null],
    ['li', null],
    ['h1', {attrs: [attrClass], class: blockClass}],
    ['h2', {attrs: [attrClass], class: blockClass}],
    ['h3', {attrs: [attrClass], class: blockClass}],
    ['h4', {attrs: [attrClass], class: blockClass}],
    ['h5', {attrs: [attrClass], class: blockClass}],
    ['h6', {attrs: [attrClass], class: blockClass}],
    ['blockquote', {attrs: [attrClass], class: ['col3r', 'col3l']}],

    ['hr', null],
    ['br', null],
    ['dfn', null],
    ['q', null],
    ['sub', null],
    ['sup', null],
    ['b', null],
    ['i', null],
    ['u', null],
    ['del', null],

    ['img', {
        attrs: ['width', 'height', 'alt', 'src', 'class', namesDataType, namesDataParam, namesDataOmit],
        class: ['imgr', 'imgl'],
        fn: imgElem
    }],
    ['a', {attrs: ['href', attrTarget, 'data-direct'], fn: anchorElem}],
    ['em', {attrs: [attrClass], class: ['notice', 'attention']}],
    ['strong', {attrs: [attrClass], class: ['notice', 'attention']}]
]);

const trustedNodeName = new Set(Array.from(tags.keys()));

let dropList: Node[];
let removeList: Node[];

export function validateRoot(root: HTMLElement) {
    for (const node of Array.from(root.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6,blockquote'))) {
        if (!node.querySelector('br') && !node.textContent?.trim()) {
            node.appendChild(document.createElement('br'));
        }
    }

    for (const node of Array.from(root.querySelectorAll('dfn,q,sub,sup,b,i,u,del,a,em,strong'))) {
        if (!node.querySelector('br,img') && !node.textContent?.trim()) {
            node.remove();
        }
    }

    for (const node of Array.from(root.querySelectorAll(Array.from(trustedNodeName).map(t => `:not(${t})`).join('')))) {
        dropNode(node);
    }

    let p: HTMLElement | undefined;
    let counter = 0, added = -1;
    const enabled = new Set('p,ol,ul,h1,h2,h3,h4,h5,h6,blockquote'.split(','));
    for (const node of Array.from(root.childNodes)) {
        if (enabled.has(node.nodeName.toLowerCase())) continue;
        if (node.nodeType == 3 && !node.textContent?.trim()) {
            node.remove();
            continue;
        }
        if (node.nodeType != 3 && node.nodeType != 1) {
            node.remove();
            continue;
        }
        if (counter != added + 1 || !p) {
            p = document.createElement('p');
            node.parentNode?.insertBefore(p, node);
        }
        p.appendChild(node);
        counter++;
    }
}

export function validatePaste(root: HTMLElement) {
    dropTable(root);
    testQuotation(root);


    for (const img of Array.from(root.querySelectorAll('img'))) {
        img.parentNode?.removeChild(img);
    }

    dropList = [] as Node[];
    removeList = [] as Node[];

    const walker = document.createTreeWalker(root);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        switch (node.nodeType) {
            case 1: {
                const nodeName = node.nodeName.toLowerCase();
                if (trustedNodeName.has(nodeName)) {
                    trustedNode(node as HTMLElement);
                } else {
                    switch (nodeName) {
                        case 'div':
                        case 'span':
                            dropList.push(node);
                            break;
                        default:
                            removeList.push(node);
                            break;
                    }
                }
                break;
            }
            case 3: {
                break;
            }
            default: {
                removeList.push(node);
                break;
            }
        }
    }

    for (const node of removeList) {
        node.parentNode?.removeChild(node);
    }

    for (const node of dropList) {
        dropNode(node);
    }
}

function testQuotation(root: HTMLElement) {
    const walker = document.createTreeWalker(root);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent =node.parentNode;
        if (node.nodeType == 3 && parent) {

            const parts = (node.nodeValue || '').split('"');
            if (parts.length > 1 && parts.length % 2) {
                let html = '';
                for (let i = 0; i < parts.length; i++) {
                    html += parts[i];
                    if (i == parts.length - 1) break;
                    if (i % 2) {
                        html += '</q>';
                    } else {
                        html += '<q>';
                    }
                }

                const div = document.createElement('div');
                div.innerHTML = html;
                while (div.firstChild){
                    parent.insertBefore(div.firstChild, node);
                }
                parent.removeChild(node);
            }
        }
    }
}

function dropTable(root: HTMLElement) {
    for (const table of Array.from(root.querySelectorAll('table'))) {
        for (const row of Array.from(table.querySelectorAll('tr'))) {
            const p = document.createElement('p');
            for (const cell of Array.from(row.querySelectorAll('td, th'))) {
                if (p.firstChild) {
                    p.appendChild(document.createTextNode(' '));
                }
                while (cell.firstChild) {
                    p.appendChild(cell.firstChild);
                }
            }
            if (p.textContent?.trim()) {
                table.parentNode?.insertBefore(p, table);
            }
        }
    }
}

function trustedNode(node: HTMLElement) {
    const data = tags.get(node.nodeName.toLowerCase()) || null;
    const classEnabled = new Set(data ? data.class || [] : []);
    const attrsEnabled = new Set(data ? data.attrs || [] : []);
    for (const attr of Array.from(node.attributes)) {
        const attrName = attr.name;
        if (attrsEnabled.has(attrName)) {
            if (attrName == 'class') {
                let enabledNext = true;
                for (const className of Array.from(node.classList)) {
                    if (enabledNext && classEnabled.has(className)) {
                        enabledNext = false;
                    } else {
                        node.classList.remove(className);
                    }
                }
                if (!node.className.trim()) {
                    node.removeAttribute(attrName);
                }
            }
        } else {
            node.removeAttribute(attrName);
        }
    }

    if (data && data.fn) data.fn(node);
}

function imgElem(elem: HTMLImageElement) {
    const src = elem.getAttribute('src') || '';
    if (!reSrc.test(src) || !src.startsWith(hrefPref)) {
        removeList.push(elem);
    }
}

function anchorElem(elem: HTMLAnchorElement) {
    const href = elem.getAttribute('href') || '';
    if (!reDgt.test(href) && !href.startsWith('/') && !href.startsWith(hrefPref)) {
        dropList.push(elem);
    } else {
        const target = elem.getAttribute(attrTarget);
        if (target && target != '_blank') {
            elem.removeAttribute(attrTarget);
        }
    }
}

