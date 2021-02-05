import {dialog, Div, Input, TextArea} from "element";
import {IEditorData} from "../EditorData";
import {INodeNotice} from "../editor-const";

export class DialogNotice {
    data: INodeNotice;
    editorData:IEditorData
    constructor(editorData:IEditorData) {
        this.editorData = editorData;
        this.data = Object.assign({email:'', message: ''}, editorData.nodeUpd.notice||editorData.nodeSrc.notice);
        this.view();
    }

    private view(){
        const form = Div().append(
            Div().append(
                Input().typeDate().bind(this.data, 'date').title('Дата [dd.mm.yyyy]').style({width: '15em'})
            ),
            Div().append(
                Input().type('email').bind(this.data, 'email').title('email').placeholder('email').style({width: '15em'})
            ),
            Div().append(
                TextArea().rows(5).bind(this.data, 'message').title('Заметка').placeholder('Заметка').style({width: '40em'})
            )
        );
        dialog().form(form, '<b>Заметка</b>').onConfirm(this.confirm.bind(this));
    }

    private confirm(){
        this.editorData.nodeUpd.notice = this.editorData.nodeSrc.notice = this.data;
    }
}
