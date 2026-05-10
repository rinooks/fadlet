export const WORKSPACE_ID = 'default';

export const COLLECTIONS = {
  WORKSPACES: 'workspaces',
  BOARDS: 'boards',
  POSTS: 'posts',
  MESSAGES: 'messages',
  PARTICIPANTS: 'participants',
  REPORTS: 'reports',
  MEMBERS: 'members',
  OPERATORS: 'operators',
  POLL_RESPONSES: 'pollResponses',
  WORDCLOUD_ENTRIES: 'wordcloudEntries',
  QNA_QUESTIONS: 'qnaQuestions',
  ACTIVITY_STATES: 'activityStates',
  SETTINGS: 'settings',
  FEEDBACK: 'feedback',
} as const;

export const SETTINGS_DOC_ID = 'global';

export function boardsPath(wsId = WORKSPACE_ID) {
  return `${COLLECTIONS.WORKSPACES}/${wsId}/${COLLECTIONS.BOARDS}`;
}

export function postsPath(boardId: string, wsId = WORKSPACE_ID) {
  return `${boardsPath(wsId)}/${boardId}/${COLLECTIONS.POSTS}`;
}

export function messagesPath(boardId: string, wsId = WORKSPACE_ID) {
  return `${boardsPath(wsId)}/${boardId}/${COLLECTIONS.MESSAGES}`;
}

export function participantsPath(boardId: string, wsId = WORKSPACE_ID) {
  return `${boardsPath(wsId)}/${boardId}/${COLLECTIONS.PARTICIPANTS}`;
}

export function reportsPath(boardId: string, wsId = WORKSPACE_ID) {
  return `${boardsPath(wsId)}/${boardId}/${COLLECTIONS.REPORTS}`;
}

export function pollResponsesPath(boardId: string, wsId = WORKSPACE_ID) {
  return `${boardsPath(wsId)}/${boardId}/${COLLECTIONS.POLL_RESPONSES}`;
}

export function wordcloudEntriesPath(boardId: string, wsId = WORKSPACE_ID) {
  return `${boardsPath(wsId)}/${boardId}/${COLLECTIONS.WORDCLOUD_ENTRIES}`;
}

export function qnaQuestionsPath(boardId: string, wsId = WORKSPACE_ID) {
  return `${boardsPath(wsId)}/${boardId}/${COLLECTIONS.QNA_QUESTIONS}`;
}

export function activityStatesPath(boardId: string, wsId = WORKSPACE_ID) {
  return `${boardsPath(wsId)}/${boardId}/${COLLECTIONS.ACTIVITY_STATES}`;
}

export function activityStateDocPath(boardId: string, stageId: string, wsId = WORKSPACE_ID) {
  return `${activityStatesPath(boardId, wsId)}/${stageId}`;
}

export function workspacesCollectionPath() {
  return COLLECTIONS.WORKSPACES;
}

export function workspaceDocPath(wsId: string) {
  return `${COLLECTIONS.WORKSPACES}/${wsId}`;
}

export function workspaceMembersPath(wsId: string) {
  return `${COLLECTIONS.WORKSPACES}/${wsId}/${COLLECTIONS.MEMBERS}`;
}

export function operatorsPath() {
  return COLLECTIONS.OPERATORS;
}

export function operatorDocPath(uid: string) {
  return `${COLLECTIONS.OPERATORS}/${uid}`;
}

export function settingsDocPath() {
  return `${COLLECTIONS.SETTINGS}/${SETTINGS_DOC_ID}`;
}

export function feedbackPath() {
  return COLLECTIONS.FEEDBACK;
}
