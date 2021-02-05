import styleInputCheckbox from './element.input-checkbox.scss';
import styleInputRange from './element.input-range.scss';

type TElemBase = { el: Element };
type TElement = TElemBase | Element;
type TChildren = (TElement | string | null | TChildren)[];
type TAttribute = { [s: string]: string | number | boolean | ((e: Event) => void) | null };
type Partial<T> = {
    [P in keyof T]?: T[P];
};
type IDictStyle = Partial<CSSStyleDeclaration>;
type TEvents =
    | 'focus'
    | 'blur'
    | 'copy'
    | 'paste'
    | 'keydown'
    | 'scroll'
    | 'click'
    | 'dblclick'
    | 'input'
    | 'change'
    | 'mousedown'
    | 'mousemove'
    | 'mouseenter'
    | 'mouseleave'
    | 'mouseover'
    | 'mouseup'
    | 'pointerup'
    | 'pointerleave'
    | 'dragstart'
    | 'dragend'
    | 'drop'
    | 'dragover';

export function EL(nodeName: string | HTMLElement) {
    return new Elem(typeof (nodeName) == 'string' ? createElement(nodeName) : nodeName);
}

const registered = new Set<string>();
export function CustomEl(nodeName: string) {
    if(!registered.has(nodeName)){
        registered.add(nodeName);
        window.customElements.define(nodeName, class extends HTMLElement{});
    }
    return EL(nodeName);
}

export type IElem = Elem<HTMLElement>;

export class Elem<T extends Element> {
    el: T;

    constructor(el: T) {
        this.el = el;
    }

    body() {
        document.body.appendChild(this.el);
        return this;
    }

    beforeThat(parentElem: TElement | DocumentFragment) {
        const parent = ElemGet(parentElem).parentNode;
        if (parent) {
            parent.insertBefore(this.el, ElemGet(parentElem));
        }
        return this;
    }

    afterThat(_parentElem: TElement | DocumentFragment) {
        const elem = ElemGet(_parentElem);
        const parent = elem.parentNode;
        if (parent) {
            const nextElem = elem.nextSibling;
            if (nextElem) {
                parent.insertBefore(ElemGet(this.el), nextElem);
            } else {
                parent.appendChild(ElemGet(this.el));
            }
        }
        return this;
    }

    firstIn(parent: TElement) {
        const el = ElemGet(parent);
        const first = el.firstChild;
        if (first) {
            el.insertBefore(this.el, first);
        } else {
            el.appendChild(this.el);
        }
        return this;
    }

    lastIn(parent: TElement) {
        ElemGet(parent).appendChild(this.el);
        return this;
    }

    remove() {
        const parentElem = this.el.parentElement;
        if (parentElem) {
            parentElem.removeChild(this.el);
        }
        return this;
    }

    style(style: IDictStyle) {
        ElemStyles(this.el, style as CSSStyleDeclaration);
        return this;
    }

    styleRemove() {
        this.el.removeAttribute('style');
        return this;
    }

    attr(key: string, val: string | number | boolean | null) {
        if (Defined(key) && key && Defined(val)) {
            this.el.setAttribute(key, val + '');
        }
        return this;
    }

    attrRemove(key: string) {
        if (Defined(key)) {
            this.el.removeAttribute(key);
        }
        return this;
    }


    as(classes: string | null, flag?: boolean) {
        if (classes) {
            if (flag === false) {
                ElemClassRemove(this.el, classes);
            } else {
                ElemClassAdd(this.el, classes);
            }
        }
        return this;
    }

    asNone(flag = true) {
        if (flag) {
            ElemStyle(this.el, 'display', 'none');
        } else {
            ElemStyle(this.el, 'display', '');
        }
        return this;
    }

    title(text: string | number | boolean | null) {
        Defined(text) && this.el.setAttribute('title', text + '');
        return this;
    }

    text(text: string | number | boolean | null) {
        if (Defined(text)) {
            this.el.textContent = text + '';
        }
        return this;
    }

    html(text: string | number | boolean | null) {
        if (Defined(text)) {
            this.el.innerHTML = text + '';
        }
        return this;
    }

