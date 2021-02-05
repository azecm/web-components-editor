import iconParag from '../icon/paragraph.svg';
import iconUL from '../icon/list-ul.svg';
import iconOL from '../icon/list-ol.svg';
import iconSave from '../icon/save.svg';
import iconAlignCenter from '../icon/align-center.svg';
import iconAlignJustify from '../icon/align-justify.svg';
import iconAlignLeft from '../icon/align-left.svg';
import iconAlignRight from '../icon/align-right.svg';
import iconHR from '../icon/horizontal-rule.svg';
import iconUndo from '../icon/undo-alt.svg';
import iconRedo from '../icon/redo-alt.svg';
import iconBold from '../icon/bold.svg';
import iconItalic from '../icon/italic.svg';
import iconUnderline from '../icon/underline.svg';
import iconStrike from '../icon/strike.svg';

import iconQuote from '../icon/quote-right.svg';
import iconSub from '../icon/subscript.svg';
import iconSup from '../icon/superscript.svg';
import iconLink from '../icon/link.svg';
import iconUnlink from '../icon/unlink.svg';
import iconEraser from '../icon/eraser.svg';
import iconSpell from '../icon/spell-check.svg';
import iconClearBoth from '../icon/clear-both.svg';

export const icons = new Map<string, { icon: string, title: string }>();
icons.set('p', {icon: iconParag, title: 'абзац'});
icons.set('ul', {icon: iconUL, title: 'маркированный список'});
icons.set('ol', {icon: iconOL, title: 'нумерованный список'});
icons.set('save', {icon: iconSave, title: 'сохранить'});

icons.set('align-right', {icon: iconAlignRight, title: 'по правому краю'});
icons.set('align-left', {icon: iconAlignLeft, title: 'по левому краю'});
icons.set('align-center', {icon: iconAlignCenter, title: 'по центру'});
icons.set('align-justify', {icon: iconAlignJustify, title: 'по ширине'});

icons.set('hr', {icon: iconHR, title: 'горизонтальная линия'});
icons.set('undo', {icon: iconUndo, title: 'отменить'});
icons.set('redo', {icon: iconRedo, title: 'повторить'});

icons.set('bold', {icon: iconBold, title: 'жирный'});
icons.set('italic', {icon: iconItalic, title: 'курсив'});
icons.set('underline', {icon: iconUnderline, title: 'подчеркнутый'});
icons.set('strike', {icon: iconStrike, title: 'зачеркнутый'});

icons.set('quote', {icon: iconQuote, title: 'строчная цитата'});
icons.set('sub', {icon: iconSub, title: 'подстрочный'});
icons.set('sup', {icon: iconSup, title: 'надстрочный'});
icons.set('link', {icon: iconLink, title: 'ссылка'});
icons.set('unlink', {icon: iconUnlink, title: 'удалить ссылку'});

icons.set('eraser', {icon: iconEraser, title: 'удалить форматирование'});
icons.set('spell', {icon: iconSpell, title: 'проверка орфографии'});
icons.set('clear', {icon: iconClearBoth, title: 'чисто с обеих сторон'});

icons.set('blockquote', {icon: 'Q', title: 'абзац цитата'});
icons.set('dfn', {icon: 'dfn', title: 'термин'});
icons.set('strong', {icon: '', title: 'важный'});
icons.set('em', {icon: '', title: 'выделенный'});

icons.set('h1', {icon: 'h1', title: 'заголовок 1'});
icons.set('h2', {icon: 'h2', title: 'заголовок 2'});
icons.set('h3', {icon: 'h3', title: 'заголовок 3'});
icons.set('h4', {icon: 'h4', title: 'заголовок 4'});
icons.set('h5', {icon: 'h5', title: 'заголовок 5'});
icons.set('h6', {icon: 'h6', title: 'заголовок 6'});


