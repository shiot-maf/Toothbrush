// 느린 네트워크를 흉내 내는 Firebase 대역.
// 쓰기는 순서대로 처리되지만(실제 Firestore처럼) 지연 후에야 저장소에 반영된다.
// 지연 중에 페이지를 떠나면 그 쓰기는 사라진다 — 실제 네트워크 요청과 같다.
// 조절: localStorage.__lat = 지연(ms), localStorage.__offline = '1' 이면 쓰기가 실패한다.
// 저장소는 localStorage.__fakefs 에 { "users/u1/reset90/current": {...} } 꼴로 쌓인다.
const KEY = '__fakefs';
const LAT = () => Number(localStorage.getItem('__lat') ?? 250);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const load = () => JSON.parse(localStorage.getItem(KEY) || '{}');
const store = o => localStorage.setItem(KEY, JSON.stringify(o));
let chain = Promise.resolve();
export const initializeApp = () => ({});
export const getAuth = () => ({ currentUser: { uid: 'u1' } });
export class GoogleAuthProvider {}
export const signInWithPopup = async () => ({});
export const signInWithRedirect = async () => ({});
export const getRedirectResult = async () => null;
export const signOut = async () => {};
export const onAuthStateChanged = (a, cb) => { setTimeout(() => cb({ uid: 'u1' }), 0); return () => {}; };
export const getFirestore = () => ({});
export const doc = (db, ...p) => p.join('/');
export const collection = (db, ...p) => p.join('/');
export const Timestamp = { now: () => ({ s: Date.now() }) };
// Firestore의 merge:true처럼 중첩된 맵까지 합친다
const deepMerge = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' ? deepMerge(o[k], v) : v; return o; };
export const setDoc = (ref, data, opt) => {
  if (localStorage.__offline === '1') { const p = chain.then(() => sleep(50)).then(() => { throw new Error('offline'); }); chain = p.catch(() => {}); return p; }
  const snapshot = JSON.parse(JSON.stringify(data));
  chain = chain.then(() => sleep(LAT() * (0.5 + Math.random()))).then(() => {
    const s = load(); s[ref] = opt?.merge ? deepMerge(s[ref], snapshot) : snapshot; store(s);
  });
  return chain;
};
export const getDoc = async ref => { await sleep(20); const d = load()[ref]; return { exists: () => !!d, data: () => d }; };
export const getDocs = async col => { const s = load(); const docs = Object.keys(s).filter(k => k.startsWith(col + '/') && !k.slice(col.length + 1).includes('/')).map(k => ({ id: k.slice(col.length + 1), data: () => s[k] })); return { forEach: f => docs.forEach(f) }; };
