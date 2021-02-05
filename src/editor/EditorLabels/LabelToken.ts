import styleLabelToken from './LabelToken.scss';
import {CSSStyle, EL, eventStop, getShadow, Span} from "element";
import {IEditor} from "../Editor";


export function token(editor: IEditor, idn: number, text: string) {
    return new LabelToken(editor, idn, text).elem;
}

class LabelToken {

    elem = EL(new LabelTokenTag());

    private readonly _idn!: number;
    private readonly _text!: string;
    private editor: IEditor;
    constructor(editor: IEditor, idn: number, text: string) {
        this.editor = editor;
        if (idn) this._idn = idn;
        if (text) this._text = text;
        this.view();
    }

    private onRemove(e:Event){
        eventStop(e);
        if(this._idn){
            const labels = this.editor.data.getLabels();
            labels.splice(labels.indexOf(this._idn),1);
            this.editor.data.setLabels(labels);
        }
        else{
            const keywords = this.editor.data.getKeywords();
            keywords.splice(keywords.indexOf(this._text),1);
            this.editor.data.setKeywords(keywords);
        }
        this.elem.remove();
    }

    private onDoubleClick(){
        const parent = this.elem.el.parentNode;
        if(parent){
            const first = parent.firstChild as HTMLElement;
            if(first && first!==this.elem.el){
                if(this._idn){
                    const labels = this.editor.data.getLabels();
                    labels.splice(labels.indexOf(this._idn),1);
                    labels.splice(0,0,this._idn);
                    this.elem.beforeThat(first);
                    this.editor.data.setLabels(labels);
                }
                else{
                    const keywords = this.editor.data.getKeywords();
                    keywords.splice(keywords.indexOf(this._text),1);
                    keywords.splice(0,0, this._text);
                    this.elem.beforeThat(first);
                    this.editor.data.setKeywords(keywords);
                }
            }
        }
    }

    private view() {
        let text = this._text;
        let className = 'simple';
        if (this._idn) {
            text = this.editor.data.labelsByIdn.get(this._idn) as string;
            className = this.editor.data.labelsLinked.has(this._idn) ? 'linked' : 'normal';
        }

        this.elem.as(className).on('dblclick', this.onDoubleClick.bind(this));

        getShadow(this.elem.click(eventStop).el, [
            CSSStyle().content(styleLabelToken),
            Span().as('text').text(text),
            Span().as('closer').click(this.onRemove.bind(this))
        ]);
    }

}

class LabelTokenTag extends HTMLElement {
    static tag = 'label-token';
}

window.customElements.define(LabelTokenTag.tag, LabelTokenTag);