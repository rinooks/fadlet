// 랜딩 페이지 섹션용 미니 미리보기 컴포넌트 모음.
// 모두 정적 JSX. 실제 앱 UI와 톤을 맞추되 가벼운 목업으로 빠르게 렌더된다.

function PreviewFrame({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg border border-gray-200/80 bg-gradient-to-br from-gray-50 to-white shadow-inner ${className}`}
    >
      {children}
    </div>
  );
}

// 1. 30초 입장 — 4자리 코드 입력 (실제 UI는 단일 입력 박스, 비주얼은 자릿수 강조)
export function JoinCodePreview() {
  const code = ['K', '3', 'F', '2'];
  return (
    <PreviewFrame className="aspect-[5/2] p-3">
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-400">보드 코드</p>
        <div className="flex gap-1.5">
          {code.map((c, i) => (
            <div
              key={i}
              className="flex h-8 w-7 items-center justify-center rounded-md border border-indigo-200 bg-white font-mono text-sm font-bold text-indigo-600 shadow-sm"
            >
              {c}
            </div>
          ))}
        </div>
        <div className="mt-1 inline-flex h-5 items-center rounded-md bg-indigo-600 px-3 text-[9px] font-semibold text-white">
          입장하기
        </div>
      </div>
    </PreviewFrame>
  );
}

// 2. 보드형 + 라이브 — 포스트잇 + 막대 차트
export function BoardLivePreview() {
  return (
    <PreviewFrame className="aspect-[5/2] p-2">
      <div className="grid h-full grid-cols-2 gap-2">
        {/* 보드형: 포스트잇 */}
        <div className="relative rounded-md bg-white/60 p-1.5">
          <div className="absolute left-2 top-2 h-5 w-7 rotate-[-6deg] rounded-sm bg-yellow-200 shadow-sm" />
          <div className="absolute left-7 top-3 h-5 w-7 rotate-[3deg] rounded-sm bg-pink-200 shadow-sm" />
          <div className="absolute left-4 top-8 h-5 w-7 rotate-[-2deg] rounded-sm bg-blue-200 shadow-sm" />
          <div className="absolute right-1 bottom-1 text-[7px] font-semibold text-gray-400">보드</div>
        </div>
        {/* 라이브: 막대 차트 */}
        <div className="relative flex flex-col justify-center gap-1 rounded-md bg-white/60 p-2">
          <div className="h-2 w-[80%] rounded-sm bg-indigo-500" />
          <div className="h-2 w-[55%] rounded-sm bg-indigo-400" />
          <div className="h-2 w-[35%] rounded-sm bg-indigo-300" />
          <div className="h-2 w-[20%] rounded-sm bg-indigo-200" />
          <div className="absolute right-1 bottom-1 text-[7px] font-semibold text-gray-400">라이브</div>
        </div>
      </div>
    </PreviewFrame>
  );
}

// 3. 단계 시퀀스 — 타임라인
export function SequencePreview() {
  return (
    <PreviewFrame className="aspect-[5/2] p-3">
      <div className="flex h-full flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-1">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[8px] font-bold text-emerald-600">✓</div>
          <div className="h-[2px] w-4 bg-gray-200" />
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-bold text-white shadow-md">2</div>
          <div className="h-[2px] w-4 bg-gray-200" />
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[8px] font-bold text-gray-400">3</div>
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-mono font-bold text-indigo-600">
          <span className="h-1 w-1 animate-pulse rounded-full bg-indigo-500" />
          02:14
        </div>
        <p className="text-[8px] font-medium text-gray-500">KPT 회고 진행 중</p>
      </div>
    </PreviewFrame>
  );
}

// 4. 통합 PDF 리포트 — 문서 미리보기
export function PdfReportPreview() {
  return (
    <PreviewFrame className="aspect-[5/2] p-3">
      <div className="flex h-full items-center justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`relative h-[72px] w-12 rounded-sm border border-gray-200 bg-white shadow-sm ${i === 1 ? 'scale-110 shadow-md' : 'opacity-70'}`}
          >
            <div className="absolute left-1 right-1 top-1 h-1 rounded-sm bg-indigo-500" />
            <div className="absolute left-1 right-2 top-3 h-[2px] rounded-sm bg-gray-300" />
            <div className="absolute left-1 right-3 top-5 h-[2px] rounded-sm bg-gray-200" />
            <div className="absolute left-1 right-2 top-7 h-[2px] rounded-sm bg-gray-200" />
            {i === 1 && (
              <div className="absolute bottom-1 left-1 right-1 h-4 rounded-sm bg-gradient-to-t from-indigo-100 to-indigo-50" />
            )}
            <div className="absolute bottom-0.5 right-1 text-[6px] font-mono text-gray-400">{i + 1}</div>
          </div>
        ))}
      </div>
    </PreviewFrame>
  );
}

// 5. 실시간 채팅 — 버블 3개
export function ChatPreview() {
  return (
    <PreviewFrame className="aspect-[5/2] p-2.5">
      <div className="flex h-full flex-col justify-center gap-1.5">
        <div className="flex items-end gap-1">
          <div className="h-4 w-4 rounded-full bg-purple-300" />
          <div className="rounded-md rounded-bl-sm bg-white px-2 py-1 text-[8px] text-gray-700 shadow-sm">좋은 의견이에요!</div>
        </div>
        <div className="flex justify-end">
          <div className="rounded-md rounded-br-sm bg-indigo-600 px-2 py-1 text-[8px] text-white shadow-sm">자료 공유드려요 📎</div>
        </div>
        <div className="flex items-end gap-1">
          <div className="h-4 w-4 rounded-full bg-emerald-300" />
          <div className="flex items-center gap-1 rounded-md rounded-bl-sm bg-white px-1.5 py-1 shadow-sm">
            <div className="h-3 w-4 rounded-sm bg-gradient-to-br from-pink-200 to-orange-200" />
            <span className="text-[8px] text-gray-700">사진</span>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

// 6. 퍼실리테이터 도구 — 패널 (스킨 8가지 실제 반영)
export function FacilitatorPreview() {
  const skins = [
    'bg-white border-gray-200',
    'bg-amber-100 border-gray-200',
    'bg-sky-100 border-gray-200',
    'bg-slate-800 border-indigo-500 border-2',
    'bg-emerald-200 border-gray-200',
    'bg-pink-200 border-gray-200',
    'bg-orange-200 border-gray-200',
    'bg-purple-200 border-gray-200',
  ];
  return (
    <PreviewFrame className="aspect-[5/2] p-2.5">
      <div className="flex h-full flex-col justify-center gap-1.5">
        <div className="flex items-center justify-between rounded-md bg-white px-2 py-1 shadow-sm">
          <span className="text-[8px] font-medium text-gray-700">🔒 보드 잠금</span>
          <div className="relative h-3 w-6 rounded-full bg-indigo-600">
            <div className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-white" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md bg-white px-2 py-1 shadow-sm">
          <span className="text-[8px] font-medium text-gray-700">🚨 신고 2건</span>
          <span className="flex h-3 min-w-3 items-center justify-center rounded-full bg-red-500 px-1 text-[7px] font-bold text-white">2</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[7px] font-semibold text-gray-400">스킨</span>
          {skins.map((cls, i) => (
            <div key={i} className={`h-2.5 w-2.5 rounded-sm border ${cls}`} />
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
}

// ========================================
// Why Fadlet 섹션용 (TOOLS_UNIFIED) — 더 큰 비주얼
// ========================================

// Slido 대체: 라이브 폴 + 워드클라우드 + Q&A 종합
export function LiveSuitePreview() {
  return (
    <PreviewFrame className="aspect-[3/2] p-3">
      <div className="grid h-full grid-cols-3 gap-1.5">
        {/* 폴 */}
        <div className="flex flex-col justify-center gap-1 rounded-md bg-white/70 p-1.5">
          <div className="h-1.5 w-[85%] rounded-sm bg-indigo-500" />
          <div className="h-1.5 w-[60%] rounded-sm bg-indigo-400" />
          <div className="h-1.5 w-[30%] rounded-sm bg-indigo-300" />
          <p className="mt-0.5 text-[7px] font-semibold text-gray-500">폴</p>
        </div>
        {/* 워드클라우드 */}
        <div className="relative flex items-center justify-center rounded-md bg-white/70">
          <span className="absolute text-[14px] font-black text-indigo-600">성장</span>
          <span className="absolute -top-0.5 left-1 text-[7px] font-bold text-purple-400">협업</span>
          <span className="absolute bottom-1 right-1 text-[8px] font-bold text-pink-400">소통</span>
          <span className="absolute top-2 right-1 text-[6px] font-semibold text-gray-400">학습</span>
          <p className="absolute bottom-0.5 left-1 text-[7px] font-semibold text-gray-500">워드</p>
        </div>
        {/* Q&A */}
        <div className="flex flex-col justify-center gap-0.5 rounded-md bg-white/70 p-1.5">
          <div className="flex items-center gap-1">
            <span className="text-[7px] font-bold text-red-500">▲ 12</span>
            <div className="h-1 flex-1 rounded-sm bg-gray-200" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[7px] font-bold text-orange-500">▲ 8</span>
            <div className="h-1 flex-1 rounded-sm bg-gray-200" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[7px] font-bold text-gray-400">▲ 3</span>
            <div className="h-1 flex-1 rounded-sm bg-gray-200" />
          </div>
          <p className="mt-0.5 text-[7px] font-semibold text-gray-500">Q&A</p>
        </div>
      </div>
    </PreviewFrame>
  );
}

// Padlet 대체: 보드 캔버스 + 우측 퍼실리테이터 패널 (실제 레이아웃 반영)
export function BoardSuitePreview() {
  const notes = [
    { color: 'bg-yellow-200', rot: '-rotate-[5deg]' },
    { color: 'bg-pink-200', rot: 'rotate-[3deg]' },
    { color: 'bg-blue-200', rot: '-rotate-[2deg]' },
    { color: 'bg-emerald-200', rot: 'rotate-[4deg]' },
    { color: 'bg-purple-200', rot: '-rotate-[3deg]' },
    { color: 'bg-orange-200', rot: 'rotate-[2deg]' },
  ];
  return (
    <PreviewFrame className="aspect-[3/2] p-2">
      <div className="grid h-full grid-cols-[1fr_auto] gap-1.5">
        {/* 보드 영역 */}
        <div className="rounded-md bg-white/70 p-1.5">
          <div className="grid h-full grid-cols-3 grid-rows-2 gap-1">
            {notes.map((n, i) => (
              <div key={i} className={`rounded-sm ${n.color} ${n.rot} shadow-sm`} />
            ))}
          </div>
        </div>
        {/* 퍼실리테이터 미니 패널 */}
        <div className="flex w-12 flex-col gap-1 rounded-md bg-gray-50 p-1">
          <div className="flex items-center justify-between rounded-sm bg-white px-1 py-0.5 shadow-sm">
            <span className="text-[6px] font-semibold text-gray-600">🔒</span>
            <div className="h-1.5 w-3 rounded-full bg-indigo-600" />
          </div>
          <div className="rounded-sm bg-white px-1 py-0.5 text-center shadow-sm">
            <span className="text-[6px] font-semibold text-gray-400">신고</span>
            <span className="ml-0.5 text-[6px] font-bold text-red-500">2</span>
          </div>
          <div className="rounded-sm bg-white px-1 py-0.5 text-center shadow-sm">
            <span className="font-mono text-[7px] font-bold text-indigo-600">04:32</span>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

// 카카오 오픈채팅 대체: 채팅 + 첨부 + 공지
export function ChatSuitePreview() {
  return (
    <PreviewFrame className="aspect-[3/2] p-2.5">
      <div className="flex h-full flex-col gap-1">
        {/* 공지 */}
        <div className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[8px] font-semibold text-amber-700">
          📌 12:00 점심 후 재개합니다
        </div>
        <div className="flex flex-1 flex-col justify-end gap-1">
          <div className="flex items-end gap-1">
            <div className="h-4 w-4 rounded-full bg-purple-300" />
            <div className="rounded-md rounded-bl-sm bg-white px-2 py-0.5 text-[8px] text-gray-700 shadow-sm">좋아요!</div>
          </div>
          <div className="flex justify-end">
            <div className="flex items-center gap-1 rounded-md rounded-br-sm bg-indigo-600 px-1.5 py-0.5 shadow-sm">
              <span className="text-[8px]">📎</span>
              <span className="text-[8px] font-medium text-white">기획서.pdf</span>
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}
