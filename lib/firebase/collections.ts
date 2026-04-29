export const WORKSPACE_ID = 'default';

export const COLLECTIONS = {
  WORKSPACES: 'workspaces',
  BOARDS: 'boards',
  POSTS: 'posts',
  MESSAGES: 'messages',
  PARTICIPANTS: 'participants',
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
