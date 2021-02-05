import {namesDataType} from "../editor-const";


export function onCancel(elem: HTMLElement) {
    if (!elem.hasAttribute(namesDataType)) {
        elem.remove();
    }
}