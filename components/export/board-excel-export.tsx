'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useBoard } from '@/lib/hooks/use-board';
import { useMessages } from '@/lib/hooks/use-messages';
import { usePosts } from '@/lib/hooks/use-posts';
import { useCollectionAll } from '@/components/export/board-export-content';
import {
  pollResponsesPath,
  qnaQuestionsPath,
  wordcloudEntriesPath,
} from '@/lib/firebase/collections';
import { downloadBoardExcel } from '@/lib/utils/board-excel';
import type { PollResponse, QnaQuestion, WordcloudEntry } from '@/lib/types';

interface Props {
  boardId: string;
}

type Status = 'loading' | 'generating' | 'done' | 'error';

export function BoardExcelExport({ boardId }: Props) {
  const { board, loading: boardLoading } = useBoard(boardId);
  const { posts, loading: postsLoading } = usePosts(boardId);
  const { messages, loading: msgsLoading } = useMessages(boardId);

  const isWorkshop = board?.mode === 'workshop';

  const { items: pollResponses, loading: pollLoading } = useCollectionAll<PollResponse>(
    isWorkshop ? pollResponsesPath(boardId) : null,
  );
  const { items: wordcloudEntries, loading: wcLoading } = useCollectionAll<WordcloudEntry>(
    isWorkshop ? wordcloudEntriesPath(boardId) : null,
  );
  const { items: qnaQuestions, loading: qnaLoading } = useCollectionAll<QnaQuestion>(
    isWorkshop ? qnaQuestionsPath(boardId) : null,
  );

  const ready =
    !boardLoading &&
    !postsLoading &&
    !msgsLoading &&
    !!board &&
    (!isWorkshop || (!pollLoading && !wcLoading && !qnaLoading));

  const [status, setStatus] = useState<Status>('loading');
  const startedRef = useRef(false);

  const data = useMemo(
    () =>
      board
        ? {
            board,
            posts,
            messages,
            pollResponses,
            wordcloudEntries,
            qnaQuestions,
            isWorkshop: !!isWorkshop,
          }
        : null,
    [board, posts, messages, pollResponses, wordcloudEntries, qnaQuestions, isWorkshop],
  );

  useEffect(() => {
    if (!ready || !data || startedRef.current) return;
    startedRef.current = true;
    setStatus('generating');
    downloadBoardExcel(data)
      .then(() => setStatus('done'))
      .catch((err) => {
        console.error('[BoardExcelExport] 엑셀 생성 실패', err);
        setStatus('error');
      });
  }, [ready, data]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      {status === 'error' ? (
        <>
          <p className="text-sm font-semibold text-red-600">엑셀 파일을 만들지 못했습니다.</p>
          <p className="text-xs text-gray-500">잠시 후 다시 시도해 주세요.</p>
        </>
      ) : status === 'done' ? (
        <>
          <p className="text-2xl">📊</p>
          <p className="text-sm font-semibold text-gray-900">엑셀 파일을 내려받았습니다.</p>
          <p className="text-xs text-gray-500">
            다운로드가 시작되지 않았다면 브라우저의 다운로드 차단을 확인해 주세요.
          </p>
          <button
            type="button"
            onClick={() => startedRef.current && data && downloadBoardExcel(data)}
            className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700"
          >
            다시 내려받기
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            창 닫기
          </button>
        </>
      ) : (
        <>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
          <p className="text-sm text-gray-600">
            {status === 'generating' ? '엑셀 파일을 만드는 중...' : '데이터를 불러오는 중...'}
          </p>
        </>
      )}
    </div>
  );
}
