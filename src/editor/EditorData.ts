import {connectInit, connectPostForm, connectPostJson} from "api";
import {testHostName} from "env";
import {dialog} from "element";
import {attrClass, IAttach, INode} from "./editor-const";
import {IEditor} from "./Editor";
import {KeywordsJSON} from "../types";

const _pathEdit = 'edit';
const bgOnSave = 'body-bg-onsave';
const bgOnError = 'body-bg-onerror';

export type IEditorData = EditorData;

export class EditorData {
    nodeSrc!: INode;
    nodeUpd = {} as INode;
    labelsByText!: Map<string, number>;
    labelsByIdn!: Map<number, string>;
    keywordsList!: string[];
    keywordsCount!: { [s: string]: number };
    labelsLinked = new Set<number>();
    cssContent!: string;
    private waitSave!: boolean;
    private fnLoaded!: () => void;
    private editor: IEditor;

    constructor(editor: IEditor) {
        this.loadError = this.loadError.bind(this);
        this.editor = editor;
    }

    load(fn: () => void) {
        this.fnLoaded = fn;
        this.loadData();
        return this;
    }

    getLabels() {
        return Array.from(this.nodeUpd.labels || this.nodeSrc.labels);
    }

    setLabels(labels: number[]) {
        this.nodeUpd.labels = labels;
    }

    getKeywords() {
        return Array.from(this.nodeUpd.keywords || this.nodeSrc.keywords);
    }

    setKeywords(keywords: string[]) {
        this.nodeUpd.keywords = keywords;
    }

    private get hash() {
        return window.location.hash.substring(1);
    }

    get isNew() {
        return this.hash.startsWith('new-');
    }

    private loadError(e?: Error) {
        if (e) console.error(e);
        dialog().alert('Ошибка при загрузке данных');
    }

    private loadData() {
        const host = (testHostName || location.hostname) as string;

        const futures = [
            testHostName ?
                Promise.resolve('') :
                connectInit().simple().path(`/template-new/css/${host}/content.css?` + Date.now()).get().fetch().then(r => r.text()),
            connectInit().simple().path(`/json/keywords.json?` + Date.now()).get().fetch().then(r => r.json()),
        ];

        Promise.all(futures).then(this.loadedData.bind(this) as any).catch(this.loadError);
    }

    private loadedData(data: [string, KeywordsJSON]) {
        const labels = data[1].labels as { [s: string]: number };
        this.cssContent = data[0] as string;
        this.labelsByText = new Map(Object.entries(labels));
        this.labelsByIdn = new Map(Object.entries(labels).map(r => [r[1], r[0]]));
        this.keywordsList = data[1].keywords;
        this.keywordsCount = data[1].counter;
        if (data[1].linked) {
            this.labelsLinked = new Set(data[1].linked);
        }

        const route = this.isNew ? 'new' : 'load';
        const idn = parseInt(this.hash.substring(this.isNew ? 4 : 0), 10);
        connectPostJson(_pathEdit, {route, idn}, this.loadedNode.bind(this), this.loadError);
    }

    private loadedNode(data: any) {
        this.nodeSrc = data;
        this.nodeSrc.flagBook = !!this.nodeSrc.flagBook;
        if (this.fnLoaded) this.fnLoaded();
    }

    save() {
        if (this.isNew && this.waitSave) {
            return;
        }
        this.waitSave = true;

        if (this.nodeSrc.idp) {
            this.nodeUpd.idp = this.nodeSrc.idp;
        }

        const attach = [] as IAttach[];
        for (const item of this.editor.catalog.items) {
            const updated = item.getUpdated();
            if (updated) {
                attach.push(updated);
            }
        }
        if (attach.length) {
            this.nodeUpd.attach = attach;
        }

        const data = Object.assign({route: 'save', idn: this.nodeSrc.idn}, this.nodeUpd);

        connectPostJson(_pathEdit, data, this.saved.bind(this), this.saveError.bind(this));
        return this;
    }

    private saveError() {
        this.waitSave = false;
        document.body.classList.add(bgOnError);
        setTimeout(this.saveFinish.bind(this), 3000);
        this.editor.status.saveError();
    }

    private dropUpdateData() {
        for (const item of this.editor.catalog.items) {
            item.dropUpdated();
        }

        for (const key of Object.keys(this.nodeUpd) as (keyof INode)[]) {
            delete (this.nodeUpd[key]);
        }
    }

    private listUpdate<T>(listUpd: T[], listSrc: T[]) {
        while (listSrc.length) {
            listSrc.splice(0, 1);
        }
        for (const item of listUpd) {
            listSrc.push(item);
        }
    }

    private saved(result: string | { idn: number }) {
        this.waitSave = false;

        if (result == 'ok') {
            if (this.nodeUpd.linkPath) {
                this.nodeSrc.linkPath = this.nodeUpd.linkPath;
            }
            if (this.nodeUpd.labels) {
                this.listUpdate(this.nodeUpd.labels, this.nodeSrc.labels);
            }
            if (this.nodeUpd.keywords) {
                this.listUpdate(this.nodeUpd.keywords, this.nodeSrc.keywords);
            }
            this.dropUpdateData();
            const url = this.nodeSrc.folder + this.nodeSrc.linkPath;
            this.editor.status.saved(url);
            document.body.classList.add(bgOnSave);
            setTimeout(this.saveFinish.bind(this), 3000);
        } else if (typeof (result) == 'string' && result.startsWith('ok-')) {
            this.dropUpdateData();
            window.location.hash = '#' + (result.substring(result.indexOf('-') + 1));
        } else if (typeof (result) != 'string' && result.idn) {
            this.dropUpdateData();
            window.location.hash = '#' + (result.idn);
        } else {
            this.saveError();
        }
    }

    private saveFinish() {
        document.body.classList.remove(bgOnSave, bgOnError);
        attrClass(document.body);
    }

    private catalogPost(idf: number, route: string, message: string, obj: any, fn?: () => void) {
        const idn = this.nodeSrc.idn;
        obj = Object.assign({}, obj, {idn, idf, route});
        connectPostJson(_pathEdit, obj, data => this.catalogPostResult(data, message, fn), () => this.catalogPostError(message));
    }

    private catalogPostResult(data: 'ok', message: string, fn?: () => void) {
        if (data != 'ok') {
            this.catalogPostError(message);
        } else {
            if (fn) fn();
        }
    }

    private catalogPostError(message: string) {
        dialog().alert(message);
    }

    catalogDelete(idf: number, fn: () => void) {
        this.catalogPost(idf, 'delete', 'Ошибка при удалении...', {}, fn);
    }

    catalogRotate(idf: number, flagRight: boolean, fn: () => void) {
        this.catalogPost(idf, 'rotate', 'Ошибка при повороте...', {flagRight}, fn);
    }

    catalogMove(idf: number, order: number) {
        this.catalogPost(idf, 'order', 'Ошибка при перемещении...', {order});
    }

    catalogUpdate(idf: number, file: File, fnProgress: (val: string) => void, fnFinish: (data: any) => void, fnError: () => void) {
        const form = new FormData();
        form.append('idn', this.nodeSrc.idn.toString());
        form.append('idf', idf.toString());
        form.append('update', file);
        connectPostForm('update', form, fnProgress, fnFinish, fnError);
    }
}
