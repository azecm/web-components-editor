import {Div} from "element";
import {IEditor} from "../Editor";
import {CatalogItem} from "./CatalogItem";
import {getSrcKey, IAttach} from "../editor-const";
import {TopTools} from "./TopTools";

export type IEditorCatalog = CatalogElement;

export class CatalogElement {
    elem = {
        container: Div().asNone(),
        items: Div()
    };

    editor: IEditor;
    items = [] as CatalogItem[];
    topTools = new TopTools(this.items);
    fnGroupAdd?: (item: CatalogItem) => void;

    constructor(editor: IEditor) {
        this.editor = editor;
    }

    byIdf(idf: number) {
        let itemRes: CatalogItem | undefined;
        for (const item of this.items) {
            if (idf == item.idf) {
                itemRes = item;
                break;
            }
        }
        return itemRes;
    }

    bySrc(src: string | null) {
        if (src && src.startsWith('/')) {
            src = getSrcKey(src);
        }

        let res: undefined | CatalogItem;
        for (const item of this.items) {
            if (src == item.src) {
                res = item;
                break;
            }
        }
        return res;
    }

    tuneOpen(fn: (item: CatalogItem) => void, group: number[]) {
        this.fnGroupAdd = fn;
        for (const item of this.items) {
            item.viewGroupDrop().viewGroupItem(group.includes(item.idf));
        }
    }

    tuneClose() {
        this.fnGroupAdd = void (0);
        for (const item of this.items) {
            item.viewGroup().viewGroupItem(true);
        }
    }

    onItemImage(item: CatalogItem) {
        if (!item.src) return;

        if (this.fnGroupAdd) {
            this.fnGroupAdd(item);
        } else {
            window.open('/file/' + item.src, '_blank');
        }
    }

    addItem(row: IAttach) {
        const item = new CatalogItem(this, row);
        this.items.push(item);
        item.elem.container.lastIn(this.elem.items);
    }

    view() {
        const {attach} = this.editor.data.nodeSrc;
        if (attach) {
            for (const row of attach) {
                this.addItem(row);
            }
        }

        this.elem.container.append(
            this.topTools.view(),
            this.elem.items
        );
    }
}