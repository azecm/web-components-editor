import stylePageAbout from './PageAbout.scss';
import {connectPostJson, siteAdminParam} from "api";
import {Anchor, Button, CSSStyle, dialog, Div, EL, IElem, Input, Table, TBody, TD, TR} from "element";

export class PageAbout {
    data!: IUserData;
    userPage: string;
    btnSave = Button();
    constructor(userPage: string) {
        this.userPage = userPage;
        connectPostJson('user', {uri: 'user', user: userPage}, this.loaded.bind(this));
    }

    private loaded(data: IUserData) {
        this.data = data;
        const tbody = TBody();
        CSSStyle().content(stylePageAbout).toHead();
        Div().as('container').append(
            EL('h1').append('Пользователь ' + this.userPage),
            Table().append(
                tbody.append(
                    TR().append(
                        TD().text('Всего статей:'),
                        TD().append(
                            Anchor().href(siteAdminParam.pathUser(this.userPage) + '/').text(data.all)
                        )
                    ),
                    TR().append(
                        TD().text('Дата регистрации:'),
                        TD().text(data.add)
                    ),
                    TR().append(
                        TD().text('Последний визит:'),
                        TD().text(data.last)
                    )
                )
            )
        ).body();

        if (siteAdminParam.u1 === this.userPage) {
            this.viewSelf(tbody);
        } else {
            this.viewOther(tbody);
        }
    }

    private onSave() {
        this.btnSave.disabled(true).text('отправка');
        connectPostJson('user',
            {
                uri: 'use',
                user: siteAdminParam.u1,
                param: this.data.u2,
                descr: this.data.descr,
                webpage: this.data.page
            },
            this.saved.bind(this),
            this.error.bind(this)
        );
    }

    private error(){
        this.btnReset();
        dialog().alert('Ошибка при сохранении данных.')
    }

    private saved() {
        this.btnReset();
    }

    private btnReset(){
        this.btnSave.disabled(false).text('Сохранить');
    }

    private viewSelf(tbody: IElem) {

        const {data} = this;
        const userEmail = data.data[1].replace('&&', '@');
        tbody.append(
            TR().append(
                TD().text('Email:'),
                TD().text(userEmail)
            ),
            TR().append(
                TD().text('Пароль:'),
                TD().append(Input().bind(data, 'u2', data.data[2]).typeText())
            ),
            TR().append(
                TD().text('Web page:'),
                TD().append(Input().bind(data, 'page').typeText().placeholder('Web page'))
            ),
            TR().append(
                TD().text('О себе:'),
                TD().append(Input().bind(data, 'descr').typeText().placeholder('О себе'))
            ),
            TR().append(
                TD(),
                TD().as('save').append(this.btnSave.text('Сохранить').click(this.onSave.bind(this)))
            )
        );
    }

    private viewOther(tbody: IElem) {
        tbody.append(
            TR().append(
                TD().text('Web page:'),
                TD().text(this.data.page)
            ),
            TR().append(
                TD().text('О себе:'),
                TD().text(this.data.descr)
            )
        );
    }
}

interface IUserData {
    add: string
    all: number
    descr: string
    last: string
    page: string

    data: string[]
    u2: string
}