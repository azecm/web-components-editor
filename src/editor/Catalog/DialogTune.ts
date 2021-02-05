import styleDialogTune from './DialogTune.scss';
import {CatalogItem, ICatalogItem} from "./CatalogItem";
import {dialog, Div, eventStop, Img, Select, Span} from "element";
import {getSrcByKey, reIsImage} from "../editor-const";
import {quizMap} from "./_catalog-common";

export class DialogTune {
    item: ICatalogItem;
    elem = {
        image: Img(),
        progress: Span().asNone(),
        group: Div()
    };

    quiz: string;
    group: number[];
    dragItem?: ICatalogItem;

    constructor(item: ICatalogItem) {
        this.dragEnd = this.dragEnd.bind(this);
        this.dragOver = this.dragOver.bind(this);

        this.item = item;
        this.quiz = this.item.quiz;
        this.group = Array.from(this.item.group);
        this.item.catalog.tuneOpen(this.groupAdd.bind(this), this.group);
        this.view();
    }

    private onDragOver(_e: Event) {
        eventStop(_e);
        const e = _e as DragEvent;
        if (e.dataTransfer) {
            e.dataTransfer.dropEffect = e.dataTransfer.items && e.dataTransfer.items.length == 1 ? 'move' : 'none';
        }
    }

    private onDrop(_e: Event) {
        eventStop(_e);
        const e = _e as DragEvent;
        if (!e.dataTransfer) return;
        const files = e.dataTransfer.files;
        if (files && files.length == 1) {
            if (reIsImage.test(files[0].name) || files[0].name.endsWith('.mp4')) {
                this.elem.progress.asNone(false);
                this.item.catalog.editor.data.catalogUpdate(this.item.idf, files[0], this.dropProgress.bind(this), this.dropFinish.bind(this), this.dropError.bind(this));
            } else {
                dialog().alert('Только изображения в форматах: .jpg .png .svg');
            }
        }
    }

    private dropProgress(val: string) {
        this.elem.progress.text(val);
    }

    private dropFinish(data: { src: string } | string) {
        this.elem.progress.asNone();
        if (typeof (data) == 'object' && data.src) {
            dialog().alert('Файл обновлен');
        } else {
            this.updateImage();
        }
    }

    private dropError() {
        this.elem.progress.asNone();
        dialog().alert('Ошибка при обновлении...');
    }

    private onImageClick(_e: Event) {
        const {src} = this.item;
        if (!src) return;
        if (!src.endsWith('.jpg') && !src.endsWith('.png')) return;
        const e = _e as MouseEvent;
        const img = e.target as HTMLImageElement;
        const flagLeft = e.offsetX / img.offsetWidth < 0.5;

        dialog()
            .confirm(flagLeft ? 'Повернуть налево?' : 'Повернуть направо?')
            .onConfirm(() => this.rotateBegin(!flagLeft));
    }

    private rotateBegin(flagRight: boolean) {
        this.item.catalog.editor.data.catalogRotate(this.item.idf, flagRight, this.updateImage.bind(this));
    }

    private updateImage() {
        const src = getSrcByKey(this.item.src, 150) + '?' + Date.now();
        this.elem.image.src(src);
        const img = this.item.elem.image.el.firstChild as HTMLImageElement;
        if (img && img.src) {
            img.src = src;
        }
        this.item.catalog.editor.imageRotate(this.item.src);
    }

    private getItemImage(idf: number) {
        return this.elem.group.el.querySelector(`[data-idf="${idf}"]`) as HTMLElement;
    }

    private groupAdd(item: CatalogItem) {
        if (this.group.includes(item.idf)) {
            this.getItemImage(item.idf).remove();
            this.group.splice(this.group.indexOf(item.idf), 1);
        } else {
            if (this.addGroupItem(item)) {
                this.group.push(item.idf);
            }
        }

        item.viewGroupItem(this.group.includes(item.idf));
    }

    private addGroupItem(item: CatalogItem) {
        const elem = item.setIcon(this.elem.group, true);
        if (elem) {
            elem.attr('data-idf', item.idf)
                .on('dragstart', () => this.dragStart(item))
                .on('dragend', this.dragEnd)
                .on('dragover', this.dragOver)
                .on('drop', (e) => this.dragDrop(e, item))
            ;
        }
        return elem;
    }

    private dragDrop(_e: Event, item: CatalogItem) {
        eventStop(_e);
        if (!this.dragItem) return;

        const idfDrag = this.dragItem.idf;
        const idfTarget = item.idf;
        if (idfDrag == idfTarget) return;

        this.group.splice(this.group.indexOf(idfDrag), 1);

        const index = this.group.indexOf(idfTarget);
        this.group.splice(index, 0, idfDrag);

        const imgDrag = this.getItemImage(idfDrag);
        const imgTarget = this.getItemImage(idfTarget);
        imgTarget.before(imgDrag);
    }

    private dragStart(item: CatalogItem) {
        this.dragItem = item;
    }

    private dragEnd() {
        this.dragItem = void (0);
    }

    private dragOver(_e: Event) {
        if (this.dragItem) {
            eventStop(_e);
            const e = _e as DragEvent;
            if (e.dataTransfer) {
                e.dataTransfer.dropEffect = 'move';
            }
        }
    }

    private view() {
        for (const idf of this.group) {
            const item = this.item.catalog.byIdf(idf);
            if (item) this.addGroupItem(item)
        }

        const form = Div().append(
            Div().as('main').append(
                Span().as('main-image')
                    .on('dragover', this.onDragOver.bind(this))
                    .on('drop', this.onDrop.bind(this))
                    .append(
                        this.elem.image.src(getSrcByKey(this.item.src, 150) + '?' + Date.now()).click(this.onImageClick.bind(this)),
                        this.elem.progress.as('main-image-progress')
                    ),
                Span().as('main-param').append(
                    Select().append(
                        Array.from(quizMap.entries()).map(
                            ([k, v]) => new Option(v, k)
                        )
                    ).bind(this, 'quiz')
                )
            ),
            this.elem.group.as('groups')
        );
        dialog()
            .backLeft(this.item.elem.editor.el.offsetLeft)
            .css(styleDialogTune)
            .form(form, '<b>Настройка отображения</b>')
            .onConfirm(this.onConfirm.bind(this))
            .onCancel(this.onClose.bind(this));
    }

    private onClose() {
        this.item.catalog.tuneClose();
    }

    private onConfirm() {

        if (this.quiz != this.item.quiz) {
            this.item.setQuiz(this.quiz).viewQuizName();
        }

        const groupPrev = this.item.group;
        let groupUpdated = this.group.length != groupPrev.length;
        if (!groupUpdated) {
            for (let i = 0; i < this.group.length; i++) {
                if (groupPrev[i] != this.group[i]) {
                    groupUpdated = true;
                    break;
                }
            }
        }
        if (groupUpdated) {
            this.item.setGroup(this.group);
            this.item.viewGroup();
        }

        this.item.catalog.tuneClose();
    }
}