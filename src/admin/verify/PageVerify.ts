import stylePageVerify from './PageVerify.scss';
import iconTrash from 'icon/trash.svg';
import iconArticle from 'icon/article.svg';
import iconExtLink from 'icon/external-link.svg';
import {
    Anchor,
    Button,
    CSSStyle,
    dialog,
    Div,
    EL,
    eventStop,
    IElem,
    IElemImage,
    Img,
    InputCheckbox,
    InputRange,
    LI,
    Span
} from "element";
import {connectGetJson, connectPostJson, siteAdminParam} from "api";
import {testHostFlag, testHostPref} from "env";

const pathVerify = 'verify';

const folderCache = '/file-host-anonym/';
const folderBase = '/file-host/';


export class PageVerify {

    container = Div().as('container').body();
    items!: MessageItem[];

    constructor() {
        CSSStyle().content(stylePageVerify).toHead();
        connectGetJson(pathVerify, this.loaded.bind(this))
    }

    private loaded(o: { node: INodeData[], attach: IMessageData[] }) {
        this.container.drop();
        this.items = [];

        if (!o.node.length && !o.attach.length) {
            EL('h1').text('Новых публикаций нет').lastIn(this.container);
        } else {
            this.viewNode(o.node);
            this.viewAttach(o.attach);

            Div().append(
                Button().as('confirm').text('подтвердить данные').click(this.onConfirm.bind(this))
            ).lastIn(this.container);
        }
    }

    private onConfirm() {
        const dels = [] as RemoveItem[];
        for (const item of this.items) {
            if (item.state.markDel) {
                //if (isV2) {
                    dels.push({idn: item.data.idn, idf: item.data.idf, host: item.data.host});
                //} else {
                //    dels.push({id: item.state.id, host: item.data.host} as RemoveItem);
                //}
            }
        }

        if (dels.length) {
            dialog().confirm('Удалить отмеченные записи?').onConfirm(() => this.deleteMarked(dels));
        } else {
            interface IConfirm {
                id?: string
                idn: number
                idf: number
                host: string
                like: number
                catalog: boolean
                content: string
            }

            const confirm = [] as IConfirm[];

            for (const m of this.items) {
                if (m.state.markDel) continue;
                const d = {idn: m.data.idn, idf: m.data.idf, host: m.data.host} as IConfirm;
                if (m.state.like) d.like = m.state.like;
                if (m.state.catalog) d.catalog = m.state.catalog;
                if (m.state.flagContentUpdated) d.content = m.data.content;
                confirm.push(d);
            }

            connectPostJson(pathVerify, {route: 'confirm', data: confirm}, this.loaded.bind(this));
        }
    }

    private deleteMarked(list: RemoveItem[]) {

        connectPostJson(pathVerify, {route: 'delete', data: list}, this.deleteMarkedResult.bind(this));
    }

    private deleteMarkedResult(res: 'ok') {
        if (res == 'ok') {
            const items = [] as MessageItem[];
            for (const item of this.items) {
                if (item.state.markDel) {
                    item.li.remove();
                } else {
                    items.push(item);
                }
            }
            this.items = items;
        }
    }

    private viewNode(list: INodeData[]) {
        if (!list.length) return;

        let host = '';
        EL('h1').text('Новые статьи').lastIn(this.container);
        const ul = EL('ul').as('items').lastIn(this.container);
        for (const row of list) {
            if (host != row.host) {
                host = row.host;
                if (host != location.hostname) {
                    LI().as('host-name').append(EL('h2').text(host)).lastIn(ul);
                }
            }
            const item = new NodeItem(row);
            item.li.lastIn(ul);
        }
    }

    private viewAttach(list: IMessageData[]) {
        if (!list.length) return;

        let host = '';
        EL('h1').text('Новые комментарии').lastIn(this.container);
        const ul = EL('ul').as('items').lastIn(this.container);
        for (const row of list) {
            if (host != row.host) {
                host = row.host;
                if (host != location.hostname) {
                    LI().as('host-name').append(EL('h2').text(host)).lastIn(ul);
                }
            }
            const item = new MessageItem(this, row);
            item.li.lastIn(ul);
            this.items.push(item);
        }
    }
}

