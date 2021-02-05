import styleBlockLogin from './login.scss';
import iconLogin from './iconLogin.svg';
import {Div, Input, isEnterKey} from "element";


import {CSSStyle, getShadow} from "element";
import {siteAdminParam} from "api";

const loginData = {na: '', pa: ''};

export function initLogin(fn: () => void) {
    document.body.appendChild(new UserLogin()._init(fn));
}

class UserLogin extends HTMLElement {
    static tag = 'user-login';
    _message = Div();
    _input1 = Input();
    _input2 = Input();
    _fnLoaded!: () => void;


    _init(fn: () => void){
        this._submit = this._submit.bind(this);
        this._fnLoaded = fn;
        this._view();
        return this;
    }

    connectedCallback() {
        this._input1.el.focus();
    }

    _onInpName(e: Event) {
        this._message.drop();
        if (isEnterKey(e)) {
            this._input2.el.focus();
        }
    }

    _onInpP(e: Event) {
        this._message.drop();
        if (isEnterKey(e)) {
            this._submit();
        }
    }

    _submit() {
        this._message.drop();
        siteAdminParam.session
            .onResult(this._submitResult.bind(this))
            .onError(this._submitError.bind(this))
            .open(loginData.na, loginData.pa)
    }

    _submitResult(){
        this.remove();
        siteAdminParam.initMenu();
        this._fnLoaded();
    }

    _submitError(){
        this._message.text('Ошибка при авторизации');
        this._input1.el.focus();
    }

    _view() {
        getShadow(this, [
            CSSStyle().content(styleBlockLogin),
            Div().as('field').append(
                this._input1.bind(loginData, 'na').title('И').placeholder('И').on('keydown', this._onInpName.bind(this))
            ),
            Div().as('field').append(
                this._input2.bind(loginData, 'pa').title('П').placeholder('П').on('keydown', this._onInpP.bind(this)),
                Div().as('enter-icon').click(this._submit).append(
                    iconLogin
                )
            ),
            this._message.as('message')
        ]);
    }
}


window.customElements.define(UserLogin.tag, UserLogin);