    append(...children: TChildren) {
        ElemChildren(this.el, children);
        return this;
    }

    drop() {
        if (this.el.firstChild) {
            this.el.innerHTML = '';
        }
        return this;
    }

    on(eventName: TEvents, fn: EventListener) {
        this.el.addEventListener(eventName, fn);
        return this;
    }

    off(eventName: TEvents, fn: EventListener) {
        this.el.removeEventListener(eventName, fn);
        return this;
    }

    onEnter(fn: EventListener) {
        this.on('mouseenter', fn);
        return this;
    }

    onLeave(fn: EventListener) {
        this.on('mouseleave', fn);
        return this;
    }

    onDown(fn: EventListener) {
        this.on('mousedown', fn);
        return this;
    }

    onMove(fn: EventListener) {
        this.on('mousemove', fn);
        return this;
    }

    onOver(fn: EventListener) {
        this.on('mouseover', fn);
        return this;
    }

    onScroll(fn: EventListener) {
        this.on('scroll', fn);
        return this;
    }

    click(fn: EventListener) {
        this.on('click', fn);
        return this;
    }

    clickOff(fn: EventListener) {
        this.off('click', fn);
        return this;
    }
}

export type IElemImage = ElemImage<HTMLImageElement>;

class ElemImage<T extends HTMLImageElement> extends Elem<T> {
    src(val: string) {
        if (val) {
            this.el.setAttribute('src', val);
        }
        return this;
    }
}

export type IElemButton = ElemButton<HTMLButtonElement>;

class ElemButton<T extends HTMLButtonElement> extends Elem<T> {
    disabled(val: boolean) {
        this.el.disabled = val;
        return this;
    }
}

export class ElemInput<T extends HTMLInputElement> extends Elem<T> {

    private obj: any;
    private key!: string;

    disabled(val: boolean) {
        this.el.disabled = val;
        return this;
    }

    min(val: number | string) {
        this.el.min = val + '';
        return this;
    }

    step(val: number | string) {
        this.el.step = val + '';
        return this;
    }

    max(val: number | string) {
        this.el.max = val + '';
        return this;
    }

    type(val: 'number' | 'file' | 'text' | 'date' | 'time' | 'range' | 'email') {
        this.el.type = val;
        return this;
    }

    typeText() {
        this.el.type = 'text';
        return this;
    }

    typeDate() {
        this.el.type = 'date';
        return this;
    }

    onInput(fn: EventListener) {
        this.on('input', fn);
        return this;
    }

    readonly(flag: boolean) {
        this.el.readOnly = flag;
        return this;
    }

    placeholder(text: string) {
        this.el.placeholder = text;
        return this;
    }

    selectAllonFocus() {
        this.on('focus', () => {
            this.el.selectionStart = 0;
            this.el.selectionEnd = this.el.value.length;
        });
        this.on('blur', () => {
            this.el.selectionStart = 0;
            this.el.selectionEnd = 0;
        });
        return this;
    }

    focus() {
        setTimeout(() => {
            this.el.focus();
        }, 100);
        return this;
    }

    valueSelect(flagFocus = true) {
        const el = this.el;
        el.selectionStart = 0;
        el.selectionEnd = el.value.length;
        if (flagFocus) setTimeout(() => {
            el.focus();
        }, 100);
        return this;
    }

    bind<T, K extends keyof T>(obj: T, key: K, defaultValue?: string | number) {
        this.obj = obj;
        this.key = key as any;
        this.el.value = this.obj[this.key] || defaultValue || '';
        this.onInput(this._bindInput.bind(this));
        return this;
    }

    private _bindInput() {
        switch (this.el.type) {
            case 'number':
                this.obj[this.key] = this.el.valueAsNumber;
                break;
            default:
                this.obj[this.key] = this.el.value.trim();
                break;
        }

    }

    setValue(val: string | number) {
        this.el.value = val + '';
        return this;
    }

    get value() {
        return this.el.value.trim();
    }
}


