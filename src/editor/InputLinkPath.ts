import {Input, isEnterKey} from "element";
import {IEditor} from "./Editor";

export const inputLinkPathElem = Input();
export function inputLinkPath(editor:IEditor) {
    return inputLinkPathElem.typeText()
        .placeholder('Адрес ссылки')
        .as('input-elem input')
        .attr('maxlength', '65')
        .setValue(editor.data.nodeSrc.linkPath)
        .onInput((e)=>onInputPath(e, editor))
        .on('keydown', (e)=>onKeydownPath(e, editor))
        .on('blur', (e)=>onPathBlur(e,editor));
}

function onInputPath(e:Event, editor:IEditor) {
    const input = e.target as HTMLInputElement;
    editor.data.nodeUpd.linkPath = input.value.trim();
}

function onKeydownPath(e:Event, editor:IEditor) {
    if(isEnterKey(e)){
        e.preventDefault();
        window.open(
            editor.data.nodeSrc.folder + (e.target as HTMLInputElement).value,
            '_blank'
        );
    }
}

function onPathBlur(e:Event, editor:IEditor){
    const input = e.target as HTMLInputElement;
    const val = input.value = input.value.trim().replace(/[^@a-z0-9а-яё_-]+/gi, '-');
    const valPrev = editor.data.nodeUpd.linkPath || editor.data.nodeSrc.linkPath;
    if(val!=valPrev){
        editor.data.nodeUpd.linkPath = val;
    }
}