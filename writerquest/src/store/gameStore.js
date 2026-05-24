import { create } from 'zustand';
import { saveUserMeta, saveNovel, deleteNovel, saveSession, loadUserData } from './firestoreSync';

const TODAY = () => new Date().toISOString().slice(0, 10);

function getMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date().setDate(d.getDate() - day + (day === 0 ? -6 : 1))).toISOString().slice(0, 10);
}

const DEFAULT_PLAYER = {
  nickname: '',
  level: 1,
  exp: 0,
  energy: 100,
  energyLastRestAt: null,
  energyLastResetDate: TODAY(),
  stats: { style: 0, imagination: 0, dialogue: 0, description: 0, focus: 0 },
  streakDays: 0,
  lastWrittenDate: null,
  onboarded: false,
  titles: [],
};

const DEFAULT_QUESTS = [
  { id: 'daily_words',   type: 'daily',  title: '오늘 1,000자 쓰기',   target: 1000, progress: 0, done: false, lastResetDate: TODAY() },
  { id: 'daily_dawn',    type: 'daily',  title: '새벽 감성 (00~04시)', target: 1,    progress: 0, done: false, lastResetDate: TODAY() },
  { id: 'weekly_streak', type: 'weekly', title: '주 5일 이상 집필',     target: 5,    progress: 0, done: false, lastResetWeek: getMonday() },
  { id: 'focus_2h',      type: 'weekly', title: '집중 모드 2시간 달성', target: 1,    progress: 0, done: false, lastResetWeek: getMonday() },
  { id: 'chapter_done',  type: 'once',   title: '챕터 완성하기',        target: 1,    progress: 0, done: false },
  { id: 'memos_5',       type: 'once',   title: '메모 5개 기록하기',    target: 5,    progress: 0, done: false },
];

// Firestore 쓰기 디바운스 (2초)
let metaSaveTimer = null;
function scheduleSaveMeta(uid, data) {
  if (!uid) return;
  clearTimeout(metaSaveTimer);
  metaSaveTimer = setTimeout(() => saveUserMeta(uid, data), 2000);
}

