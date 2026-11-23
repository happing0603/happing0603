(function () {
class Component extends DCLogic {
constructor(...args) {
super(...args);
this.sizes = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
this.price = 25000;
this.popupDelay = null;
this.popupTimer = null;
this.io = null;
this.onStorage = null;
this.onVis = null;
this.state = {
size: '',
qty: 1,
cart: [],
sizeMsg: '',
chartOpen: false,
popup: false,
popupBuy: false,
popupDetail: ''
};
}
componentDidMount() {
this.syncCart();
try {
this.onStorage = () => {
this.syncCart();
};
window.addEventListener('storage', this.onStorage);
this.onVis = () => {
if (!document.hidden) {
this.syncCart();
}
};
document.addEventListener('visibilitychange', this.onVis);
if (typeof IntersectionObserver !== 'undefined') {
this.io = new IntersectionObserver((entries) => {
const e = entries[entries.length - 1];
if (e && e.isIntersecting) {
this.syncCart();
} else {
this.hidePopup();
}
});
this.io.observe(document.body);
}
} catch (e) {
}
}
componentWillUnmount() {
this.clearPopupTimers();
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
parseCart(raw) {
try {
const data = JSON.parse(raw);
if (!Array.isArray(data)) {
return [];
}
return data
.filter((x) => x && this.sizes.indexOf(x.size) >= 0 && x.qty > 0)
.map((x) => ({ size: x.size, qty: Math.min(99, Math.floor(x.qty)) }));
} catch (e) {
return [];
}
}
readStoredCart() {
try {
const raw = window.localStorage.getItem('jcw-cart');
if (raw === null) {
return null;
}
return this.parseCart(raw);
} catch (e) {
return null;
}
}
syncCart() {
const c = this.readStoredCart();
if (c) {
this.setState({ cart: c });
}
}
clearPopupTimers() {
if (this.popupDelay) {
clearTimeout(this.popupDelay);
this.popupDelay = null;
}
if (this.popupTimer) {
clearTimeout(this.popupTimer);
this.popupTimer = null;
}
}
hidePopup() {
this.clearPopupTimers();
if (this.state.popup) {
this.setState({ popup: false });
}
}
showPopup(buy, detail) {
this.clearPopupTimers();
this.setState({ popup: false, popupBuy: buy, popupDetail: detail });
this.popupDelay = setTimeout(() => {
this.popupDelay = null;
this.setState({ popup: true });
this.popupTimer = setTimeout(() => {
this.popupTimer = null;
this.setState({ popup: false });
}, 5000);
}, 40);
}
addToCart() {
const size = this.state.size;
if (!size) {
this.setState({ sizeMsg: '사이즈를 선택해 주세요.' });
return null;
}
const qty = this.state.qty;
const base = this.readStoredCart() || this.state.cart;
let found = false;
const cart = base.map((c) => {
if (c.size === size) {
found = true;
return { size: c.size, qty: Math.min(99, c.qty + qty) };
}
return c;
});
if (!found) {
cart.push({ size: size, qty: qty });
}
this.setState({ cart: cart, sizeMsg: '' });
try {
window.localStorage.setItem('jcw-cart', JSON.stringify(cart));
} catch (e) {
}
return size + ' 사이즈 ' + qty + '개';
}
renderVals() {
const st = this.state;
const sizeItems = this.sizes.map((s) => {
const on = st.size === s;
return {
label: s,
pressed: on,
bg: on ? '#3B1A78' : '#FFFFFF',
fg: on ? '#FFFFFF' : '#0B0B0F',
bd: on ? '#3B1A78' : '#0B0B0F',
pick: () => this.setState({ size: s, sizeMsg: '' })
};
});
let totalQty = 0;
st.cart.forEach((c) => {
totalQty += c.qty;
});
return {
sizeItems: sizeItems,
cartLabel: totalQty > 0 ? '장바구니 (' + totalQty + ')' : '장바구니',
qty: String(st.qty),
sizeMsg: st.sizeMsg,
chartOpen: st.chartOpen,
popupOpen: st.popup,
popupTitle: '장바구니에 담았습니다',
canBuy: st.size !== '',
cannotBuy: st.size === '',
popupDetail: st.popupDetail,
qtyDown: () => this.setState({ qty: Math.max(1, st.qty - 1) }),
qtyUp: () => this.setState({ qty: Math.min(9, st.qty + 1) }),
addCart: () => {
const d = this.addToCart();
if (d) {
this.showPopup(false, 'JCW T-SHIRTS · ' + d);
}
},
buyNow: () => {
try {
window.localStorage.setItem('jcw-order', JSON.stringify({ source: 'direct', items: [{ size: st.size, qty: st.qty }] }));
} catch (e) {
}
this.hidePopup();
},
needSize: () => this.setState({ sizeMsg: '사이즈를 선택해 주세요.' }),
goCart: () => {
this.hidePopup();
},
closePopup: () => this.hidePopup(),
openChart: () => this.setState({ chartOpen: true }),
closeChart: () => this.setState({ chartOpen: false }),
stop: (e) => {
if (e && e.stopPropagation) {
e.stopPropagation();
}
}
};
}
}
DC.mount(Component);
})();
