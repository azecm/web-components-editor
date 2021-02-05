import {EL, Input, isEnterKey} from "element";
import {inputLinkPathElem} from "./InputLinkPath";
import {IEditor} from "./Editor";

export function inputLinkText(editor: IEditor){
    return Input().typeText()
        .placeholder('Текст с')
        .as('input-elem input')
        .attr('maxlength', '80')
        .setValue(editor.data.nodeSrc.linkText)
        .onInput((e)=>onInputText(e, editor))
        .on('keydown', (e)=>onKeydownText(e, editor));
}

function onInputText(e: Event, editor: IEditor) {
    const input = e.target as HTMLInputElement;
    editor.data.nodeUpd.linkText = input.value.trim();
}

function onKeydownText(e: Event, editor: IEditor) {
    if (!isEnterKey(e)) return;
    e.preventDefault();

    const input = e.target as HTMLInputElement;
    const scriptCallback = 'tmp_' + new Date().getTime();

    (window as any)[scriptCallback] = function (response: any) {
        if (response.code == 200) {
            editor.data.nodeUpd.linkPath = inputLinkPathElem.el.value = (response.text[0] as string).replace(/[^0-9a-z]/gi, ' ').trim().replace(/\s+/gi, '-').slice(0, 65);
        }
        delete ((<any>window)[scriptCallback]);
        script.remove();
    };

    const param = new URLSearchParams();
    param.append('key', 'trnsl.1.1.20150803T192813Z.65efec24081129b9.7af6a75b3d6a07ea32e2e53263b2496dc4670fb6');
    param.append('text', input.value.trim());
    param.append('lang', 'ru-en');
    param.append('callback', scriptCallback);

    const script = EL('script')
        .attr('src', 'https://translate.yandex.net/api/v?' + param.toString())
        .attr('type', 'text/javascript')
        .attr('async', 'true').body();
}

