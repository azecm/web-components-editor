import {Button, Div, eventStop} from "element";
import {IPathItem} from "./PanelPath";
import {styleCommand} from "../editor-const";

const pathMenuClean = 'clean';
const pathMenuType = new Map<string, string[]>([
    ['p', ['notice', 'attention']], //, 'like', styleCommand
    ['strong', ['notice', 'attention']],
    ['em', ['notice', 'attention']],
    ['blockquote', ['col3l', 'col3r']]
]);


export class PathMenu {
    container = Div().as('path-menu').asNone();

    private _pathItem!: IPathItem;
    private _timerClose: any;

    constructor() {
        this.close = this.close.bind(this);
        this.container
            .onEnter(this.enter.bind(this))
            .onLeave(this.closeQuickly.bind(this))
        ;
    }

    init(userAdmin: boolean) {
        if (userAdmin) {
            (pathMenuType.get('p') as string[]).push('like', styleCommand);
        }
        return this;
    }

    private _stopTimer() {
        clearTimeout(this._timerClose);
    }

    private _startTimer(val: number) {
        this._stopTimer();
        this._timerClose = setTimeout(this.close, val);
    }

    private close() {
        this.container.asNone();
    }

    open(elemTarget: HTMLElement, item: IPathItem) {
        this._stopTimer();
        this.close();
        this._pathItem = item;
        let _list = [] as string[];
        const key = item.target.nodeName.toLowerCase();
        if (pathMenuType.has(key)) {
            _list = Array.from(pathMenuType.get(key) as string[]);
        }
        if (!item.isDoc && item.elem.el.classList.length) {
            _list.push(pathMenuClean);
        }
        if (_list.length) {
            const elemHost = this.container.el;
            elemHost.style.top = `${elemTarget.offsetTop + elemTarget.offsetHeight + 10}px`;
            elemHost.style.left = `${elemTarget.offsetLeft}px`;
            this.container.asNone(false);

            this.container.drop().asNone(false).append(
                _list.map(key =>
                    Button()
                        .as('path-menu__item')
                        .as(this.selected(key) ? 'selected' : null)
                        .click(this.click.bind(this))
                        .attr('data-key', key)
                        .text(key)
                )
            );
        }
    }

    private enter() {
        this._stopTimer();
    }

    private closeQuickly() {
        this._startTimer(100);
    }

    closeSlow() {
        this._startTimer(1000);
    }

    private selected(className: string) {
        return this._pathItem.target.classList.contains(className);
    }

    private click(e: Event) {
        eventStop(e);
        const elem = e.target as HTMLElement;
        const key = elem.getAttribute('data-key');
        if (!key) return;
        if (key == pathMenuClean || this._pathItem.target.classList.contains(key)) {
            this._pathItem.target.removeAttribute('class');
        } else {
            this._pathItem.target.removeAttribute('class');
            this._pathItem.target.classList.add(key);
        }

        for (const b of Array.from(this.container.el.querySelectorAll('button'))) {
            if (b.textContent == key && key!='clean') {
                b.classList.add('selected');
            } else {
                b.classList.remove('selected');
            }
        }
    }
}