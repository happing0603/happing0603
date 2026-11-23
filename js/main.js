(function () {
class Component extends DCLogic {
constructor(...args) {
super(...args);
this.state = { idx: 0, playing: false, now: Date.now() };
this.clock = null;
this.timer = null;
this.audio = null;
this.fadeIv = null;
this.io = null;
}
componentDidMount() {
this.startTimer();
this.clock = setInterval(() => {
this.setState({ now: Date.now() });
}, 1000);
try {
if (typeof IntersectionObserver !== 'undefined') {
this.io = new IntersectionObserver((entries) => {
const e = entries[entries.length - 1];
if (e && !e.isIntersecting) {
this.fadeOut();
}
});
this.io.observe(document.body);
}
document.addEventListener('visibilitychange', () => {
if (document.hidden) {
this.fadeOut();
}
});
} catch (e) {
this.io = null;
}
try {
this.audio = new Audio('assets/music.mp4');
this.audio.loop = true;
this.audio.preload = 'none';
this.audio.volume = 0.7;
} catch (e) {
this.audio = null;
}
}
componentWillUnmount() {
this.stopTimer();
if (this.clock) {
clearInterval(this.clock);
this.clock = null;
}
if (this.io) {
this.io.disconnect();
this.io = null;
}
this.fadeOutAndStop();
}
fadeOut() {
const a = this.audio;
if (this.state.playing) {
this.setState({ playing: false });
}
if (!a || a.paused) {
return;
}
if (this.fadeIv) {
clearInterval(this.fadeIv);
}
const startVol = a.volume;
const steps = 25;
let n = 0;
this.fadeIv = setInterval(() => {
n += 1;
try {
a.volume = Math.max(0, startVol * (1 - n / steps));
} catch (e) {
n = steps;
}
if (n >= steps) {
clearInterval(this.fadeIv);
this.fadeIv = null;
a.pause();
try {
a.volume = 0.7;
} catch (e) {
}
}
}, 60);
}
fadeOutAndStop() {
const a = this.audio;
this.audio = null;
if (!a) {
return;
}
if (a.paused) {
return;
}
const startVol = a.volume;
const steps = 25;
let n = 0;
const iv = setInterval(() => {
n += 1;
try {
a.volume = Math.max(0, startVol * (1 - n / steps));
} catch (e) {
n = steps;
}
if (n >= steps) {
clearInterval(iv);
a.pause();
}
}, 60);
}
startTimer() {
this.stopTimer();
this.timer = setInterval(() => {
this.setState({ idx: this.state.idx === 0 ? 1 : 0 });
}, 20000);
}
stopTimer() {
if (this.timer) {
clearInterval(this.timer);
this.timer = null;
}
}
select(i) {
if (this.state.idx !== i) {
this.setState({ idx: i });
}
this.startTimer();
}
remaining() {
return new Date('2027-05-31T23:59:59+09:00').getTime() - this.state.now;
}
countText() {
const t = Math.max(0, this.remaining());
const pad = (n) => String(n).padStart(2, '0');
return Math.floor(t / 86400000) + '일 ' + pad(Math.floor((t % 86400000) / 3600000)) + '시간 ' + pad(Math.floor((t % 3600000) / 60000)) + '분 ' + pad(Math.floor((t % 60000) / 1000)) + '초';
}
toggleMusic() {
if (!this.audio) {
return;
}
if (this.state.playing) {
this.audio.pause();
this.setState({ playing: false });
} else {
if (this.fadeIv) {
clearInterval(this.fadeIv);
this.fadeIv = null;
}
try {
this.audio.volume = 0.7;
} catch (e) {
}
const p = this.audio.play();
this.setState({ playing: true });
if (p && p.catch) {
p.catch(() => {
this.setState({ playing: false });
});
}
}
}
renderVals() {
const idx = this.state.idx;
const playing = this.state.playing;
return {
isA: idx === 0,
isB: idx === 1,
bOpacity: idx === 1 ? 1 : 0,
aLabelOpacity: idx === 0 ? 1 : 0.4,
bLabelOpacity: idx === 1 ? 1 : 0.4,
next: () => this.select(this.state.idx === 0 ? 1 : 0),
goA: () => this.select(0),
goB: () => this.select(1),
isPlaying: playing,
recruiting: this.remaining() > 0,
countText: this.countText(),
isPaused: !playing,
musicLabel: playing ? '음악 끄기' : '음악 켜기',
musicPressed: playing,
labelMax: playing ? 'min(340px, calc(100vw - 112px))' : '0px',
labelOpacity: playing ? 1 : 0,
labelPadLeft: playing ? '20px' : '0px',
toggleMusic: () => this.toggleMusic(),
goApply: () => this.fadeOut()
};
}
}
DC.mount(Component);
})();
