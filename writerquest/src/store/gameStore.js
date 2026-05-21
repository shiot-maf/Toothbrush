import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const TODAY = () => new Date().toISOString().slice(0, 10);

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
  { id: 'daily_words',   type: 'daily',  title: '오늘 1,000자 쓰기',     target: 1000, progress: 0, done: false, lastResetDate: TODAY() },
  { id: 'daily_dawn',    type: 'daily',  title: '새벽 감성 (00~04시)',    target: 1,    progress: 0, done: false, lastResetDate: TODAY() },
  { id: 'weekly_streak', type: 'weekly', title: '주 5일 이상 집필',       target: 5,    progress: 0, done: false, lastResetWeek: getMonday() },
  { id: 'focus_2h',      type: 'weekly', title: '집중 모드 2시간 달성',   target: 1,    progress: 0, done: false, lastResetWeek: getMonday() },
  { id: 'chapter_done',  type: 'once',   title: '챕터 완성하기',          target: 1,    progress: 0, done: false },
  { id: 'memos_5',       type: 'once',   title: '메모 5개 기록하기',      target: 5,    progress: 0, done: false },
];

function getMonday() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

export const useGameStore = create(
  persist(
    (set, get) => ({
      meta: { version: '1.0', createdAt: new Date().toISOString(), lastOpenedAt: new Date().toISOString() },
      player: { ...DEFAULT_PLAYER },
      novels: [],
      sessions: [],
      quests: DEFAULT_QUESTS,
      memos: [],
      comments: getMockComments(),

      setPlayer: (patch) => set((s) => ({ player: { ...s.player, ...patch } })),

      completeOnboarding: (nickname, firstNovelTitle) => {
        const novelTitle = firstNovelTitle.trim() || '나의 첫 이야기';
        set((s) => ({
          player: { ...s.player, nickname, onboarded: true },
          novels: [
            {
              id: crypto.randomUUID(),
              title: novelTitle,
              emoji: '🌙',
              chapters: [{ id: crypto.randomUUID(), title: '1화. 시작', content: '', wordCount: 0, completed: false }],
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      addNovel: (title, emoji = '📖') => {
        const novel = {
          id: crypto.randomUUID(),
          title,
          emoji,
          chapters: [{ id: crypto.randomUUID(), title: '1화. 시작', content: '', wordCount: 0, completed: false }],
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ novels: [...s.novels, novel] }));
      },

      updateChapterContent: (novelId, chapterId, content) => {
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
      },

      startSession: (chapterId) => {
        const session = {
          id: crypto.randomUUID(),
          chapterId,
          startAt: new Date().toISOString(),
          endAt: null,
          durationSec: 0,
          wordsWritten: 0,
          isRest: false,
        };
        set((s) => ({ sessions: [...s.sessions, session] }));
        return session.id;
      },

      endSession: (sessionId, wordsWritten) => {
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
      },

      addMemo: (text, novelId = null) => {
        const memo = { id: crypto.randomUUID(), text, novelId, createdAt: new Date().toISOString() };
        set((s) => ({ memos: [...s.memos, memo] }));
      },

      deleteMemo: (id) => set((s) => ({ memos: s.memos.filter((m) => m.id !== id) })),

      rest: () => {
        const { player } = get();
        const now = Date.now();
        const lastRest = player.energyLastRestAt ? new Date(player.energyLastRestAt).getTime() : 0;
        const cooldownMs = 30 * 60 * 1000;
        if (now - lastRest < cooldownMs) return false;
        set((s) => ({
          player: {
            ...s.player,
            energy: Math.min(100, s.player.energy + 30),
            energyLastRestAt: new Date().toISOString(),
          },
        }));
        return true;
      },

      checkMidnightReset: () => {
        const { player } = get();
        const today = TODAY();
        if (player.energyLastResetDate !== today) {
          set((s) => ({
            player: {
              ...s.player,
              energy: Math.min(100, s.player.energy + 50),
              energyLastResetDate: today,
            },
            quests: s.quests.map((q) => {
              if (q.type === 'daily') return { ...q, progress: 0, done: false, lastResetDate: today };
              if (q.type === 'weekly' && q.lastResetWeek !== getMonday())
                return { ...q, progress: 0, done: false, lastResetWeek: getMonday() };
              return q;
            }),
          }));
        }
      },

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
              ...s.player,
              exp: newExp - expNeeded,
              level: newLevel,
              titles: milestone ? [...s.player.titles, milestone] : s.player.titles,
            },
          }));
          return { levelUp: true, newLevel };
        }
        set((s) => ({ player: { ...s.player, exp: newExp } }));
        return { levelUp: false };
      },
    }),
    {
      name: 'writerquest',
      partialize: (s) => ({
        meta: s.meta,
        player: s.player,
        novels: s.novels,
        sessions: s.sessions,
        quests: s.quests,
        memos: s.memos,
      }),
    }
  )
);

function getMilestoneTitle(level) {
  const map = { 10: '초보 작가', 20: '이야기꾼', 30: '신예 작가', 40: '숙련 작가', 50: '베테랑 작가', 100: '전설의 작가' };
  if (map[level]) return map[level];
  if (level > 10 && level % 10 === 0) return `Lv.${level} 작가`;
  return null;
}

function getMockComments() {
  return [
    { id: '1', avatar: 'avatar_1.png', name: '별빛독자', time: '방금 전',   message: '오늘 업데이트 너무 기대돼요! 빨리 다음화 보고 싶어요 🌟' },
    { id: '2', avatar: 'avatar_2.png', name: '달빛서생', time: '5분 전',    message: '주인공이 드디어 결심하는 장면에서 눈물날 뻔했어요...' },
    { id: '3', avatar: 'avatar_3.png', name: '글쟁이냥', time: '12분 전',   message: '작가님 문체가 너무 좋아요. 계속 읽히는 느낌?' },
    { id: '4', avatar: 'avatar_4.png', name: '책벌레',   time: '1시간 전',  message: '이번 주 안에 완결나나요? 궁금해서 잠 못 자겠어요 ㅠ' },
    { id: '5', avatar: 'avatar_5.png', name: '밤독자',   time: '3시간 전',  message: '정주행하고 왔는데 진짜 명작이에요. 추천 10만번!' },
  ];
}