export const useGameStore = create((set, get) => ({
  uid: null,
  loading: true,
  player: { ...DEFAULT_PLAYER },
  novels: [],
  sessions: [],
  quests: DEFAULT_QUESTS,
  memos: [],
  trash: [],
  comments: getMockComments(),

  // ── 인증 ──────────────────────────────────────────────────────────

  initUser: async (uid) => {
    if (get().uid === uid) return; // Strict Mode 이중 호출 방지
    set({ uid, loading: true });
    try {
      const { userData, novels } = await loadUserData(uid);
      if (userData) {
        set({
          player: userData.player ?? DEFAULT_PLAYER,
          quests: userData.quests ?? DEFAULT_QUESTS,
          memos: userData.memos ?? [],
          trash: userData.trash ?? [],
          novels,
          loading: false,
        });
        get().checkMidnightReset();
      } else {
        // 신규 사용자 — 빈 상태로 시작
        set({ loading: false });
      }
    } catch (e) {
      console.error('Firestore 로딩 실패', e);
      set({ loading: false });
    }
  },

  clearUser: () => set({
    uid: null, loading: false,
    player: { ...DEFAULT_PLAYER },
    novels: [], sessions: [], quests: DEFAULT_QUESTS, memos: [], trash: [],
  }),

  // ── 내부 헬퍼: meta 저장 예약 ─────────────────────────────────────
  _saveMeta: () => {
    const { uid, player, quests, memos, trash } = get();
    scheduleSaveMeta(uid, { player, quests, memos, trash });
  },

  // ── 플레이어 ──────────────────────────────────────────────────────

  setPlayer: (patch) => {
    set((s) => ({ player: { ...s.player, ...patch } }));
    get()._saveMeta();
  },

  completeOnboarding: async (nickname, firstNovelTitle) => {
    const { uid } = get();
    const novelTitle = firstNovelTitle.trim() || '나의 첫 이야기';
    const novel = {
      id: crypto.randomUUID(),
      title: novelTitle,
      emoji: '🌙',
      chapters: [{ id: crypto.randomUUID(), title: '1화. 시작', content: '', wordCount: 0, completed: false, status: 'draft', synopsis: '', wordGoal: 0, moodTags: [], pov: '' }],
      createdAt: new Date().toISOString(),
    };
    set((s) => ({
      player: { ...s.player, nickname, onboarded: true },
      novels: [novel],
    }));
    get()._saveMeta();
    if (uid) await saveNovel(uid, novel);
  },

  // ── 소설 ──────────────────────────────────────────────────────────

  addNovel: async (title, emoji = '📖') => {
    const { uid } = get();
    const novel = {
      id: crypto.randomUUID(), title, emoji,
      chapters: [{ id: crypto.randomUUID(), title: '1화. 시작', content: '', wordCount: 0, completed: false, status: 'draft', synopsis: '', wordGoal: 0, moodTags: [], pov: '' }],
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ novels: [...s.novels, novel] }));
    if (uid) await saveNovel(uid, novel);
  },

  addChapter: async (novelId, title) => {
    const { uid } = get();
    const novel = get().novels.find((n) => n.id === novelId);
    if (!novel) return;
    const idx = novel.chapters.length + 1;
    const chapter = {
      id: crypto.randomUUID(),
      title: title || `${idx}화. 제목`,
      content: '', wordCount: 0, completed: false,
      status: 'draft', synopsis: '', wordGoal: 0, moodTags: [], pov: '',
    };
    set((s) => ({
      novels: s.novels.map((n) =>
        n.id !== novelId ? n : { ...n, chapters: [...n.chapters, chapter] }
      ),
    }));
    if (uid) {
      const updated = get().novels.find((n) => n.id === novelId);
      if (updated) await saveNovel(uid, updated);
    }
  },

  updateChapterMeta: async (novelId, chapterId, patch) => {
    const { uid } = get();
    set((s) => ({
      novels: s.novels.map((n) =>
        n.id !== novelId ? n : {
          ...n,
          chapters: n.chapters.map((c) => {
            if (c.id !== chapterId) return c;
            const updated = { ...c, ...patch };
            if (patch.status !== undefined) updated.completed = patch.status === 'done';
            return updated;
          }),
        }
      ),
    }));
    if (uid) {
      const novel = get().novels.find((n) => n.id === novelId);
      if (novel) await saveNovel(uid, novel);
    }
  },

  updateChapterContent: (novelId, chapterId, content) => {
    const { uid } = get();
    set((s) => ({
      novels: s.novels.map((n) =>
        n.id !== novelId ? n : {
          ...n,
          chapters: n.chapters.map((c) =>
            c.id !== chapterId ? c : { ...c, content, wordCount: content.length }
          ),
        }
      ),
    }));
    // 소설은 변경 시 즉시 저장 (글 유실 방지)
    if (uid) {
      const novel = get().novels.find((n) => n.id === novelId);
      if (novel) saveNovel(uid, novel);
    }
  },

  // ── 세션 ──────────────────────────────────────────────────────────

  startSession: (chapterId) => {
    const session = {
      id: crypto.randomUUID(), chapterId,
      startAt: new Date().toISOString(), endAt: null,
      durationSec: 0, wordsWritten: 0, isRest: false,
    };
    set((s) => ({ sessions: [...s.sessions, session] }));
    return session.id;
  },

  endSession: (sessionId, wordsWritten) => {
    const { uid } = get();
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id !== sessionId ? sess : {
          ...sess,
          endAt: new Date().toISOString(),
          durationSec: Math.round((Date.now() - new Date(sess.startAt).getTime()) / 1000),
          wordsWritten,
        }
      ),
    }));
    if (uid) {
      const sess = get().sessions.find((s) => s.id === sessionId);
      if (sess) saveSession(uid, sess);
    }
    // 오늘 집필 날짜 갱신 → 스트릭 계산
    const today = TODAY();
    const { player } = get();
    if (player.lastWrittenDate !== today) {
      const streak = isYesterday(player.lastWrittenDate) ? player.streakDays + 1 : 1;
      set((s) => ({ player: { ...s.player, lastWrittenDate: today, streakDays: streak } }));
      get()._saveMeta();
    }
  },

  // ── 메모 ──────────────────────────────────────────────────────────

  addMemo: (text, novelId = null) => {
    const memo = { id: crypto.randomUUID(), text, novelId, createdAt: new Date().toISOString() };
    set((s) => ({ memos: [...s.memos, memo] }));
    get()._saveMeta();
  },

  deleteMemo: (id) => {
    set((s) => ({ memos: s.memos.filter((m) => m.id !== id) }));
    get()._saveMeta();
  },

  // ── 휴지통 ────────────────────────────────────────────────────────

  deleteChapter: async (novelId, chapterId) => {
    const { uid } = get();
    const novel = get().novels.find((n) => n.id === novelId);
    const chapter = novel?.chapters.find((c) => c.id === chapterId);
    if (!chapter) return;
    const trashItem = {
      id: crypto.randomUUID(),
      novelId,
      novelTitle: novel.title,
      chapter,
      deletedAt: new Date().toISOString(),
    };
    set((s) => ({
      trash: [...s.trash, trashItem],
      novels: s.novels.map((n) =>
        n.id !== novelId ? n : { ...n, chapters: n.chapters.filter((c) => c.id !== chapterId) }
      ),
    }));
    get()._saveMeta();
    if (uid) {
      const updated = get().novels.find((n) => n.id === novelId);
      if (updated) await saveNovel(uid, updated);
    }
  },

  restoreChapter: async (trashId) => {
    const { uid } = get();
    const item = get().trash.find((t) => t.id === trashId);
    if (!item) return;
    set((s) => ({
      trash: s.trash.filter((t) => t.id !== trashId),
      novels: s.novels.map((n) =>
        n.id !== item.novelId ? n : { ...n, chapters: [...n.chapters, item.chapter] }
      ),
    }));
    get()._saveMeta();
    if (uid) {
      const novel = get().novels.find((n) => n.id === item.novelId);
      if (novel) await saveNovel(uid, novel);
    }
  },

  emptyTrash: () => {
    set({ trash: [] });
    get()._saveMeta();
  },

  // ── 에너지 ────────────────────────────────────────────────────────

  rest: () => {
    const { player } = get();
    const lastRest = player.energyLastRestAt ? new Date(player.energyLastRestAt).getTime() : 0;
    if (Date.now() - lastRest < 30 * 60 * 1000) return false;
    set((s) => ({
      player: { ...s.player, energy: Math.min(100, s.player.energy + 30), energyLastRestAt: new Date().toISOString() },
    }));
    get()._saveMeta();
    return true;
  },

  drainEnergy: () => {
    set((s) => ({ player: { ...s.player, energy: Math.max(0, s.player.energy - 1 / 6) } }));
    get()._saveMeta();
  },

  checkMidnightReset: () => {
    const { player } = get();
    const today = TODAY();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    if (player.energyLastResetDate !== today) {
      set((s) => ({
        player: { ...s.player, energy: Math.min(100, s.player.energy + 50), energyLastResetDate: today },
        quests: s.quests.map((q) => {
          if (q.type === 'daily') return { ...q, progress: 0, done: false, lastResetDate: today };
          if (q.type === 'weekly' && q.lastResetWeek !== getMonday())
            return { ...q, progress: 0, done: false, lastResetWeek: getMonday() };
          return q;
        }),
        trash: s.trash.filter((t) => t.deletedAt > thirtyDaysAgo),
      }));
      get()._saveMeta();
    }
  },

  // ── EXP / 레벨 ────────────────────────────────────────────────────

  gainExp: (amount) => {
    const { player } = get();
    const multiplier = player.energy === 0 ? 0.5 : 1;
    const gained = Math.floor(amount * multiplier);
    const newExp = player.exp + gained;
    const expNeeded = player.level * 1000;
    if (newExp >= expNeeded) {
      const newLevel = player.level + 1;
      const milestone = getMilestoneTitle(newLevel);
      set((s) => ({
        player: {
          ...s.player, exp: newExp - expNeeded, level: newLevel,
          titles: milestone ? [...s.player.titles, milestone] : s.player.titles,
        },
      }));
      get()._saveMeta();
      window.dispatchEvent(new CustomEvent('writerquest:levelup', { detail: { level: newLevel } }));
      return { levelUp: true, newLevel };
    }
    set((s) => ({ player: { ...s.player, exp: newExp } }));
    get()._saveMeta();
    return { levelUp: false };
  },

  // ── 퀘스트 ────────────────────────────────────────────────────────

  updateQuestProgress: (questId, progress) => {
    const before = get().quests.find((q) => q.id === questId);
    set((s) => ({
      quests: s.quests.map((q) => {
        if (q.id !== questId || q.done) return q;
        const done = progress >= q.target;
        return { ...q, progress, done };
      }),
    }));
    get()._saveMeta();
    const quest = get().quests.find((q) => q.id === questId);
    if (quest?.done && !before?.done) {
      window.dispatchEvent(new CustomEvent('writerquest:quest', { detail: { title: quest.title } }));
    }
    return quest?.done ?? false;
  },
}));

