import {dialog, Div, em, GroupCheckbox, Input, InputCheckbox, Select} from "element";
import {attrClass, imageResized, namesDataOmit, namesDataParam, namesDataType, reIsImage, reSrc} from "../editor-const";
import {dialogLink} from "./DialogLink";
import {IEditor} from "../Editor";

const _imgl = 'imgl';
const _imgr = 'imgr';
const _name_width = 'width';
const _name_height = 'height';
const _name_alt = 'alt';

const _type = {
    image: 'image',
    catalog: 'catalog',
    slideshow: 'slideshow',
    quiz: 'quiz',
    audio: 'audio',
    video: 'video'
};

const _catalog = {
    left: 'left',
    right: 'right',
    col2: 'col2',
    col3: 'col3',
    col4: 'col4'
};

const _align = {
    left: 'left',
    right: 'right',
    text: 'text',
    center: 'center'
};

export function dialogImage(editor: IEditor, img: HTMLImageElement, userAdmin: boolean) {
    return new DialogImage(editor, img, userAdmin);
}

class DialogImage {

    img: HTMLImageElement;

    data = {
        alt: '',
        type: _type.image,
        catalogType: _catalog.left,
        align: '',
        width: 0,
        height: 0,
        size: 0,
        autoStart: false,
        omit: false
    };

    withTypeSelect = false;
    withTypeAudio = false;
    withTypeVideo = false;
    isSVG = false;

    prevAlign = '';

    selectCatalog = Select();
    inputWidth = Input();
    inputHeight = Input();
    inputAuto = InputCheckbox();
    groupAlign = GroupCheckbox();

    k = 1;

    userAdmin: boolean;
    editor: IEditor;

    constructor(editor: IEditor, img: HTMLImageElement, userAdmin: boolean) {
        this.editor = editor;
        this.img = img;
        this.userAdmin = userAdmin;
        this.init();
    }

    private _parent() {
        return this.img.parentNode?.nodeName == 'P' ? this.img.parentNode as HTMLElement : null;
    }

    private _getSrc() {
        return this.img.getAttribute('src') + '';
    }

    init() {
        this.isSVG = this._getSrc().endsWith('.svg');

        const {data, img} = this;
        data.alt = img.getAttribute(_name_alt) || '';

        data.align = _align.text;
        if (img.classList.contains(_imgl)) {
            data.align = _align.left;
        } else if (img.classList.contains(_imgr)) {
            data.align = _align.right;
        } else {
            const parent = this._parent();
            if (parent && parent.classList.contains(_align.center)) {
                data.align = _align.center;
            }
        }
        this.prevAlign = data.align;

        if (this.isSVG) {
            data.width = parseInt(img.getAttribute(_name_width) || '100', 10);
            data.height = parseInt(img.getAttribute(_name_height) || '100', 10);
            this.k = img.naturalWidth / img.naturalHeight;
        } else {
            const m = this._getSrc().match(reSrc);
            if (m) {
                data.size = parseInt(m[2] || '0', 10);
            }
        }

        data.omit = img.hasAttribute(namesDataOmit);

        this.initType();
        this.typeChanged();
        this.view();
    }

    private initType() {
        const attachElem = this.editor.catalog.bySrc(this._getSrc());
        if (!attachElem || !attachElem.group || !attachElem.group.length) {
            return;
        }

        const {data, img} = this;

        let withMP4 = false;
        let withMP3 = false;
        let withJPG = false;

        for (const idf of attachElem.group) {
            const row = this.editor.catalog.byIdf(idf);
            if (!row || !row.src) continue;
            if (reIsImage.test(row.src)) {
                withJPG = true;
            }
            if (row.src.endsWith('.mp4')) {
                withMP4 = true;
            }
            if (row.src.endsWith('.mp3')) {
                withMP3 = true;
            }
        }

        this.withTypeSelect = true;
        this.withTypeAudio = withJPG && withMP3;
        this.withTypeVideo = withJPG && withMP4;

        data.type = img.getAttribute(namesDataType) || _type.image;
        data.catalogType = _catalog.left;

        switch (data.type) {
            case _type.catalog:
                data.catalogType = img.getAttribute(namesDataParam) || _catalog.left;
                break;
            case _type.video:
                data.autoStart = img.hasAttribute(namesDataParam);
                break;
        }
    }


    private onWidth() {
        const val = this.data.width = this.inputWidth.el.valueAsNumber;
        this.data.height = Math.round(val / this.k);
        this.inputHeight.setValue(this.data.height);
    }

    private onHeight() {
        const val = this.data.height = this.inputHeight.el.valueAsNumber;
        this.data.width = Math.round(val * this.k);
        this.inputWidth.setValue(this.data.width);
    }

    private typeChanged() {
        this.selectCatalog.asNone(this.data.type != _type.catalog);
        this.inputAuto.asNone(this.data.type != _type.video);
    }