class ElemTextArea<T extends HTMLTextAreaElement> extends Elem<T> {
    private obj: any;
    private key!: string;

    disabled(val: boolean) {
        this.el.disabled = val;
        return this;
    }

    focus() {
        setTimeout(() => {
            this.el.focus();
        }, 100);
        return this;
    }

    bind<T, K extends keyof T>(obj: T, key: K, defaultValue?: string | number) {
        this.obj = obj;
        this.key = key as any;
        this.el.value = this.obj[this.key] || defaultValue || '';
        this.onInput(this._bindInput.bind(this));
        return this;
    }

    rows(val: number) {
        this.el.rows = val;
        return this;
    }

    private _bindInput() {
        this.obj[this.key] = this.el.value.trim();
    }

    placeholder(text: string) {
        this.el.placeholder = text;
        return this;
    }

    onInput(fn: EventListener) {
        this.on('input', fn);
        return this;
    }

    setValue(val: string | number | boolean) {
        if (Defined(val)) {
            this.el.value = val + '';
        }
        return this;
    }

    selectAll() {
        this.el.selectionStart = 0;
        this.el.selectionEnd = this.el.value.length;
        this.el.focus();
        return this;
    }

    get value() {
        return this.el.value.trim();
    }
}


export function Anchor() {
    return new ElemAnchor(createElement('a') as HTMLAnchorElement);
}

export class ElemAnchor<T extends HTMLAnchorElement> extends Elem<T> {
    href(val: string | null) {
        if (Defined(val)) {
            this.el.href = val;
        }
        return this;
    }

    blank() {
        this.target('_blank');
        return this;
    }

    target(val: string | null) {
        if (Defined(val)) {
            this.el.target = val;
        }
        return this;
    }
}

// =================

const icons = {
    inputSquare: '<svg class="figure" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M400 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-6 400H54c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h340c3.3 0 6 2.7 6 6v340c0 3.3-2.7 6-6 6z"></path></svg>',
    inputSquareChecked: '<svg class="figure-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="currentColor" d="M400 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zm0 400H48V80h352v352zm-35.864-241.724L191.547 361.48c-4.705 4.667-12.303 4.637-16.97-.068l-90.781-91.516c-4.667-4.705-4.637-12.303.069-16.971l22.719-22.536c4.705-4.667 12.303-4.637 16.97.069l59.792 60.277 141.352-140.216c4.705-4.667 12.303-4.637 16.97.068l22.536 22.718c4.667 4.706 4.637 12.304-.068 16.971z"></path></svg>',
    inputCircleChecked: '<svg class="figure-check" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 56c110.532 0 200 89.451 200 200 0 110.532-89.451 200-200 200-110.532 0-200-89.451-200-200 0-110.532 89.451-200 200-200m0-48C119.033 8 8 119.033 8 256s111.033 248 248 248 248-111.033 248-248S392.967 8 256 8zm0 168c-44.183 0-80 35.817-80 80s35.817 80 80 80 80-35.817 80-80-35.817-80-80-80z"></path></svg>',
    inputCircle: '<svg class="figure" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm0 448c-110.5 0-200-89.5-200-200S145.5 56 256 56s200 89.5 200 200-89.5 200-200 200z"></path></svg>',
};


class InputCheckboxNode extends HTMLElement {
    static tag = 'input-checkbox';
}

window.customElements.define(InputCheckboxNode.tag, InputCheckboxNode);


class ElemInputCheckbox extends Elem<HTMLElement> {
    state = {
        iconNormal: '',
        iconChecked: '',
        checked: false,
        disabled: false,
    };

    private _obj: any;
    private _key: any;

    private _box = Span().as('box');
    private _val: boolean | number | string = true;

    constructor(el: HTMLElement) {
        super(el);
        this._init();
    }

    private _init() {

        getShadow(this.el, [
            CSSStyle().content(styleInputCheckbox),
            this._box
        ]);

        this.click(this._click.bind(this));
        this.state.iconNormal = icons.inputSquare;
        this.state.iconChecked = icons.inputSquareChecked;
        this._update();
    }

