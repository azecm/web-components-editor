import styleEditor from './Editor.scss';
import {CSSStyle, Defined, Div, EL, eventStop} from "element";
import {EditorData} from "./EditorData";
import {editableBlock, IEditableBlock} from "./EditableBlock/EditableBlock";
import {EditorStatusBar} from "./StatusBar/StatusBar";
import {EditorPanel} from "./EditorPanel/EditorPanel";
import {EditorSideBar} from "./SideBar/SideBar";
import {CatalogElement} from "./Catalog/CatalogElement";
import {testHostName} from "env";
import {inputTitle} from "./InputTitle";
import {editorLabels} from "./EditorLabels/EditorLabels";
import {inputLinkText} from "./InputLinkText";
import {inputLinkPath} from "./InputLinkPath";
import {edSelection, getSrcByKey, getSrcKey, getSrcSize} from "./editor-const";
import {inputSearchPhrase} from "./InputSearchPhrase";

export type IEditor = Editor;

export function initEditor() {
    return new Editor();
}

class Editor {
    elemEditor = Div();
    userAdmin = false;
    isEditor = true;

    current!: IEditableBlock;
    imgLeft = true;

    data = new EditorData(this);
    status = new EditorStatusBar(this);
    sidebar = new EditorSideBar(this);
    panel = new EditorPanel(this);
    catalog = new CatalogElement(this);

    private editableList = [] as IEditableBlock[];

    constructor() {

        window.addEventListener('beforeunload', this.beforeunload.bind(this));
        window.addEventListener('hashchange', this.hashchange.bind(this));

        document.title = `Редактирование статьи - ${location.hostname.replace('www.', '')}`;

        this.load();
    }

    private load() {
        const host = (testHostName || location.hostname) as string;
        EL('link')
            .attr('rel', 'stylesheet')
            .attr('href', `/template-new/css/${host}/variable.css`)
            .lastIn(document.head);
        this.data.load(this.loaded.bind(this));
    }

    private loaded() {
        this.init();

        this.sidebar.view();
        this.panel.view();
        this.catalog.view();

        this.panel.path.menu.init(this.userAdmin);
        this.panel.setCSS(this.data.cssContent);
        this.sidebar.updateArticleImages();
        CSSStyle().content(styleEditor).toHead();
        Div().as('editor-main').append(
            this.viewEditor().as('editor-layout'),
            this.catalog.elem.container.as('editor-catalog'),
            this.sidebar.elem.container
        ).body();
        this.panel.elem.body();
    }

    private addEditable(block: IEditableBlock) {
        this.editableList.push(block);
        return block;
    }

    private beforeunload(e: Event) {
        let message: string | null = null;

        if (Object.keys(this.data.nodeUpd).length) {
            eventStop(e);
            message = 'Не забудьте сохранить изменения.';
        }

        return message;
    }

    private hashchange() {
        window.location.reload();
    }

    init() {
        this.userAdmin = Defined(this.data.nodeSrc.descr);
    }

    setCurrent(editable: IEditableBlock, e: MouseEvent) {
        this.current = editable;
        const rect = editable.elem.el.getBoundingClientRect();
        this.imgLeft = e.pageX - rect.left < rect.width / 2;
        edSelection.setFnSelection(editable.getSelection);
    }

    imageRemove(srcKey: string) {
        if(!srcKey) return;
        for (const block of this.editableList) {
            for (const img of getImages(block.elemDoc.el)) {
                const key = getSrcKey(img.src);
                if (key == srcKey) {
                    img.remove();
                }
            }
        }
    }

    imageRotate(srcKey: string) {
        if(!srcKey) return;
        for (const block of this.editableList) {
            for (const img of getImages(block.elemDoc.el)) {
                const key = getSrcKey(img.src);
                if (key == srcKey) {
                    img.addEventListener('load', imageScrUpdated);
                    img.src = getSrcByKey(key, getSrcSize(img.src)) + '?' + Date.now();
                }
            }
        }
    }

    private viewEditor() {
        const editor = this;
        editor.elemEditor.append(
            editor.status.view(editor.userAdmin)
        );
        if (editor.userAdmin) {
            editor.elemEditor.append(
                Div().as('input-field').append(
                    inputTitle(editor)
                ),
                Div().as('input-field').append(
                    editorLabels(editor)
                ),
                Div().as('input-field').append(
                    inputLinkText(editor)
                ),
                Div().as('input-field').append(
                    inputLinkPath(editor)
                ),
                Div().as('input-field').append(
                    inputSearchPhrase(editor)
                ),
                Div().as('input-field').append(
                    this.addEditable(editableBlock(editor, editor.data.cssContent)).bind(editor.data.nodeUpd, 'descr', editor.data.nodeSrc.descr).elem
                )
            );
        }

        return editor.elemEditor.append(
            Div().as('input-field').append(
                this.addEditable(editableBlock(editor, editor.data.cssContent)).bind(editor.data.nodeUpd, 'content', editor.data.nodeSrc.content, editor.status.total).elem
            )
        );
    }
}

function getImages(parent: HTMLElement) {
    return Array.from(parent.getElementsByTagName('img'));
}

function imageScrUpdated(e: Event) {
    const img = e.target as HTMLImageElement;
    img.removeEventListener('load', imageScrUpdated);
    img.setAttribute('width', img.naturalWidth + '');
    img.setAttribute('height', img.naturalHeight + '');
}