// ── 유틸 ──────────────────────────────────────────────────────────────

function isYesterday(dateStr) {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().slice(0, 10);
}

function getMilestoneTitle(level) {
  const map = { 10: '초보 작가', 20: '이야기꾼', 30: '신예 작가', 40: '숙련 작가', 50: '베테랑 작가', 100: '전설의 작가' };
  if (map[level]) return map[level];
  if (level > 10 && level % 10 === 0) return `Lv.${level} 작가`;
  return null;
}

function getMockComments() {
  return [
    { id: '1', avatar: 'avatar_1.svg', name: '별빛독자', time: '방금 전',  message: '오늘 업데이트 너무 기대돼요! 빨리 다음화 보고 싶어요 🌟' },
    { id: '2', avatar: 'avatar_2.svg', name: '달빛서생', time: '5분 전',   message: '주인공이 드디어 결심하는 장면에서 눈물날 뻔했어요...' },
    { id: '3', avatar: 'avatar_3.svg', name: '글쟁이냥', time: '12분 전',  message: '작가님 문체가 너무 좋아요. 계속 읽히는 느낌?' },
    { id: '4', avatar: 'avatar_4.svg', name: '책벌레',   time: '1시간 전', message: '이번 주 안에 완결나나요? 궁금해서 잠 못 자겠어요 ㅠ' },
    { id: '5', avatar: 'avatar_5.svg', name: '밤독자',   time: '3시간 전', message: '정주행하고 왔는데 진짜 명작이에요. 추천 10만번!' },
  ];
}
