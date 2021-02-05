import styleEditorLabels from './EditorLabels.scss';
import {CSSStyle, Div, EL, eventStop, getShadow, Input} from "element";
import {token} from "./LabelToken";
import {LabelsComplete} from "./LabelsComplete";
import {IEditor} from "../Editor";

export function editorLabels(editor: IEditor) {
    return new EditorLabels(editor).elem;
}

class EditorLabels {
    elem = EL(new EditorLabelsTag());
    private elemList = Div();
    private elemInput = Input();
    private complete: LabelsComplete;

    editor: IEditor;

    constructor(editor: IEditor) {
        this.editor = editor;
        this.complete = new LabelsComplete(editor, this.onComplete.bind(this));
        this.init();
    }

    private onComplete(text: string, idn: number) {
        this.elemInput.setValue('');
        if (idn) {
            const labels = this.editor.data.getLabels();
            labels.push(idn);
            this.editor.data.setLabels(labels);
        } else {
            const keywords = this.editor.data.getKeywords();
            keywords.push(text);
            this.editor.data.setKeywords(keywords);
        }
        this.updateLists();
        this.elemInput.el.focus();
        this.complete.close();
    }

    private onInput() {
        const input = this.elemInput.el;
        this.elemInput.styleRemove();
        if (input.offsetWidth < input.scrollWidth) {
            input.style.width = input.scrollWidth + 'px';
        }

        this.complete.find(this.elemInput.value);
    }

    private onKeydown(_e: Event) {
        const e = _e as KeyboardEvent;

        this.openComplete();

        switch (e.code) {
            case 'ArrowDown':
                eventStop(e);
                this.complete.move(1);
                break;
            case 'ArrowUp':
                eventStop(e);
                this.complete.move(-1);
                break;
            case 'Enter': {
                const val = this.elemInput.el.value.trim();
                const item = this.complete.items[this.complete.pos];
                if (item && item.text.toLowerCase().includes(val.toLowerCase())) {
                    this.complete.close();
                    this.onComplete(item.text, item.idn);
                } else {
                    this.onComplete(val, 0);
                }
                break;
            }
            case 'Escape':
                this.complete.close();
                break;
            default:
                break;
        }
    }

    private onCopy(_e: Event) {
        eventStop(_e);
        const e = _e as ClipboardEvent;
        if (e.clipboardData == null) return;

        e.clipboardData
            .setData('application/json', JSON.stringify({
                keywords: this.editor.data.getKeywords(),
                labels: this.editor.data.getLabels()
            }));
    }

    private onPaste(_e: Event) {
        const e = _e as ClipboardEvent;
        if (e.clipboardData == null) return;
        let data: { keywords: string[], labels: number[] } | undefined;
        try {
            data = JSON.parse(e.clipboardData.getData('application/json'));
            eventStop(_e);
        } catch (e) {
            return;
        }
        if (!data || !Array.isArray(data.keywords) || !Array.isArray(data.labels)) return;
        data.keywords = data.keywords.filter(t => !!t).filter((t: any) => typeof (t) == 'string');
        data.labels = data.labels.filter((t: any) => typeof (t) == 'number');
        this.editor.data.setKeywords(data.keywords);
        this.editor.data.setLabels(data.labels);
        this.updateLists();
    }

    private onClick() {
        this.elemInput.el.focus();
        this.openComplete();
    }

    private openComplete() {
        if (!this.complete.opened) {
            this.complete.open(new Set([...this.editor.data.getKeywords(), ...this.editor.data.getLabels().map(k => this.editor.data.labelsByIdn.get(k) as string)]));
            this.complete.find(this.elemInput.value);
        }
    }

    private updateLists() {
        this.elemList.drop().append(
            this.editor.data.getKeywords().map(txt => token(this.editor, 0, txt)),
            this.editor.data.getLabels().map(id => token(this.editor, id, '')),
            this.elemInput
        );
    }

    private init() {
        this.elem.as('input-elem input').click(this.onClick.bind(this));

        this.elemInput
            .as('input')
            .attr('size', 1)
            .attr('autocomplete', 'off')
            .onInput(this.onInput.bind(this))
            .on('keydown', this.onKeydown.bind(this))
            .on('copy', this.onCopy.bind(this))
            .on('paste', this.onPaste.bind(this));

        this.updateLists();
        getShadow(this.elem.el, [
            CSSStyle().content(styleEditorLabels),
            this.elemList.as('tokens'),
            Div().as('complete-wrap').append(
                this.complete.container.as('complete-block').asNone()
            )
        ]);
    }
}

class EditorLabelsTag extends HTMLElement {
    static tag = 'editor-labels';
}

window.customElements.define(EditorLabelsTag.tag, EditorLabelsTag);