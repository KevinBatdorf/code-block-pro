// 🎉 emoji, CJK, and RTL all in one comment: 日本語のコメント، تعليق عربي
const emoji = '🚀 ship it — “smart quotes” and an em-dash';
const cjk = '中文字符串';
const rtl = 'مرحبا بالعالم';
const combining = 'é vs é'; // precomposed vs e + U+0301
const zwsp = 'a​b'; // zero-width space
const nbsp = 'a b'; // non-breaking space
console.log([emoji, cjk, rtl, combining, zwsp, nbsp].join(' | '));
