import {Div, EL} from "element";
import {contentEditable, edSelection} from "../editor-const";
import {PathMenu} from "./PathMenu";
import {IEditableBlock} from "../EditableBlock/EditableBlock";


export class PanelPath{
    container = Div().as('path');
    menu = new PathMenu();

    update(current: IEditableBlock){
        let el = current.getRangeCommon();
        if (!el) return;
        const p = [] as PathItem[];
        while (el && !el.hasAttribute(contentEditable)) {
            p.splice(0,0, new PathItem(this, el));
            el = el.parentNode as HTMLElement;
        }
        p.splice(0,0, new PathItem(this, current.elemDoc.el));

        this.container.drop().append(
            p.map(item=>item.elem)
        );
    }
}

export type IPathItem = PathItem;
class PathItem {
    path: PanelPath;
    elem = EL('i').as('path-item');
    target:HTMLElement;
    isDoc: boolean;
    constructor(path: PanelPath, target:HTMLElement) {
        this.path = path;
        this.target = target;
        this.isDoc = this.target.hasAttribute(contentEditable);
        const label = this.isDoc ? 'doc' : this.target.nodeName.toLowerCase();
        this.elem.text(label)
            .click(this.click.bind(this))
            .onEnter(this.enter.bind(this))
            .onLeave(this.leave.bind(this));
    }
    private click(){
        const selection = edSelection.getSelection();
        if(!selection) return;
        selection.removeAllRanges();
        const range = document.createRange();
        if (this.isDoc) {
            if(this.target.firstChild && this.target.lastChild){
                range.setStartBefore(this.target.firstChild);
                range.setEndAfter(this.target.lastChild);
            }
        } else {
            range.selectNode(this.target);
        }
        selection.addRange(range);
    }
    private enter(e:Event){
        this.path.menu.open(e.target as HTMLElement, this);
    }
    private leave(){
        this.path.menu.closeSlow();
    }
}