class NodeItem {
    li = LI();
    private data: INodeData;
    private readonly isSelfHost: boolean;

    constructor(data: INodeData) {
        this.data = data;
        this.isSelfHost = this.data.host == location.hostname;
        this.view();
    }

    private onDelete() {
        dialog()
            .confirm('Удалить?', 'Нажмите ДА, для удаления.')
            .onConfirm(this.deleteConfirm.bind(this));
    }

    private deleteConfirm() {
        connectPostJson('tree', {
            route: 'delete',
            host: this.data.host,
            idn: this.data.idn
        }, this.deleteConfirmed.bind(this));
    }

    private deleteConfirmed(res: 'ok') {
        if (res == 'ok') {
            this.li.remove();
        }
    }

    private view() {
        const pathEdit = (this.isSelfHost ? '' : ('http://' + this.data.host)) + siteAdminParam.pathEdit(this.data.idn);
        this.li.append(
            Span().as('icon').title('удалить').click(this.onDelete.bind(this)).append(
                iconTrash
            ),
            ' · ',
            Anchor().as('icon').title('редактировать статью').href(pathEdit).blank().append(
                iconArticle
            ),
            ' · ',
            EL('i').text(this.data.user),
            ' · ',
            Span().text(this.data.folder),
            ' · ',
            EL('b').text(this.data.text),
            ' · ',
            Span().text(age(this.data.date))
        );
    }
}

interface INodeData {
    host: string;
    idn: number;
    user: string;
    folder: string;
    text: string;
    date: string;
}

function age(date: string) {
    let minutes = Math.round((Date.now() - Date.parse(date)) / (1000 * 60));

    const months = Math.floor(minutes / 43200);
    minutes = minutes % 43200;

    const day = Math.floor((minutes / 1440));
    minutes = minutes % 1440;

    const hours = Math.floor((minutes / 60));
    minutes = minutes % 60;

    const l = [] as string[];
    if (months > 0) l.push(`${months}мес.`);
    if (day > 0) l.push(`${day}дн.`);
    if (hours > 0) l.push(`${hours}ч`);
    if (minutes > 0) l.push(`${minutes}мин`);
    if (!l.length) l.push(`сейчас`);

    return l.join(' ');
}

class MessageItem {
    page: PageVerify;
    li = LI();
    private img!: IElemImage;
    content!: IElem;
    data: IMessageData;
    state = {} as IMessageState;

    private readonly isSelfHost: boolean;

    constructor(page: PageVerify, data: IMessageData) {
        this.page = page;
        this.data = data;
        this.isSelfHost = this.data.host == location.hostname;

        if (!data.user) {
            data.user = '/гость/';
        }
        if (!data.content) {
            data.content = '<p><br></p>';
        }

        this.state.flagAnonymous = data.flagAnonymous;

        this.state.id = (data.flagAnonymous ? data.anonym : data.idn + '-' + data.idf);



        if (this.data.src) {
            this.state.isSVG = this.data.src.endsWith('.svg');
        }

        this.view();
    }

    private markSwitch(e: Event) {
        eventStop(e);
        this.state.markDel = !this.state.markDel;
        this.li.as('del-mark', this.state.markDel);
    }

    private onIP(e: Event) {
        eventStop(e);
        dialog().confirm('Отметить все сообщения с этого ip?').onConfirm(this.ipMark.bind(this));
    }

    private ipMark() {
        for (const m of this.page.items) {
            if (m.data.ip == this.data.ip) {
                m.state.markDel = true;
                m.li.as('del-mark');
            }
        }
    }

    private onContent() {
        this.data.content = this.content.el.innerHTML;
        this.state.flagContentUpdated = true;
    }

