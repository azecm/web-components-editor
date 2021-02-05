import {Elem} from "./element";

export type IElemSvg = Elem<SVGElement>;
export function ELG(nodeName: string) {
    return new ElemSVG(nodeName);
}
export class ElemSVG<T extends SVGElement> extends Elem<T> {
    el!: T;

    constructor(name: string) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', name) as T;
        if (name == 'svg') {
            g.setAttribute('version', '1.1');
            g.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            g.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
        }
        super(g);
    }

    link(value: string | null) {
        if (value) {
            this.el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', value);
        }
        return this;
    }

    transform(val: string | null) {
        this.attr('transform', val);
        return this;
    }
}

export function SVG() {
    return new ElemSVGSVG('svg');
}

export class ElemSVGSVG extends ElemSVG<SVGSVGElement> {
    width(val: number | null) {
        this.attr('width', val);
        return this;
    }

    height(val: number | null) {
        this.attr('height', val);
        return this;
    }

    viewBox(...val: number[]) {
        this.attr('viewBox', val.join(' '));
        return this;
    }

    content(text: string) {
        const frag = document.createElement('div');
        frag.innerHTML = text;
        const els = frag.getElementsByTagName('svg');
        if (els.length && els[0].nodeName.toLowerCase() == 'svg') {
            const parent = this.el.parentElement;
            if (parent) parent.replaceChild(els[0], this.el);
            this.el = els[0] as SVGSVGElement;
        }
        return this;
    }
}