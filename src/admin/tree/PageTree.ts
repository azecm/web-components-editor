import stylePageTree from './PageTree.scss';
import stylePageTreeDialog from './PageTree.dialog.scss';
import iconFolder from 'icon/folder.svg';
import iconArticle from 'icon/article.svg';
import iconPencil from 'icon/pencil.svg';
import iconParam from 'icon/param.svg';
import iconTrash from 'icon/trash.svg';

import {Anchor, Button, CSSStyle, dialog, Div, EL, IElem, Input, InputCheckbox, LI, Select, Span, UL} from "element";
import {connectGetJson, connectPostJson, siteAdminParam} from "api";

// TODO проблемы с созданием новых папок (сервер не видит новой папки)

const pathTree = 'tree';

export class PageTree {

    elemPath = Div().as('path');
    elemPages = Div().as('pages');
    elemItems = UL().as('items');

    tools = new TreeTools(this);

    itemCur?: TreeItem;

    data!: IDataTree;
    idp!: number;

    constructor() {
        this.onHashChange = this.onHashChange.bind(this);
        this.view();
        window.addEventListener('hashchange', this.onHashChange);
        if (testHash()) {
            this.loadByHash();
        } else {
            this.load(0, 1);
        }
    }

    load(idp: number, page: number) {
        connectGetJson(pathTree + `?idp=${idp}&page=${page}`, (data) => this.loaded(data, idp));
    }

    loaded(data: IDataTree, idp: number) {
        this.data = data;
        this.idp = idp;
        this.viewPages();
        this.viewPath();
        this.viewItems();
    }

    loadByHash() {
        const m = location.hash.match(reHash);
        if (!m) return;
        const idp = parseInt(m[1], 10);
        let page = m[2] ? parseInt(m[2], 10) : 1;
        if (this.data && this.idp == idp) {
            if (page > this.data.pages || page == 0) return;
        }
        this.load(idp, page);
    }

    onHashChange() {
        if (!reHash.test(location.hash)) return;
        this.loadByHash();
    }

    onAdd() {
        connectPostJson(
            pathTree,
            {route: 'add', idp: this.idp, page: this.data.page},
            this.addResult.bind(this),
            this.addError.bind(this)
        );
    }

    private addResult(itemData: IDataItem) {
        new TreeItem(this, itemData).container.lastIn(this.elemItems);
    }

    private addError() {
        dialog().alert('Ошибка при добавлении');
    }

    viewPath() {
        this.elemPath.drop().append(
            this.data.parents.map(item => Anchor().href(`#${item.idp}`).text(item.path))
        );
    }

    viewPages() {
        const list = [] as IElem[];
        const all = this.data.pages;

        if(all>1) {
            const current = this.data.page - 1;
            const delta = 5;
            const delta1 = delta + 1;
            let flag = false;
            for (let i = 0; i < all; i++) {
                if (i < delta ||
                    i > all - delta1 ||
                    (current - delta < i && current + delta > i)
                ) {
                    const ind = i + 1;
                    list.push(
                        Anchor()
                            .href(`#${this.idp}-${ind}`)
                            .text(ind)
                            .as('page-num')
                            .as(ind == this.data.page ? 'selected' : null)
                    );
                    flag = true;
                } else {
                    if (flag) {
                        list.push(Span().text('...'));
                        flag = false;
                    }
                }
            }
        }

        this.elemPages.drop().append(list);
    }

    onItemEnter(item: TreeItem) {
        this.tools.container.lastIn(item.container);
        this.itemCur = item;
    }

    viewItems() {
        const items = [] as IElem[];
        for (const item of this.data.items) {
            items.push(new TreeItem(this, item).container);
        }
        this.elemItems.drop().append(items);
    }

    view() {
        CSSStyle().content(stylePageTree).toHead();
        EL('h1').text('Структура сайта').body();
        Div().as('container').append(
            Div().as('add').append(
                Button().text('добавить').click(this.onAdd.bind(this))
            ),
            this.elemPath,
            this.elemPages,
            this.elemItems
        ).body();
    }
}

