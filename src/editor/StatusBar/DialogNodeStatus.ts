import {dialog, Div, InputCheckbox} from "element";
import {IEditorData} from "../EditorData";


export class DialogNodeStatus {
    fnStatus: () => void;
    data: {
        flagValid: boolean
        flagBlock: boolean
    };
    editorData:IEditorData;
    constructor(fnStatus: () => void, editorData: IEditorData) {
        this.fnStatus = fnStatus;
        this.editorData = editorData;
        const {flagValid, flagBlock} = editorData.nodeSrc;
        this.data = {flagValid, flagBlock};
        this.view();
    }

    private view() {
        const form = Div().append(
            Div().append(
                this.data.flagValid ?
                    '<b>подтверждена</b>' :
                    InputCheckbox().bind(this.data, 'flagValid').textRight('подтверждена')
            ),
            Div().append(
                InputCheckbox().bind(this.data, 'flagBlock').textRight('запрещена')
            )
        );
        dialog().form(form, '<b>Статус</b>').onConfirm(this.confirm.bind(this));
    }

    private confirm() {
        let updated = false;
        const {flagValid, flagBlock} = this.editorData.nodeSrc;
        if (flagValid != this.data.flagValid) {
            this.editorData.nodeSrc.flagValid = this.editorData.nodeUpd.flagValid = this.data.flagValid;
            updated = true;
        }
        if (flagBlock != this.data.flagBlock) {
            this.editorData.nodeSrc.flagBlock = this.editorData.nodeUpd.flagBlock = this.data.flagBlock;
            updated = true;
        }
        if (updated) {
            this.fnStatus();
            this.editorData.save();
        }
    }
}