    private onRotate(e: Event) {
        eventStop(e);
        if (this.state.isSVG) return;

        const em = e as MouseEvent;
        const flagRight = this.img.el.offsetWidth / 2 < em.offsetX;

        const message = flagRight ? 'Повернуть направо?' : 'Повернуть налево?';
        dialog().confirm(message).onConfirm(() => this.rotateBegin(flagRight));
    }

    private rotateBegin(flagRight: boolean) {
        const rotate: any = {
            side: flagRight ? 'right' : 'left',
            host: this.data.host
        };

        rotate.idn = this.data.idn;
        rotate.idf = this.data.idf;

        connectPostJson(pathVerify, {route: 'rotate', data: rotate}, this.rotateEnd.bind(this));
    }

    private rotateEnd(res: 'ok') {
        if (res == 'ok') {
            this.state.rotated = true;
            this.img.src(this.getSrcPreview());
        }
    }

    private getSrcFull(){
        let src: string;
        if (this.state.flagAnonymous) {
            const fileDir = this.isSelfHost ? '/file/' : (folderCache + this.data.host + '/');
            src = fileDir + this.data.src;
        } else {
            const fileDir = this.isSelfHost ? '/file/' : (folderBase + this.data.host + '/');
            src = fileDir + this.data.src;
        }
        if (testHostFlag) {
            src = testHostPref + src;
        }
        if (this.state.rotated) {
            src += '?' + Date.now();
        }
        return src;
    }

    private getSrcPreview() {

        let src: string;
        if (this.state.flagAnonymous) {
            const fileDir = this.isSelfHost ? '/file/' : (folderCache + this.data.host + '/');
            src = fileDir + (this.state.isSVG ? this.data.src : this.data.src.replace('/', '/150/'));
        } else {
            const fileDir = this.isSelfHost ? '/file/' : (folderCache + this.data.host + '/');
            if (this.state.isSVG) {
                src = fileDir + this.data.src;
            } else {
                src = fileDir + this.data.src.replace('/', '/150/');
            }
        }
        if (testHostFlag) {
            src = testHostPref + src;
        }
        if (this.state.rotated) {
            src += '?' + Date.now();
        }
        return src;
    }

    private view() {
        let image = null as null | IElem;
        if (this.data.src) {
            const src = this.getSrcPreview();
            this.img = Img().src(src)
                .as(this.state.isSVG ? 'svg-image' : null)
                .click(this.onRotate.bind(this));
            image = Div().as('image').append(
                InputCheckbox().title('в каталог').bind(this.state, 'catalog').value(false),
                this.img,
                //src.replace('/150/', '/')
                Anchor().as('icon').blank().href(this.getSrcFull()).append(iconExtLink)
            );
        }
        this.content = Div();
        this.li.append(
            Div().append(
                Span().as('icon')
                    .title('удалить')
                    .click(this.markSwitch.bind(this))
                    .append(iconTrash),
                ' · ',
                this.data.user,
                ' · ',
                this.data.folder,
                ' · ',
                Anchor().blank().href((this.isSelfHost ? '' : ('http://' + this.data.host)) + this.data.path).text(this.data.text),
                ' · ',
                age(this.data.date)
            ),
            Div().append(
                EL('i').append(
                    Span().as('ip').text(this.data.ip).click(this.onIP.bind(this)),
                    EL('small').as('browser').text(this.data.browser)
                )
            ),
            image,
            Div().as('like').append(
                InputRange().min(0).max(20).step(1).bind(this.state, 'like', 0)
            ),
            this.content.attr('contenteditable', 'true').on('blur', this.onContent.bind(this)).append(this.data.content),
            //EL('br').as('both')
        );
    }
}

type RemoveItem = { host: string, idn: number, idf: number };

interface IMessageState {
    id: string
    flagAnonymous: boolean
    flagContentUpdated: boolean
    markDel: boolean
    like: number
    catalog: boolean
    isSVG: boolean
    rotated: boolean
}

interface IMessageData {
    host: string;
    idn: number
    idf: number

    folder: string
    text: string
    path: string
    date: string
    content: string
    user: string
    src: string
    ip: string
    browser: string

    anonym: string
    flagAnonymous: boolean

}