class TreeItem {
    container = LI().as('item');
    private tree: PageTree;
    data: IDataItem;
    private inputText = Input().typeText().readonly(true).placeholder('текст ссылки').title('текст ссылки');
    private inputPath = Input().typeText().readonly(true).placeholder('адрес ссылки').title('адрес ссылки');
    flagEdit = false;

    constructor(tree: PageTree, data: IDataItem) {
        this.tree = tree;
        this.data = data;
        this.init();
    }

    edit(flag: boolean) {
        this.flagEdit = flag;
        this.inputText.readonly(!flag);
        this.inputPath.readonly(!flag);
        return this
    }

    save() {
        this.data.path = this.data.path.replace(/[^0-9a-zA-Z\-_@]/g, '');
        this.inputPath.setValue(this.data.path);
        const data = {
            route: 'edit',
            idn: this.data.idn,
            label: this.data.label,
            path: this.data.path
        };
        connectPostJson(pathTree, data, this.saved.bind(this), this.saveErr.bind(this));
    }

    private saved(data: 'ok') {
        if (data != 'ok') this.saveErr();
    }

    private saveErr() {
        dialog().alert(this.text(), 'Ошибка при сохранении');
    }

    private text() {
        return this.data.label + ' / ' + this.data.path;
    }

    delete() {
        dialog().confirm(this.text(), 'Нажмите ДА, для удаления.').onConfirm(this.deleteInit.bind(this));
    }

    private deleteInit() {
        connectPostJson(
            pathTree,
            {route: 'delete', idn: this.data.idn, host: location.hostname},
            this.deleteResult.bind(this),
            this.deleteError.bind(this)
        );
    }

    private deleteResult() {
        this.container.remove();
    }

    private deleteError() {
        dialog().alert(this.text(), 'Ошибка при удалении');
    }

    private init() {
        this.container.onEnter(this.enter.bind(this));
        if (this.data.isFolder) {
            Anchor().href(`#${this.data.idn}`).append(
                Span().as('icon').title('открыть папку').append(iconFolder)
            ).lastIn(this.container);
        } else {
            Span().as('folder-zero').lastIn(this.container);
        }

        Anchor().href(siteAdminParam.pathEdit(this.data.idn)).append(
            Span().as('icon').title('редактировать статью').append(iconArticle)
        ).lastIn(this.container);

        this.container.append(
            this.inputText.bind(this.data, 'label'),
            this.inputPath.bind(this.data, 'path')
        );
    }

    private enter() {
        this.tree.onItemEnter(this);
    }
}

class TreeTools {
    container = Div().as('tools');
    tree: PageTree;

    constructor(tree: PageTree) {
        this.tree = tree;
        this.container.append(
            Span().as('icon').click(this.onEditSwitch.bind(this)).append(iconPencil),
            Span().as('icon').click(this.onParam.bind(this)).append(iconParam),
            Span().as('icon').click(this.onDelete.bind(this)).append(iconTrash),
        );
    }

    private onEditSwitch() {
        const {itemCur} = this.tree;
        if (itemCur) {
            itemCur.edit(!itemCur.flagEdit);
            if (!itemCur.flagEdit) {
                itemCur.save();
            }
        }
    }

    private onParam() {
        if (!this.tree.itemCur) return;
        new DialogProperty(this.tree, this.tree.itemCur);
    }

    private onDelete() {
        if (this.tree.itemCur) {
            this.tree.itemCur.delete();
        }
    }
}

class DialogProperty {
    tree: PageTree;
    item: TreeItem;
    data!: IDataParam;

    prevDate!: string;
    prevIdp!: number;
    prevOrder!: number;
    prevFlagFolder!: boolean;
    flagReload!: boolean;

    constructor(tree: PageTree, item: TreeItem) {
        this.tree = tree;
        this.item = item;
        this.init();
    }