    private _click() {
        this.state.checked = !this.state.checked;
        this._sync();
        this._update();
    }
    private _sync(){
        const {_obj, _key} = this;
        if (_obj && _key) {
            switch (typeof (this._val)) {
                case 'boolean':
                    _obj[_key] = this.state.checked;
                    break;
                case 'number':
                    _obj[_key] = this.state.checked ? this._val : 0;
                    break;
                case 'string':
                    _obj[_key] = this.state.checked ? this._val : '';
                    break;
                default:
                    _obj[_key] = this.state.checked ? this._val : null;
                    break;
            }
        }
    }

    getValue() {
        return this._val;
    }

    value(val: boolean | number | string) {
        this._val = val;
        if (typeof (val) == 'boolean') {
            this.state.checked = val;
            this._update();
        }
        return this;
    }

    bind<T, K extends keyof T>(obj: T, key: K) {
        this._obj = obj;
        this._key = key;
        if (typeof (obj[key]) == 'boolean') {
            this._val = true;
            this.state.checked = obj[key] as any;
            this._update();
        }
        return this;
    }

    textLeft(text: string) {
        Span().as('text-left').html(text).beforeThat(this._box);
        return this;
    }

    textRight(text: string) {
        Span().as('text-right').html(text).afterThat(this._box);
        return this;
    }

    typeCircle() {
        this.state.iconNormal = icons.inputCircle;
        this.state.iconChecked = icons.inputCircleChecked;
        this._update();
        return this;
    }

    private _update() {
        this._box.html(this.state.checked ? this.state.iconChecked : this.state.iconNormal);
        if (this.state.checked) this.attr('checked', '');
        else this.attrRemove('checked');
        return this;
    }

    get checked() {
        return this.state.checked;
    }

    setChecked(checked: boolean, flagBind?:boolean) {
        if (this.state.checked != checked) {
            this.state.checked = checked;
            if(flagBind) this._sync();
            this._update();
        }
        return this;
    }
}

export function InputCheckbox() {
    return new ElemInputCheckbox(new InputCheckboxNode());
}

class GroupCheckboxNode extends HTMLElement {
    static tag = 'group-checkbox';
}

window.customElements.define(GroupCheckboxNode.tag, GroupCheckboxNode);

class GroupCheckboxElem extends Elem<HTMLElement> {
    private options = [] as ElemInputCheckbox[];
    private _obj: any;
    private _key: any;
    private _fnChange?: (val: any) => void;

    constructor(el: GroupCheckboxNode) {
        super(el);
        this._changed = this._changed.bind(this);
        //this.as('group-checkbox').style({display: 'inline-flex'});
    }

    activate(ind: number){
        const opt = this.options[ind];
        if(opt) this._changed(opt);
        return this;
    }

    setOptions(...options: ElemInputCheckbox[]) {
        this.options = options;
        this.append(options);
        getShadow(this.el, [
            CSSStyle().content(':host{display:inline-flex}input-checkbox{margin-right: 0.5em}'),
            options
        ]);
        return this;
    }

    bind<T, K extends keyof T>(obj: T, key: K, value?: boolean | string | number) {
        this._obj = obj;
        this._key = key;

        if (!value) {
            value = obj[key] as any;
        }

        for (const opt of this.options) {
            opt.typeCircle().setChecked(opt.getValue() === value).click(() => this._changed(opt));
        }

        return this;
    }

    onChange(fn: (val: any) => void) {
        this._fnChange = fn;
        return this;
    }

    private _changed(item: ElemInputCheckbox) {
        for (const opt of this.options) {
            opt.typeCircle().setChecked(opt.getValue() === item.getValue());
        }
        this._obj[this._key] = item.getValue();
        if (this._fnChange) this._fnChange(this._obj[this._key]);
    }
}

export function GroupCheckbox() {
    return new GroupCheckboxElem(new GroupCheckboxNode());
}

// ========================

class InputRangeNode extends HTMLElement {
    static tag = 'input-range';
}

window.customElements.define(InputRangeNode.tag, InputRangeNode);

