import style from './menu.scss';
import iconHome from 'icon/home.svg';
import iconArticles from 'icon/articles.svg';
import iconLog from 'icon/log.svg';
import iconNews from 'icon/news.svg';
import iconSignOut from 'icon/sign-out.svg';
import iconStat from 'icon/stat.svg';
import iconTag from 'icon/tag.svg';
import iconTree from 'icon/tree.svg';
import iconUser from 'icon/user.svg';
import {Anchor, getShadow, CSSStyle, IElem} from "element";
import {siteAdminParam} from "api";
import {testHostFlag} from "env";

export class AdminMenu extends HTMLElement {
    static tag = 'admin-menu';

    constructor() {
        super();

        const flagAdd = testHostFlag || location.hostname.endsWith('toy.com');

        const list = [] as IElem[];

        for (const row of siteAdminParam.menu) {
            const l = row.split(':');
            const el = Anchor().title(l[0]);
            list.push(el);
            switch (l.length) {
                case 1: {
                    el.href(siteAdminParam.pathUser(siteAdminParam.u1)).title('Страница пользователя').append(iconUser);
                    list.push(
                        Anchor().href(siteAdminParam.pathUser(siteAdminParam.u1) + '/').title('Список статей').append(iconArticles)
                    );
                    break;
                }
                case 3: {
                    let icon: string = '';
                    switch (l[1]) {
                        case 'home':
                            icon = iconHome;
                            break;
                        case 'verify':
                            icon = iconNews;
                            break;
                        case 'struct':
                            icon = iconTree;
                            break;
                        case 'theme':
                            icon = iconTag;
                            break;
                        case 'stat':
                            icon = iconStat;
                            break;
                    }
                    el.href(siteAdminParam.pathAdmin(l[2])).append(icon);
                    if (l[1] == 'stat' && flagAdd) {
                        list.push(
                            Anchor().href(siteAdminParam.pathAdmin(l[2].replace('/statistic', '/log'))).title('Логи').append(iconLog)
                        );
                    }
                    break;
                }
            }
        }

        list.push(
            Anchor().href('#').title('Выход').click(onExit).append(iconSignOut)
        );

        getShadow(this, [
            CSSStyle().content(style),
            list
        ]);

        this.style.marginBottom = '1em';
    }

}

function onExit() {
    siteAdminParam.session.reset();
    location.reload();
}

window.customElements.define(AdminMenu.tag, AdminMenu);