    private init() {
        connectPostJson(pathTree, {
            route: 'param-get',
            idn: this.item.data.idn
        }, this.initResult.bind(this), this.initError.bind(this));
    }

    private initError() {
        dialog().alert('Ошибка при получении свойств.');
    }

    private initResult(data: IDataParam) {
        this.data = data;
        const d = data.date;
        data.date = d.substring(0, d.indexOf('T'));
        data.time = d.substring(d.indexOf('T') + 1, d.indexOf('Z')).substring(0, 5);

        this.prevDate = data.date;
        this.prevOrder = data.order;
        this.prevIdp = data.idp;
        this.prevFlagFolder = data.flagFolder;

        const table = EL('table');
        const tbody = EL('tbody').lastIn(table);

        const tr = () => EL('tr');
        const td = () => EL('td');

        tbody.append(
            tr().append(
                td().text('Текст ссылки:'),
                td().text(data.label)
            ),
            tr().append(
                td().text('Адрес ссылки:'),
                td().text(data.path)
            ),
            tr().append(
                td().text('Флаги:'),
                td().as('flags').append(
                    InputCheckbox().title('папка').bind(data, 'flagFolder'),
                    InputCheckbox().title('запретить').bind(data, 'flagBlock'),
                    InputCheckbox().title('подтверждена').bind(data, 'flagValid'),
                )
            ),
            tr().append(
                td().text('№ пользователя:'),
                td().append(Input().type('number').bind(data, 'idu').as('max-width').min(1))
            ),
            tr().append(
                td().text('Дата публикации:'),
                td().append(Input().type('date').bind(data, 'date').as('max-width'))
            ),
            tr().append(
                td().text('Время публикации:'),
                td().append(Input().type('time').bind(data, 'time').as('max-width'))
            ),
            tr().append(
                td().text('Поряковый номер:'),
                td().append(Input().type('number').bind(data, 'order').as('max-width').attr('min', 1).attr('max', data.orderMax))
            ),
            tr().append(
                td().text('Перемещение:'),
                td().append(
                    Select().append(
                        data.tree.map(row => new Option(row.text, row.idp + ''))
                    ).bind(data, 'idp')
                )
            )
        );

        dialog().css(stylePageTreeDialog).form(table).onConfirm(this.confirm.bind(this));
    }

    private confirm() {

        const {flagFolder, flagBlock, flagValid, idu, order, idp, idn, date: dateNew, time} = this.data;

        this.flagReload = this.prevOrder != order || this.prevFlagFolder != flagFolder || this.prevIdp != idp;

        const dateText = `${dateNew}T${time}Z`;
        const date = isFinite(Date.parse(dateText)) ? dateText : this.prevDate;

        const data = {
            route: 'param-post',
            flagFolder, flagBlock, flagValid, idu, order, idp, idn, date
        };

        connectPostJson(pathTree, data, this.confirmResult.bind(this), this.confirmError.bind(this));
    }

    private confirmResult(data: 'ok') {
        if (data == 'ok') {
            if (this.flagReload) {
                window.location.reload();
            }
        } else {
            this.confirmError();
        }
    }

    private confirmError() {
        dialog().alert('Ошибка при созранении параметров')
    }

}


const reHash = /#(\d+)-?(\d+)?/;

function testHash() {
    return reHash.test(location.hash);
}

interface IDataTree {
    page: number
    pages: number
    parents: IDataParentItem[]
    items: IDataItem[]
}

interface IDataParentItem {
    idp: number
    path: string
}

interface IDataItem {
    idn: number
    label: string
    path: string
    isFolder: boolean

    flagEdit: boolean
    flagUpdated: boolean
}


interface IDataParam {
    flagFolder: boolean
    flagValid: boolean
    flagBlock: boolean
    idu: number
    order: number
    orderMax: number
    idp: number
    idn: number

    label: string
    path: string

    date: string
    time: string

    tree: IDataParamTreeItem[]
}

interface IDataParamTreeItem {
    idp: number
    text: string
}
