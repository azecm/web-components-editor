import {isEnterKey, TextArea} from "element";
import {IEditor} from "./Editor";


const textArea = TextArea();
export function inputTitle(editor:IEditor) {
    setTimeout(titleSize, 1);
    return textArea
        .placeholder('Заголовок')
        .as('input-elem textarea')
        .attr('maxlength', 100)
        .setValue(editor.data.nodeSrc.title)
        .onInput((e)=>onInputTitle(e, editor))
        .on('keydown', onKeydownTitle)
        ;
}

function onKeydownTitle(e: Event) {
    if (!isEnterKey(e)) return;
    e.preventDefault();
}

function onInputTitle(e:Event, editor:IEditor) {
    const input = e.target as HTMLTextAreaElement;
    editor.data.nodeUpd.title = input.value.trim();
    titleSize();
}

function titleSize(){
    textArea.styleRemove();
    const el = textArea.el;
    if (el.scrollHeight > el.offsetHeight) {
        el.style.height = (el.scrollHeight + 2).toString() + 'px';
    }
}