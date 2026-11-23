(function () {
class Component extends DCLogic {
constructor(...args) {
super(...args);
this.deadline = new Date('2027-05-31T23:59:59+09:00').getTime();
this.timer = null;
this.labels = [
'13년생 이상입니다.',
'팀킷 구매가 가능합니다.',
'논란 및 사건 사고가 없습니다.'
];
this.state = { now: Date.now(), checks: [false, false, false], copyMsg: '' };
}
componentDidMount() {
this.timer = setInterval(() => {
this.setState({ now: Date.now() });
}, 1000);
}
componentWillUnmount() {
if (this.timer) {
clearInterval(this.timer);
this.timer = null;
}
}
toggle(i) {
const checks = this.state.checks.slice();
checks[i] = !checks[i];
this.setState({ checks: checks, copyMsg: '' });
}
messageText() {
return [
'안녕하세요, team jcw 팀 지원 문의드립니다.',
'지원 조건(13년생 이상, 팀킷 구매 가능, 논란 및 사건 사고 없음)을 모두 확인했습니다.',
'',
'이름:',
'출생 연도:',
'거주 지역:',
'자전거 경력:',
'대회 출전 경험:'
].join('\n');
}
copyMessage() {
const text = this.messageText();
const fail = () => {
this.setState({ copyMsg: '복사하지 못했습니다. 위 문구를 직접 선택해 복사해 주세요.' });
};
try {
const p = navigator.clipboard.writeText(text);
if (p && p.then) {
p.then(() => {
this.setState({ copyMsg: '문구를 복사했습니다.' });
}).catch(fail);
} else {
fail();
}
} catch (e) {
fail();
}
}
renderVals() {
const diff = this.deadline - this.state.now;
const t = Math.max(0, diff);
const pad = (n) => String(n).padStart(2, '0');
const checks = this.state.checks;
const done = checks.filter((c) => c).length;
const checkItems = this.labels.map((label, i) => {
const on = checks[i];
return {
label: label,
checked: on,
bg: on ? '#3B1A78' : '#FFFFFF',
bd: on ? '#3B1A78' : '#0B0B0F',
mark: on ? 1 : 0,
toggle: () => this.toggle(i)
};
});
return {
open: diff > 0,
closed: diff <= 0,
days: String(Math.floor(t / 86400000)),
hours: pad(Math.floor((t % 86400000) / 3600000)),
mins: pad(Math.floor((t % 3600000) / 60000)),
secs: pad(Math.floor((t % 60000) / 1000)),
checkItems: checkItems,
progressText: done + ' / 3 확인',
pct: Math.round((done / 3) * 100) + '%',
allDone: done === 3,
notDone: done < 3,
message: this.messageText(),
copyMsg: this.state.copyMsg,
copyMessage: () => this.copyMessage()
};
}
}
DC.mount(Component);
})();
