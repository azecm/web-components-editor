import styleUploadPanel from './UploadPanel.scss';
import iconAudio from '../icon/audio.svg';
import iconVideo from '../icon/video.svg';
import {Button, CSSStyle, dialog, Div, getShadow, IElem, Img, Input, Span, SVG} from "element";
import {EFileType, getFileType, IAttach} from "../editor-const";
import {IEditor} from "../Editor";
import {connectPostForm} from "api";


export class EditorUploadPanel {
    elem = {
        container: new UploadPanelTag(),
        btnSelect: Button(),
        inputFile: Input(),
        progress: Div(),
        upload: Div(),
        preview: Div()
    };
    files!: File[];
    editor: IEditor;

    constructor(editor: IEditor) {
        this.editor = editor;
        this.view();
    }

    private onChange() {
        this.files = [];
        const files = this.elem.inputFile.el.files;
        if (files) {
            for (const f of Array.from(files)) {
                if (getFileType(f.name)) {
                    this.files.push(f);
                }
            }
        }
        this.elem.upload.asNone(!this.files.length);
        this.viewUpload();
    }

    private send(){
        const form = new FormData();
        form.append('idn', this.editor.data.nodeSrc.idn.toString());
        form.append(this.editor.isEditor ? 'flagNode' : 'flagCatalog', 'true');
        for(const f of this.files){
            form.append('files', f);
        }
        connectPostForm('files', form, this.sendProgress.bind(this), this.sendResult.bind(this), this.sendError.bind(this));
    }

    private sendProgress(val:string){
        this.elem.progress.text(val);
    }

    private sendResult(data:IAttach[]){
        this.sendReset();
        for(const row of data){
            //this.editor.data.nodeSrc.attach.push(row);
            this.editor.catalog.addItem(row);
        }
        this.editor.sidebar.updateArticleImages();
    }

    private sendError(){
        this.sendReset();
        dialog().alert('Ошибка при отправке');
    }

    private sendReset(){
        this.elem.btnSelect.disabled(false);
        this.elem.inputFile.disabled(false);
        this.elem.progress.text('');
    }

    private onSend() {
        if(!this.files.length) return;
        this.send();
        this.elem.btnSelect.disabled(true);
        this.elem.inputFile.disabled(true);
        this.files = [];
        this.elem.upload.asNone();
        this.elem.preview.drop();

        const input = this.elem.inputFile.el;
        input.type = 'text';
        input.type = 'file';
    }

    private viewUpload(){
        const list = [] as IElem[];
        for(const f of this.files){
            const el = Span().title(f.name);
            list.push(el);
            switch (getFileType(f.name)) {
                case EFileType.image:{
                    imageIcon(Img().as('icon').lastIn(el).el, f);
                    break;
                }
                case EFileType.audio:{
                    SVG().content(iconAudio).as('icon').lastIn(el);
                    break;
                }
                case EFileType.video:{
                    SVG().content(iconVideo).as('icon').lastIn(el);
                    break;
                }
            }
        }

        this.elem.preview.drop().append(list);
    }

    private view() {
        getShadow(this.elem.container, [
            CSSStyle().content(styleUploadPanel),
            this.elem.btnSelect.as('select-button').append(
                'выбрать',
                this.elem.inputFile
                    .type('file')
                    .attr('accept', 'image/x-png,image/jpeg,image/svg+xml,video/mp4,audio/mpeg')
                    .attr('multiple', '')
                    .max(30)
                    .on('change', this.onChange.bind(this))
            ),
            this.elem.progress,
            this.elem.preview.as('uploader-preview'),
            this.elem.upload.as('upload-button').asNone().append(
                Button().text('загрузить').click(this.onSend.bind(this))
            )
        ]);
    }
}

class UploadPanelTag extends HTMLElement {
    static tag = 'upload-panel';
}

window.customElements.define(UploadPanelTag.tag, UploadPanelTag);

// ======

function imageIcon(imgTarget:HTMLImageElement, file: File) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = ()=>{
        URL.revokeObjectURL(url);
        imageIconNext(imgTarget, img, file);
    };
    img.src = url;
}

function imageIconNext(imgTarget:HTMLImageElement, imgSource:HTMLImageElement, file: File) {
    const w = imgSource.naturalWidth;
    const h = imgSource.naturalHeight;
    const k = w > h ? 80.0 / w : 80.0 / h;
    const w2 = Math.round(k * w);
    const h2 = Math.round(k * h);

    const cv = document.createElement('canvas');
    cv.width = w2;
    cv.height = h2;
    const cx = cv.getContext('2d') as CanvasRenderingContext2D;
    cx.drawImage(imgSource, 0, 0, w2, h2);

    const url = cv.toDataURL(file.type, 0.95);
    const onload = ()=>{
        URL.revokeObjectURL(url);
        imgTarget.removeEventListener('load', onload);
    };
    imgTarget.addEventListener('load', onload);
    imgTarget.src = url;
}