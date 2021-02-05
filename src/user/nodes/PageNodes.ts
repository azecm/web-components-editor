import stylePageNodes from './PageNodes.scss';
import iconArticle from 'icon/article.svg';
import {Anchor, Button, CSSStyle, Div, EL, IElem, LI, Select, Span, UL} from "element";
import {connectPostJson, siteAdminParam} from "api";


export class PageNodes {
    userPage: string;
    pageNum!: number;
    pages!: number;
    elemParts = EL('p');
    elemPages = EL('p');
    elemList = UL();
    partsDefined = false;
    idp = -1;

    constructor(userPage: string) {
        this.loaded = this.loaded.bind(this);
        this.userPage = userPage;
        this.load(0);
        this.viewInit();
        window.addEventListener('hashchange', this.onHash.bind(this));
    }

    private onHash() {
        const hash = window.location.hash.substr(1);
        if (/^\d+$/.test(hash)) {
            const page = parseInt(hash, 10) - 1;
            if (page > -1 && page < this.pages) {
                this.load(page);
            }
        }
    }

    private load(num: number) {
        connectPostJson('user', {user: this.userPage, uri: 'list', pageNum: num}, this.loaded);
    }

    private loaded(data: IData) {
        this.pageNum = data.num;
        this.pages = data.all;

        this.viewPages();
        this.viewList(data.list);
        if (data.folders && !this.partsDefined) {
            this.viewParts(data.folders);
        }
    }

    private onAdd() {
        if (this.idp == -1) return;
        const newUrl = siteAdminParam.pathEdit('new-' + this.idp);
        window.open(newUrl, '_self');
    }

    private viewParts(folders: IFolderItem[]) {
        this.partsDefined = true;
        this.elemParts.append(
            'Статью в раздел ',
            Select().append(
                folders.map(item => new Option(item.text, item.value + ''))
            ).bind(this, 'idp'),
            ' ',
            Button().text('добавить').click(this.onAdd.bind(this))
        );
    }

    private viewPages() {
        const list = [] as IElem[];
        let flag = false;
        for (let i = 0; i < this.pages; i++) {
            if (i < 2 || i > this.pages - 3 || (this.pageNum - 2 < i && this.pageNum + 2 > i)) {
                const ind = i + 1;
                list.push(Anchor().href('#' + ind).text(ind).as('page-num').as(this.pageNum == i ? 'selected' : null));
                flag = true;
            } else {
                if (flag) {
                    list.push(Span().text('...'));
                    flag = false;
                }
            }
        }

        this.elemPages.drop().append(list);
    }

    private viewList(items: INodeItem[]) {

        const userSelf = this.userPage === siteAdminParam.u1;

        this.elemList.drop();
        for(const item of items){
            LI().append(
                Div().as('folder').text(item.parent),
                Div().as('row').append(
                    userSelf ? Anchor().href(siteAdminParam.pathEdit(item.idn)).as('icon').append(iconArticle).title('редактировать статью'):null,
                    Span().as('br'),

                    item.url ? Anchor().as('text').href(item.url).text(item.text) : Span().text(item.text),

                    item.commentAll>0 ? Span().as('comments').text(`[${item.commentAll}]`) : null,
                    item.commentLast>0 ? Span().as('comments-last').text(`+${item.commentLast}`):null
                )
            ).lastIn(this.elemList);
        }
    }

    private viewInit() {
        CSSStyle().content(stylePageNodes).toHead();
        Div().as('container').append(
            EL('h1').text(`Статьи пользователя ${this.userPage}`),
            this.elemParts,
            this.elemPages,
            this.elemList.as('nodes')
        ).body();
    }
}

interface IData {
    all: number
    num: number
    folders: IFolderItem[]
    list: INodeItem[]
}

interface IFolderItem {
    value: number
    text: string
}

interface INodeItem {
    idn: number
    commentAll: number
    commentLast: number
    parent: string
    text: string
    url: string
}