    view() {
        const form = Div().append(
            Div().append(
                Input().typeText().bind(this.data, 'alt').placeholder('альтернативный текст').style({width: '32em'})
            ),
            Div().style({float: 'right', display: 'flex', flexDirection: 'column'}).append(
                InputCheckbox().bind(this.data, 'omit').textRight('пропустить')
                    .title('не использовать для просмотра')
                    .style({marginBottom: em(0.2)}),
                this.withTypeSelect ? Select().append(
                    new Option('фото', _type.image),
                    new Option('каталог', _type.catalog),
                    new Option('слайды', _type.slideshow),
                    new Option('викторина', _type.quiz),
                    this.withTypeAudio ? new Option('аудио', _type.audio) : null,
                    this.withTypeVideo ? new Option('видео', _type.video) : null
                ).bind(this.data, 'type').on('change', this.typeChanged.bind(this)) : null,
                this.withTypeSelect ? this.selectCatalog.style({fontSize: '0.8em'}).append(
                    new Option('фото слева', _catalog.left),
                    new Option('фото справа', _catalog.right),
                    new Option('2 колонки', _catalog.col2),
                    new Option('3 колонки', _catalog.col3),
                    new Option('4 колонки', _catalog.col4),
                ).bind(this.data, 'catalogType').on('change', () => this.groupAlign.activate(2)) : null,
                this.withTypeSelect ? this.inputAuto.bind(this.data, 'autoStart').textRight('автостарт') : null
            ),
            Div().style({fontSize: '0.9em'}).append(
                this.groupAlign.setOptions(
                    InputCheckbox().textRight('слева').value(_align.left),
                    InputCheckbox().textRight('справа').value(_align.right),
                    InputCheckbox().textRight('по тексту').value(_align.text),
                    InputCheckbox().textRight('по центру').value(_align.center),
                ).bind(this.data, 'align')
            ),
            this.isSVG ? Div().style({fontSize: '0.9em', marginTop: '0.5em', marginBottom: '0.5em'}).append(
                'Ширина х высота: ',
                this.inputWidth.type('number').min(1).step(1).onInput(this.onWidth.bind(this)).setValue(this.data.width).title('ширина').style({width: '5em'}),
                ' x ',
                this.inputHeight.type('number').min(1).step(1).onInput(this.onHeight.bind(this)).setValue(this.data.height).title('высота').style({width: '5em'})
            ) : null,
            !this.isSVG ? Div().style({fontSize: '0.9em'}).append(
                GroupCheckbox().setOptions(
                    InputCheckbox().textRight('150').value(150),
                    InputCheckbox().textRight('250').value(250),
                    InputCheckbox().textRight('600').value(600),
                    InputCheckbox().textRight('max').value(0),
                ).bind(this.data, 'size')
            ) : null
        );

        dialog().form(form, '<b>Свойства изображения</b>').buttons(
            {text: 'ссылка', type: null, fn: this.onLink.bind(this)},
            {text: 'ОК', type: 'confirm'},
            {text: 'Отмена', type: 'cancel'},
            {text: 'удалить', type: 'cancel', fn: this.onRemove.bind(this)},
        ).onConfirm(this.onConfirm.bind(this));
    }

    private onLink() {
        dialogLink(this.editor, this.img, this.userAdmin);
    }

    private onRemove() {
        const {img} = this;
        const parent = img.parentNode as HTMLElement;
        if (parent && parent.nodeName == 'A' && !parent.innerText.trim()) {
            parent.remove();
        } else {
            img.remove();
        }
    }

    private onConfirm() {
        const {data, img} = this;
        img.alt = data.alt;

        if (this.isSVG) {
            img.setAttribute(_name_width, data.width.toString());
            img.setAttribute(_name_height, data.height.toString());
        } else {
            const m = this._getSrc().match(reSrc);
            if (m) {
                const prevSize = parseInt(m[2] || '0', 10);
                if (prevSize != data.size) {
                    img.addEventListener('load', imageResized);
                    img.setAttribute('src', `/file/${m[1]}${data.size ? '/' + data.size : ''}/${m[3]}.${m[4]}`);
                }
            }
        }

        const parent = this._parent();
        if (this.prevAlign != data.align && parent) {
            if (this.prevAlign == _align.center) {
                parent.classList.remove(_align.center);
                attrClass(parent);
            }
            img.classList.remove(_imgl, _imgr);
            attrClass(img);
            switch (data.align) {
                case _align.center:
                    parent.classList.add(_align.center);
                    break;
                case _align.left:
                    img.classList.add(_imgl);
                    break;
                case _align.right:
                    img.classList.add(_imgr);
                    break;
            }
        }


        img.removeAttribute(namesDataType);
        img.removeAttribute(namesDataParam);
        img.removeAttribute(namesDataOmit);
        if (data.type != _type.image) {
            img.setAttribute(namesDataType, data.type);
        }

        if(data.omit){
            img.setAttribute(namesDataOmit, '');
        }

        switch (data.type) {
            case _type.catalog:
                img.setAttribute(namesDataParam, data.catalogType);
                break;
            case _type.video:
                if (data.autoStart) {
                    img.setAttribute(namesDataParam, '{"checkAuto":true}');
                }
                break;
        }
    }
}
