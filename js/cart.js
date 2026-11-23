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
cart: [],
checkoutOpen: false,
copyMsg: ''
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
const patch = {};
if (c) {
patch.cart = c;
}
try {
if (window.localStorage.getItem('jcw-checkout') === '1') {
window.localStorage.removeItem('jcw-checkout');
const n = c ? c.length : this.state.cart.length;
if (n > 0) {
patch.checkoutOpen = true;
patch.copyMsg = '';
}
}
} catch (e) {
}
this.setState(patch);
}
fmt(n) {
return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원';
}
setCart(cart) {
const patch = { cart: cart };
if (cart.length === 0) {
patch.checkoutOpen = false;
patch.copyMsg = '';
}
this.setState(patch);
try {
window.localStorage.setItem('jcw-cart', JSON.stringify(cart));
} catch (e) {
}
}
changeQty(size, delta) {
const base = this.readStoredCart() || this.state.cart;
const cart = [];
base.forEach((c) => {
if (c.size === size) {
const q = Math.min(99, c.qty + delta);
if (q > 0) {
cart.push({ size: c.size, qty: q });
}
} else {
cart.push(c);
}
});
this.setCart(cart);
}
removeItem(size) {
const base = this.readStoredCart() || this.state.cart;
this.setCart(base.filter((c) => c.size !== size));
}
orderSummary() {
const lines = ['JCW T-SHIRTS'];
let total = 0;
let count = 0;
this.state.cart.forEach((c) => {
lines.push('사이즈 ' + c.size + ' × ' + c.qty + '개 = ' + this.fmt(c.qty * this.price));
total += c.qty * this.price;
count += c.qty;
});
lines.push('총 ' + count + '개, 합계 ' + this.fmt(total));
return lines.join('\n');
}
copyOrder() {
const text = this.orderSummary();
const fail = () => {
this.setState({ copyMsg: '복사하지 못했습니다. 위 내용을 직접 선택해 복사해 주세요.' });
};
try {
const p = navigator.clipboard.writeText(text);
if (p && p.then) {
p.then(() => {
this.setState({ copyMsg: '주문 내용을 복사했습니다.' });
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
const price = this.price;
let totalQty = 0;
let total = 0;
const cartItems = st.cart.map((c) => {
totalQty += c.qty;
total += c.qty * price;
return {
size: c.size,
qty: String(c.qty),
unitText: this.fmt(price),
lineText: this.fmt(c.qty * price),
decLabel: c.size + ' 사이즈 수량 줄이기',
incLabel: c.size + ' 사이즈 수량 늘리기',
removeLabel: c.size + ' 사이즈 삭제',
dec: () => this.changeQty(c.size, -1),
inc: () => this.changeQty(c.size, 1),
remove: () => this.removeItem(c.size)
};
});
const hasCart = st.cart.length > 0;
return {
cartItems: cartItems,
hasCart: hasCart,
cartEmpty: !hasCart,
checkoutVisible: hasCart && st.checkoutOpen,
totalQty: String(totalQty),
totalText: this.fmt(total),
orderText: this.orderSummary(),
cartLabel: totalQty > 0 ? '장바구니 (' + totalQty + ')' : '장바구니',
copyMsg: st.copyMsg,
openCheckout: () => this.setState({ checkoutOpen: true, copyMsg: '' }),
closeCheckout: () => this.setState({ checkoutOpen: false, copyMsg: '' }),
copyOrder: () => this.copyOrder(),
goCheckout: () => {
try {
window.localStorage.setItem('jcw-order', JSON.stringify({ source: 'cart', items: this.state.cart.map((c) => ({ size: c.size, qty: c.qty })) }));
} catch (e) {
}
}
};
}
}
DC.mount(Component);
})();