export class ElemInputRange extends Elem<HTMLElement> {
    private _input = Input().type('range');
    private _value = Span();
    private _obj: any;
    private _key: any;

    constructor(el: HTMLElement) {
        super(el);
        this._init();
    }

    private _init() {
        getShadow(this.el, [
            CSSStyle().content(styleInputRange),
            this._input,
            this._value
        ]);
    }

    private _changed() {
        const val = this._input.el.valueAsNumber;
        this._obj[this._key] = val;
        this._value.text(val);
    }

    bind<T extends { [Key in K]: number }, K extends keyof T>(obj: T, key: K, value?: number) {
        this._obj = obj;
        this._key = key;
        const val = (Defined(value) ? value : this._obj[this._key]) || 0;
        this._value.text(val);
        this._input.setValue(val).on('input', this._changed.bind(this));
        return this;
    }

    min(val: number) {
        this._input.el.min = val + '';
        return this;
    }

    max(val: number) {
        this._input.el.max = val + '';
        return this;
    }

    step(val: number) {
        this._input.el.step = val + '';
        return this;
    }
}

export function InputRange() {
    return new ElemInputRange(new InputRangeNode());
}

// ========================

export function TextArea() {
    return new ElemTextArea(createElement('textarea') as HTMLTextAreaElement);
}

export class ElemSelect extends Elem<HTMLSelectElement> {
    private _obj: any;
    private _key: any;

    bind<T, K extends keyof T>(obj: T, key: K) {
        this._obj = obj;
        this._key = key;
        const val = obj[key] + '';
        let selected = false;
        for (const opt of Array.from(this.el.options)) {
            if (opt.value == val) {
                opt.selected = true;
                selected = true;
                break;
            }
        }
        if (!selected) {
            this.el.selectedIndex = -1;
        }
        this.el.addEventListener('change', this._changed.bind(this));
        return this;
    }

    private _changed() {
        const opt = this.el.options[this.el.selectedIndex];
        if (opt) {
            let val: string | number = opt.value;
            if (typeof (this._obj[this._key]) == 'number') {
                try {
                    val = parseFloat(opt.value);
                } catch (e) {
                }
            }
            this._obj[this._key] = val;
        }
    }
}

export function Select() {
    return new ElemSelect(createElement('select'));
}

export function Img() {
    return new ElemImage(createElement('img') as HTMLImageElement);
}

export function Button() {
    return new ElemButton(createElement('button') as HTMLButtonElement);
}

export function Input() {
    return new ElemInput(createElement('input') as HTMLInputElement);
}

export function Div() {
    return new Elem(createElement('div'));
}

export function UL() {
    return new Elem(createElement('ul'));
}

export function LI() {
    return new Elem(createElement('li'));
}

export function Table() {
    return new Elem(createElement('table'));
}

export function TBody() {
    return new Elem(createElement('tbody'));
}

export function TR() {
    return new Elem(createElement('tr'));
}

export function TD() {
    return new Elem(createElement('td'));
}

export function Span() {
    return new Elem(createElement('span'));
}

export function Defined<T>(v: T | null | undefined): v is T {
    return v !== null && v != void (0);
}

function ElemClassAdd(el: Element, vars: string) {
    for (const n of vars.split(' ')) {
        if (n) el.classList.add(n);
    }
}

function ElemClassRemove(el: Element, vars: string) {
    for (const n of vars.split(' ')) {
        if (n) el.classList.remove(n);
    }
}

export function eventStop(e: Event) {
    e.preventDefault();
    e.stopPropagation();
}

export function getShadow<T extends HTMLElement>(elem: T, children?: TChildren) {
    const shadowRoot = elem.attachShadow({mode: 'open'});
    if (children) {
        ElemChildren(shadowRoot, children);
    }
    return shadowRoot;
}

export function createElement<T extends HTMLElement>(nodeName: string, attr?: TAttribute | string | null, children?: TChildren) {
    const node = document.createElement(nodeName as string) as T;
    if (attr) {
        if (typeof (attr) == 'string') {
            attr = {className: attr} as TAttribute;
        }
        ElemAttribute(node, attr);
    }
    if (children) {
        ElemChildren(node, children);
    }
    return node;
}


