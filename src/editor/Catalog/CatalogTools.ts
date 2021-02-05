import styleCatalogTools from './CatalogTools.scss';
import iconSort from '../icon/sort.svg';
import iconTune from '../icon/newspaper-regular.svg';
import iconTrash from '../icon/trash-alt-regular.svg';
import {CSSStyle, CustomEl, dialog, Div, getShadow, InputCheckbox, Span, SVG} from "element";
import {ICatalogItem} from "./CatalogItem";
import {DialogMove} from "./DialogMove";
import {DialogTune} from "./DialogTune";


export class CatalogTools {
    elem = {
        container: CustomEl('catalog-tools'),
        boxNode: InputCheckbox(),
        boxCatalog: InputCheckbox(),
        boxComment: InputCheckbox()
    };

    item: ICatalogItem;

    constructor(item: ICatalogItem) {
        this.item = item;
    }

    private onDelete() {
        dialog()
            .confirm('Удалить?')
            .onConfirm(() => {
                dialog()
                    .confirm('Нажмите ДА, для удаления.')
                    .onConfirm(this.deleteBegin.bind(this))
            });
    }

    private deleteBegin() {
        const {editor, items} = this.item.catalog;
        this.item.remove();

        const {idf} = this.item;
        for (const item of items) {
            let group = item.group;
            if (group && group.includes(idf)) {
                group = Array.from(group);
                group.splice(group.indexOf(idf), 1);
                item.setGroup(group);
            }
        }

        if(this.item.flagNode) {
            this.item.catalog.editor.sidebar.updateArticleImages();
        }

        editor.data.catalogDelete(idf, ()=>this.item.catalog.editor.imageRemove(this.item.src));
    }

    private onMove(){
        new DialogMove(this.item);
    }

    private onTune(){
        new DialogTune(this.item);
    }

    view() {
        getShadow(this.elem.container.el, [
            CSSStyle().content(styleCatalogTools),
            Div().as('row').append(
                this.elem.boxNode.title('статья').bind(this.item, 'flagNode').setChecked(this.item.flagNode),
                this.elem.boxCatalog.title('каталог').bind(this.item, 'flagCatalog').setChecked(this.item.flagCatalog),
                this.elem.boxComment.title('комментарий').bind(this.item, 'flagComment').setChecked(this.item.flagComment)
            ),
            Div().as('row').append(
                Span().as('icon').title('настройка').click(this.onTune.bind(this)).append(
                    SVG().content(iconTune)
                ),
                Span().as('icon').title('порядковый номер').click(this.onMove.bind(this)).append(
                    SVG().content(iconSort)
                ),
                Span().as('icon').title('удалить').click(this.onDelete.bind(this)).append(
                    SVG().content(iconTrash)
                ),
            )]
        );
        return this.elem.container;
    }
}
