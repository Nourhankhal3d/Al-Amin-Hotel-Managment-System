export const ASSISTANT_I18N = 'manager.aiAssistant';

/** Longest question the manager can send */
export const QUESTION_MAX_LENGTH = 500;

/** Chips under the chat and the "quick suggestions" list (texts in i18n under prompts.*) */
export const CHAT_PROMPTS = ['complaints', 'waitingCleaning', 'needMaintenance', 'vacantRooms'] as const;
export const SIDE_PROMPTS = ['shiftsSummary', 'revenueSummary', 'topIssues', 'occupiedRooms'] as const;

/** Value of the "c" URL param for a chat that has no conversation yet (created with the first question) */
export const NEW_CONVERSATION = 'new';
