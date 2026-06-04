export const state = {
  character: {
    name: "",
    personality: "",
    speechStyle: "",
    situation: ""
  },

  isLoading: false,
  lastUserMessage: null,
  currentSessionId: null,
  currentUid: null,

  conversationHistory: [],
  pinnedMessages: [],
  memoPins: [],

  correctionHistory: [],
  pinnedCorrections: [],
}
