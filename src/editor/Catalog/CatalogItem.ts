import styleCatalogItem from './CatalogItem.scss';
import {EFileType, getFileType, getSrcByAttach, IAttach} from "../editor-const";
import {CSSStyle, CustomEl, Defined, Div, em, getShadow, IElem, IElemSvg, Img, InputRange, Span, SVG} from "element";
import {editableBlock} from "../EditableBlock/EditableBlock";
import {IEditorCatalog} from "./CatalogElement";
import iconAudio from "../icon/audio.svg";
import iconVideo from "../icon/video.svg";
import {CatalogTools} from "./CatalogTools";
import {quizMap} from "./_catalog-common";


const classNameItemGroup = 'is-group';

export type ICatalogItem = CatalogItem;

const classNotVisible = 'not-visible';
const attrDataSrc = 'data-src';
const funcView = '__view';

const observer = new IntersectionObserver(onIntersection);

function onIntersection(intersection: IntersectionObserverEntry[]) {
    for (const entry of intersection) {
        if (entry.isIntersecting) {
            entry.target.classList.add('test');
            setTimeout(elemTest, 100, entry.target);
        } else {
            entry.target.classList.add(classNotVisible);
            entry.target.classList.remove('test');
        }
    }
}

function elemTest(target: HTMLElement) {
    if (!target.classList.contains('test')) return;

    if((target as any)[funcView]){
        (target as any)[funcView]();
        delete (target as any)[funcView];
    }

    target.classList.remove(classNotVisible);
    const img = target.shadowRoot?.querySelector(`[${attrDataSrc}]`);
    if (img) {
        img.setAttribute('src', img.getAttribute(attrDataSrc) || '');
        img.removeAttribute(attrDataSrc);
    }
    target.removeAttribute('style');
    target.style.minHeight = target.offsetHeight + 'px';
}

export class CatalogItem {

    static lastSelected: CatalogItem | null;

    static dropLastSelected() {
        if (CatalogItem.lastSelected) {
            CatalogItem.lastSelected.elem.container.as('selected', false);
            CatalogItem.lastSelected = null;
        }
    }

    elem = {
        container: CustomEl('catalog-item'),
        editor: Div(),
        image: Span()
    };
    private dataSrc: IAttach;
    private dataUpd: IAttach;
    catalog: IEditorCatalog;
    tools = new CatalogTools(this);

    constructor(catalog: IEditorCatalog, data: IAttach) {
        this.catalog = catalog;
        this.dataSrc = data;
        this.dataUpd = {} as IAttach;
        this.viewBefore();
    }

    get content() {
        return this.dataUpd.content || this.dataSrc.content;
    }

    selected() {
        CatalogItem.dropLastSelected();
        this.elem.container.as('selected');
        CatalogItem.lastSelected = this;
    }

    getUpdated() {
        console.log('getUpdated', this.dataUpd);
        if (Object.keys(this.dataUpd).length) {
            return Object.assign({idf: this.dataSrc.idf}, this.dataUpd);
        } else {
            return null;
        }
    }

    dropUpdated() {
        if (Object.keys(this.dataUpd).length) {
            for (const key of Object.keys(this.dataUpd) as (keyof IAttach)[]) {
                if (this.dataSrc[key] != this.dataUpd[key]) {
                    (this.dataSrc as any)[key] = this.dataUpd[key];
                }
                delete (this.dataUpd[key]);
            }
        }
    }

    get idf() {
        return this.dataSrc.idf;
    }

    get src() {
        return this.dataSrc.src;
    }

    get quiz() {
        return Defined(this.dataUpd.quiz) ? this.dataUpd.quiz : (this.dataSrc.quiz || '');
    }

    setQuiz(val: string) {
        this.dataUpd.quiz = val;
        return this;
    }

    get group() {
        return Defined(this.dataUpd.group) ? this.dataUpd.group : (Defined(this.dataSrc.group) ? this.dataSrc.group : []);
    }

    setGroup(list: number[]) {
        this.dataUpd.group = list;
        return this;
    }

    get flagNode() {
        return this.dataUpd.flagNode || this.dataSrc.flagNode || false;
    }

    set flagNode(flag: boolean) {
        this.dataUpd.flagNode = flag;
    }

    get flagCatalog() {
        return this.dataUpd.flagCatalog || this.dataSrc.flagCatalog || false;
    }

    set flagCatalog(flag: boolean) {
        this.dataUpd.flagCatalog = flag;
    }

    get flagComment() {
        return this.dataUpd.flagComment || this.dataSrc.flagComment || false;
    }

    set flagComment(flag: boolean) {
        this.dataUpd.flagComment = flag;
    }

    viewQuizName() {
        const attr = 'data-quiz-name';
        const quiz = this.quiz;
        if (quiz) {
            this.elem.editor.attr(attr, `Викторина: ${quizMap.get(quiz)}`);
        } else {
            this.elem.editor.attrRemove(attr);
        }
    }

    viewGroupItem(flag: boolean) {
        this.elem.image.as('not-in-group', !flag);
        return this;
    }

    viewGroupDrop() {
        this.elem.image.as(classNameItemGroup, false);
        return this;
    }

    viewGroup() {
        this.elem.image.as(classNameItemGroup, !!this.group.length);
        return this;
    }

    setIcon(parent: IElem, isDialog = false) {
        let elem: IElem | IElemSvg | null = null;
        switch (getFileType(this.dataSrc.src)) {
            case EFileType.image: {
                elem = Img().attr(isDialog ? 'src' : attrDataSrc, getSrcByAttach(this.dataSrc, 150)).as('icon').lastIn(parent);
                break;
            }
            case EFileType.audio: {
                elem = SVG().content(iconAudio).as('icon').lastIn(parent);
                break;
            }
            case EFileType.video: {
                elem = SVG().content(iconVideo).as('icon').lastIn(parent);
                break;
            }
        }
        return elem;
    }

    remove() {
        const {items} = this.catalog;
        items.splice(items.indexOf(this), 1);
        this.elem.container.remove();
    }

    private viewBefore(){
        this.elem.container.as(classNotVisible).style({minHeight: em(12), display: 'block'});
        observer.observe(this.elem.container.el);
        (this.elem.container.el as any)[funcView] = this.view.bind(this);
    }

    private view() {
        this.viewQuizName();
        this.viewGroup();
        this.setIcon(this.elem.image);
        const like = this.dataSrc.like || 0;
        getShadow(this.elem.container.el, [
                CSSStyle().content(styleCatalogItem),
                Div().as('image').append(
                    this.elem.image.click(() => this.catalog.onItemImage(this))
                ),
                this.elem.editor.as('editor').append(
                    like || this.dataSrc.flagComment ? InputRange().bind(this.dataUpd, 'like', like).min(like).max(like + 20).step(1) : null,
                    editableBlock(this.catalog.editor, '').bind(this.dataUpd, 'content', this.dataSrc.content).elem
                ),
                Div().as('tool').append(
                    this.tools.view()
                )
            ]
        );
    }
}