function ElemStyle(elem: Element, key: keyof CSSStyleDeclaration, val: string) {
    const elemHtml = elem as HTMLElement;
    if (elemHtml.style && Defined(elemHtml.style[key as any])) {
        elemHtml.style[key as any] = val;
        if (!elemHtml.getAttribute('style')) {
            elemHtml.removeAttribute('style');
        }
    }
}

function ElemStyles(elem: Element, styles: CSSStyleDeclaration) {
    const elemHtml = elem as HTMLElement;
    if (elemHtml.style) {
        for (let key in styles) {
            if (!styles.hasOwnProperty(key)) continue;
            const val = styles[key];
            if (Defined(val)) {
                elemHtml.style [key] = val;
            }
        }
    }
}

export function CSSStyle() {
    return new ElemCSSStyle();
}

interface IDictStyleExt extends IDictStyle {
    display?: 'flex' | 'inline-flex' | 'block' | 'inline-block'
    justifyContent?: 'center'
}

class ElemCSSStyle {
    el = document.createElement('style');

    constructor() {
        this.el.setAttribute('type', 'text/css');
    }

    add(selector: string, styles: IDictStyleExt) {
        const list = [] as string[];
        for (const key in styles) {
            if (styles[key]) {
                list.push(`${key.replace(/([A-Z])/g, (a, b) => `-${b.toLowerCase()}`)}:${styles[key]}`);
            }
        }
        this.el.textContent += `${selector.trim()}{${list.join(';')}}`;
        return this;
    }

    addHost(styles: IDictStyleExt) {
        this.add(':host', styles);
        return this;
    }

    content(cssText: string) {
        this.el.textContent = cssText;
        return this;
    }

    toHead() {
        const heads = document.getElementsByTagName('head');
        if (heads.length) {
            const styles = heads[0].getElementsByTagName('style');
            if (styles.length) {
                styles[0].textContent += this.el.textContent || '';
            } else {
                heads[0].appendChild(this.el);
            }
        } else {
            document.body.appendChild(this.el);
        }
        return this;
    }
}

export function em(...vals: number[]) {
    return vals.map(v => v + (v ? 'em' : '')).join(' ');
}

export function px(...vals: number[]) {
    return vals.map(v => v + (v ? 'px' : '')).join(' ');
}

const _eventRegExp = /^on([A-Z][a-zA-Z])$/;

function ElemAttribute(elem: Element, attr: TAttribute) {
    for (const attrName in attr) {
        if (!attr.hasOwnProperty(attrName)) continue;
        const attrVal = attr[attrName];
        if (!Defined(attrVal)) continue;
        const attrValText = attrVal + '';
        switch (attrName) {
            case 'className':
                ElemClassAdd(elem, attrValText);
                break;
            case 'text':
                elem.textContent = attrValText;
                break;
            case 'html':
                elem.innerHTML = attrValText;
                break;
            default:
                if (_eventRegExp.test(attrName) && typeof (attrVal) == 'function') {
                    const m = attrName.match(_eventRegExp);
                    if (m) {
                        elem.addEventListener(m[1].toLowerCase(), attrVal);
                    }
                } else {
                    elem.setAttribute(attrName, attrValText);
                }
                break;
        }
    }
}

function ElemGet(el: TElement | DocumentFragment): Element {
    return (el as TElemBase).el ? (el as TElemBase).el : el as Element;
}

export function ElemChildren(elem: Element | ShadowRoot, children: TChildren) {
    for (const el of children) {
        if (el === null || el === undefined) continue;
        if (typeof (el) == 'string') {
            //if (el.indexOf('<') > -1 && el.indexOf('>') > -1) {
            const d = document.createElement('div');
            d.innerHTML = el;
            while (d.firstChild) {
                elem.appendChild(d.firstChild);
            }

        } else if (Array.isArray(el)) {
            ElemChildren(elem, el);
        } else {
            elem.appendChild(ElemGet(el));
        }
    }
}

