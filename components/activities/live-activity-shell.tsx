'use client';

interface LiveActivityShellProps {
  emoji: string;
  title: string;
  prompt: string;
  isHost: boolean;
  resultsVisible: boolean;
  closed: boolean;
  onToggleResultsVisible?: (visible: boolean) => void;
  onToggleClosed?: (closed: boolean) => void;
  children: React.ReactNode;
}

export function LiveActivityShell({
  emoji,
  title,
  prompt,
  isHost,
  resultsVisible,
  closed,
  onToggleResultsVisible,
  onToggleClosed,
  children,
}: LiveActivityShellProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-indigo-50/40 to-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">{emoji}</div>
            <p className="text-xs uppercase tracking-widest font-bold text-indigo-500 mb-2">
              {title}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
              {prompt}
            </h2>
          </div>

          <div className="bg-white rounded-md border border-gray-200 shadow-sm p-5 sm:p-6">
            {children}
          </div>
        </div>
      </div>

      {isHost && (onToggleResultsVisible || onToggleClosed) && (
        <div className="border-t border-indigo-100 bg-white/80 backdrop-blur-sm px-4 py-2 flex items-center justify-end gap-3 flex-shrink-0">
          <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider hidden sm:inline">
            운영자 컨트롤
          </span>
          {onToggleResultsVisible && (
            <ToggleChip
              label="결과 공개"
              active={resultsVisible}
              onClick={() => onToggleResultsVisible(!resultsVisible)}
              activeColor="indigo"
            />
          )}
          {onToggleClosed && (
            <ToggleChip
              label={closed ? '마감됨' : '응답 받는 중'}
              active={closed}
              onClick={() => onToggleClosed(!closed)}
              activeColor="red"
            />
          )}
        </div>
      )}
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
  activeColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  activeColor: 'indigo' | 'red';
}) {
  const activeClass = activeColor === 'indigo'
    ? 'bg-indigo-600 text-white border-indigo-600'
    : 'bg-red-600 text-white border-red-600';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border-2 transition-colors ${
        active ? activeClass : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : 'bg-gray-300'}`}
        aria-hidden
      />
      {label}
    </button>
  );
}
