import styleSideBar from './SideBar.scss';
import {Button, CSSStyle, Div, EL, eventStop, getShadow, IElemImage, Img, Input, Span} from "element";
import {IEditor} from "../Editor";
import {getSrcByKey} from "../editor-const";
import {IEditableBlock} from "../EditableBlock/EditableBlock";
import {EditorUploadPanel} from "./UploadPanel";
import {CatalogItem} from "../Catalog/CatalogItem";

export class EditorSideBar {
    elem = {
        container: EL(new SideBarTag()),
        btnSwitch: Button(),
        preview: Div(),
        searchBlock: Div(),
        searchResult: Div().as('search-result'),
    };
    editor: IEditor;

    private scrollEditor = 0;
    private scrollCatalog = 0;

    constructor(editor: IEditor) {
        this.editor = editor;
    }

    private onEditorState() {
        this.editor.isEditor = !this.editor.isEditor;
        this.viewEditorState();
    }

    private viewEditorState() {
        const {isEditor} = this.editor;
        this.elem.btnSwitch.text(isEditor ? 'В каталог' : 'В редактор');
        this.elem.preview.asNone(!isEditor);

        const scrollTop = document.documentElement.scrollTop;
        if (isEditor) {
            this.scrollCatalog = scrollTop;
        } else {
            this.scrollEditor = scrollTop;
        }

        this.elem.searchBlock.asNone(isEditor);
        this.editor.elemEditor.asNone(!isEditor);
        this.editor.catalog.elem.container.asNone(isEditor);

        if (isEditor) {
            document.documentElement.scrollTop = this.scrollEditor;
        } else {
            document.documentElement.scrollTop = this.scrollCatalog;
        }

        if (isEditor) {
            this.updateArticleImages();
        }

        this.editor.panel.hide();
    }

    updateArticleImages() {
        if (!this.editor.data) return;
        const list = [] as IElemImage[];
        for (const item of this.editor.catalog.items) {
            const flagNode = item.flagNode;
            if (item.src && flagNode) {
                list.push(
                    Img().src(getSrcByKey(item.src, 150)).onDown(eventStop).click(() => new ImageToEditable(this.editor, item.src))
                );
            }
        }
        this.elem.preview.drop().append(list);
    }

    findCommentsOnClick(e: Event) {
        const el = e.target as HTMLElement;
        const idf = el.dataset?.idf ?? 0;
        if (idf) {
            const item = this.editor.catalog.byIdf(+idf);
            if (item) {
                const rect = item.elem.container.el.getBoundingClientRect();
                scrollTo({
                    behavior: "auto",
                    top: rect.top + window.scrollY - 50
                });
                item.selected();

                setTimeout(()=>{
                    const rect = item.elem.container.el.getBoundingClientRect();
                    scrollTo({
                        behavior: "smooth",
                        top: rect.top + window.scrollY - 50
                    });
                }, 300);
            }
        }
    }

    findComments(_e: Event) {
        const e = _e as KeyboardEvent;
        if (e.code == 'Enter') {
            CatalogItem.dropLastSelected();
            this.elem.searchResult.drop();
            const target = e.target as HTMLInputElement;
            const val = target.value.trim();
            if (val) {
                const regs = val.split(' ').filter(v => !!v).map(v => new RegExp(v, 'i'));
                let ind = 0;
                for (const item of this.editor.catalog.items) {
                    const sum = regs.map(re => re.test(item.content) ? 1 as number : 0 as number).reduce((a, b) => a + b)
                    if (sum == regs.length) {
                        this.elem.searchResult.append(
                            Span().text(++ind).attr('data-idf', item.idf)
                        );
                    }
                    if (ind > 50) {
                        this.elem.searchResult.append(
                            Span().text('...')
                        )
                        break;
                    }
                }
            }

        }

    }

    view() {
        this.viewEditorState();
        this.elem.container.asNone(this.editor.data.isNew);
        getShadow(this.elem.container.el, [
            CSSStyle().content(styleSideBar),
            Div().as('main').append(
                this.elem.searchBlock.append(
                    Input().typeText().on('keydown', this.findComments.bind(this)),
                    this.elem.searchResult.click(this.findCommentsOnClick.bind(this))
                ),
                Div().as('switch').append(
                    this.elem.btnSwitch.click(this.onEditorState.bind(this))
                ),
                new EditorUploadPanel(this.editor).elem.container,
                this.elem.preview.as('preview')
            )
        ]);
    }
}

class ImageToEditable {
    current: IEditableBlock;
    range: Range;
    imgLeft: boolean;

    constructor(editor: IEditor, src: string) {
        this.imgLeft = editor.imgLeft;
        const current = this.current = editor.current;
        const range = this.range = editor.current.getRange() as Range;
        if (range && current) {
            this.loaded = this.loaded.bind(this);
            const img = new Image();
            img.addEventListener('load', this.loaded);
            img.src = getSrcByKey(src, 250);
        }
    }

    private loaded(e: Event) {
        const img = e.target as HTMLImageElement;
        img.removeEventListener('load', this.loaded);
        img.classList.add(this.imgLeft ? 'imgl' : 'imgr');
        img.setAttribute('width', img.naturalWidth.toString());
        img.setAttribute('height', img.naturalHeight.toString());
        this.range.insertNode(img);
    }
}

class SideBarTag extends HTMLElement {
    static tag = 'editor-sidebar';
}

window.customElements.define(SideBarTag.tag, SideBarTag);