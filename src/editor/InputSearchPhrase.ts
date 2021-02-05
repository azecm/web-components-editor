import {Div, em, Input, InputCheckbox} from "element";
import {IEditor} from "./Editor";


export function inputSearchPhrase(editor: IEditor) {
    return Div().style({display: 'flex', alignItems: 'center'}).append(
        InputCheckbox()
            .style({marginLeft: em(0.5), marginRight: em(0.5)})
            .bind(editor.data.nodeUpd, 'flagBook')
            .value(editor.data.nodeSrc.flagBook).title("Это книга"),
        Input().typeText()
            .placeholder('Фраза для поиска')
            .as('input-elem input')
            .setValue(editor.data.nodeSrc.searchPhrase || '')
            .onInput((e) => onInputTitle(e, editor))
    );
}



function onInputTitle(e: Event, editor: IEditor) {
    const input = e.target as HTMLTextAreaElement;
    editor.data.nodeUpd.searchPhrase = input.value.trim();
}
