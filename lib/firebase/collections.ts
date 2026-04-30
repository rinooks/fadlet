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
} as const;

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
