import {Button, Div, GroupCheckbox, InputCheckbox} from "element";
import {CatalogItem} from "./CatalogItem";


enum ETypeView {
    none, article, catalog, comment, all
}

export class TopTools {
    type = ETypeView.all;
    items: CatalogItem[];

    constructor(items: CatalogItem[]) {
        this.items = items;
    }

    onItem(item: CatalogItem){
        let viewNone = false;
        switch (this.type) {
            case ETypeView.article:
                viewNone = !item.flagNode;
                break;
            case ETypeView.catalog:
                viewNone = !item.flagCatalog;
                break;
            case ETypeView.comment:
                viewNone = !item.flagComment;
                break;
            case ETypeView.none:
                viewNone = !!(item.flagNode || item.flagCatalog || item.flagComment);
                break;
        }
        item.elem.container.asNone(viewNone);
    }

    private onTypeChange() {
        for(const item of this.items){
            this.onItem(item);
        }
    }

    private onRemoveCatalog() {
        for(const item of this.items){
            if(item.flagCatalog){
                item.tools.elem.boxCatalog.setChecked(false, true);
            }
        }
    }

    view() {
        return Div().style({textAlign: 'center'}).append(
            GroupCheckbox().setOptions(
                InputCheckbox().textRight('все').value(ETypeView.all),
                InputCheckbox().textRight('статья').value(ETypeView.article),
                InputCheckbox().textRight('каталог').value(ETypeView.catalog),
                InputCheckbox().textRight('комментарий').value(ETypeView.comment),
                InputCheckbox().textRight('без меток').value(ETypeView.none)
            ).bind(this, 'type').onChange(this.onTypeChange.bind(this)),
            Button().append('<del>каталог</del>').click(this.onRemoveCatalog.bind(this)).title('снять галку \'каталог\'')
        );
    }
}