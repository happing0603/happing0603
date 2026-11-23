(function () {
class Component extends DCLogic {
constructor(...args) {
super(...args);
this.sizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
this.price = 25000;
this.io = null;
this.onStorage = null;
this.onVis = null;
this.state = {
items: [],
nameErr: '',
phoneErr: '',
addrErr: '',
sheet: '',
copyMsg: ''
};
}
componentDidMount() {
this.syncOrder();
try {
this.onStorage = () => {
this.syncOrder();
};
window.addEventListener('storage', this.onStorage);
this.onVis = () => {
if (!document.hidden) {
this.syncOrder();
}
};
document.addEventListener('visibilitychange', this.onVis);
if (typeof IntersectionObserver !== 'undefined') {
this.io = new IntersectionObserver((entries) => {
const e = entries[entries.length - 1];
if (e && e.isIntersecting) {
this.syncOrder();
}
});
this.io.observe(document.body);
}
} catch (e) {
}
}
componentWillUnmount() {
try {
if (this.onStorage) {
window.removeEventListener('storage', this.onStorage);
}
if (this.onVis) {
document.removeEventListener('visibilitychange', this.onVis);
}
if (this.io) {
this.io.disconnect();
}
} catch (e) {
}
}
readOrder() {
try {
const raw = window.localStorage.getItem('jcw-order');
if (raw === null) {
return [];
}
const data = JSON.parse(raw);
if (!data || !Array.isArray(data.items)) {
return [];
}
return data.items
.filter((x) => x && this.sizes.indexOf(x.size) >= 0 && x.qty > 0)
.map((x) => ({ size: x.size, qty: Math.min(99, Math.floor(x.qty)) }));
} catch (e) {
return [];
}
}
syncOrder() {
const items = this.readOrder();
const a = JSON.stringify(items);
const b = JSON.stringify(this.state.items);
if (a !== b) {
this.setState({ items: items, sheet: '', copyMsg: '' });
}
}
fmt(n) {
return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원';
}
val(id) {
try {
const el = document.getElementById(id);
return el ? String(el.value || '').trim() : '';
} catch (e) {
return '';
}
}
makeSheet() {
const name = this.val('co-name');
const phone = this.val('co-phone');
const addr = this.val('co-addr');
const note = this.val('co-note');
const nameErr = name ? '' : '이름을 입력해 주세요.';
const phoneErr = phone.replace(/\D/g, '').length >= 9 ? '' : '연락처를 입력해 주세요.';
const addrErr = addr ? '' : '배송지를 입력해 주세요.';
if (nameErr || phoneErr || addrErr) {
this.setState({ nameErr: nameErr, phoneErr: phoneErr, addrErr: addrErr, sheet: '', copyMsg: '' });
return;
}
let total = 0;
let count = 0;
const lines = ['[JCW T-SHIRTS 주문]'];
this.state.items.forEach((c) => {
lines.push('사이즈 ' + c.size + ' × ' + c.qty + '개 = ' + this.fmt(c.qty * this.price));
total += c.qty * this.price;
count += c.qty;
});
lines.push('총 ' + count + '개, 합계 ' + this.fmt(total));
lines.push('');
lines.push('이름: ' + name);
lines.push('연락처: ' + phone);
lines.push('배송지: ' + addr);
if (note) {
lines.push('요청 사항: ' + note);
}
this.setState({ nameErr: '', phoneErr: '', addrErr: '', sheet: lines.join('\n'), copyMsg: '' });
}
copySheet() {
const text = this.state.sheet;
const fail = () => {
this.setState({ copyMsg: '복사하지 못했습니다. 위 내용을 직접 선택해 복사해 주세요.' });
};
try {
const p = navigator.clipboard.writeText(text);
if (p && p.then) {
p.then(() => {
this.setState({ copyMsg: '주문서를 복사했습니다.' });
}).catch(fail);
} else {
fail();
}
} catch (e) {
fail();
}
}
renderVals() {
const st = this.state;
let totalQty = 0;
let total = 0;
const orderItems = st.items.map((c) => {
totalQty += c.qty;
total += c.qty * this.price;
return {
size: c.size,
qty: String(c.qty),
lineText: this.fmt(c.qty * this.price)
};
});
const has = st.items.length > 0;
return {
orderItems: orderItems,
hasOrder: has,
noOrder: !has,
totalQty: String(totalQty),
totalText: this.fmt(total),
nameErr: st.nameErr,
phoneErr: st.phoneErr,
addrErr: st.addrErr,
sheetOpen: st.sheet !== '',
sheet: st.sheet,
copyMsg: st.copyMsg,
makeSheet: () => this.makeSheet(),
copySheet: () => this.copySheet()
};
}
}
DC.mount(Component);
})();
