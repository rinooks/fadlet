import Link from 'next/link';
import { Settings } from 'lucide-react';

const FEATURES = [
  {
    icon: '⚡',
    title: '30초 입장',
    desc: '가입 없이 6자리 코드로 즉시 합류. 호스트는 Google 로그인만으로 시작.',
  },
  {
    icon: '🗺️',
    title: '8가지 템플릿',
    desc: '자유형·캔버스·브레인스토밍·KPT·4F·Q&A·찬반·9칸 윈도우.',
  },
  {
    icon: '🎨',
    title: '4가지 스킨',
    desc: 'Standard·Compact·Glass·Brutal 중에서 워크숍 분위기에 맞춰 선택.',
  },
  {
    icon: '⏱',
    title: '단계·타이머',
    desc: '단계별 일정과 카운트다운으로 워크숍 진행을 한눈에.',
  },
  {
    icon: '💬',
    title: '실시간 채팅',
    desc: '파일 첨부, 링크 미리보기, 미디어 갤러리, 공지 고정까지.',
  },
  {
    icon: '🛡',
    title: '운영자 도구',
    desc: '보드 잠금, 신고 관리, 금칙어, 분석 대시보드, PDF 내보내기.',
  },
];

const TEMPLATES = [
  { emoji: '✏️', label: '자유형', desc: '제약 없이 자유롭게 포스트를 추가합니다.' },
  { emoji: '🗺️', label: '캔버스', desc: '포스트를 원하는 위치에 자유롭게 배치합니다.' },
  { emoji: '💡', label: '브레인스토밍', desc: '아이디어를 자유롭게 쏟아냅니다.' },
  { emoji: '⚖️', label: '찬반', desc: '주제에 대한 찬성과 반대 의견을 나눕니다.' },
  { emoji: '🔄', label: 'KPT', desc: 'Keep · Problem · Try 세 가지로 팀을 돌아봅니다.' },
  { emoji: '📋', label: '4F', desc: 'Fact · Feeling · Finding · Future로 경험을 회고합니다.' },
  { emoji: '❓', label: 'Q&A', desc: '질문과 답변을 나란히 모읍니다.' },
  { emoji: '🔲', label: '9칸', desc: '핵심 주제를 중심으로 9개 영역을 탐색합니다.' },
];

// 결정론적 의사 난수 (hydration mismatch 방지: 인덱스 기반 일관된 값)
const STICKY_COLORS = ['#FEF3C7', '#FCE7F3', '#DBEAFE', '#D1FAE5', '#EDE9FE', '#FED7AA'];
const STICKY_ANIMS = ['sticky-float-a', 'sticky-float-b', 'sticky-float-c', 'sticky-float-d'];

const STICKY_NOTES = Array.from({ length: 42 }, (_, i) => {
  const left = ((i * 73 + 13) % 100);
  const top = ((i * 53 + 29) % 100);
  const size = 36 + ((i * 17) % 56); // 36~92px
  const rot = (((i * 41) % 60) - 30); // -30 ~ +30deg
  const color = STICKY_COLORS[i % STICKY_COLORS.length];
  const anim = STICKY_ANIMS[i % STICKY_ANIMS.length];
  const dur = 28 + ((i * 7) % 22); // 28~50s
  const delay = -((i * 11) % 30); // -29~0s (음수: 즉시 진행 중인 상태에서 시작)
  return { left, top, size, rot, color, anim, dur, delay };
});

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* 배경 효과 (root보다 뒤로 빠지지 않도록 z-index 0, content는 z-10) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-white">
        {/* 베이스 그라데이션 워시 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(1200px 700px at 80% -10%, rgba(168,85,247,0.12), transparent 60%), radial-gradient(900px 600px at -10% 30%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(800px 600px at 50% 110%, rgba(96,165,250,0.12), transparent 60%)',
          }}
        />
        {/* 미세 도트 그리드 */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* 떠다니는 포스트잇 */}
        {STICKY_NOTES.map((n, i) => (
          <div
            key={i}
            className={`sticky-note ${n.anim}`}
            style={
              {
                left: `${n.left}%`,
                top: `${n.top}%`,
                '--size': `${n.size}px`,
                '--bg': n.color,
                '--rot': `${n.rot}deg`,
                '--dur': `${n.dur}s`,
                animationDelay: `${n.delay}s`,
                opacity: 0.85,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="relative z-10 flex flex-col flex-1">

      {/* 헤더 */}
      <header className="relative flex items-center justify-between px-6 py-4 border-b border-gray-100/80 backdrop-blur-sm bg-white/40">
        <span className="text-indigo-600 font-bold text-xl tracking-tight">Fadlet</span>
        <Link
          href="/login"
          aria-label="운영자 로그인"
          title="운영자 로그인"
          className="group inline-flex items-center justify-center w-9 h-9 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-white hover:border-gray-300 border border-transparent transition-all"
        >
          <Settings size={18} className="transition-transform group-hover:rotate-90" />
        </Link>
      </header>

      {/* 히어로 */}
      <main className="flex-1 flex flex-col items-center px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-6 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          Facilitator-friendly Padlet · Beta
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 mb-5 leading-[1.05] tracking-tight">
          포스트잇은<br className="sm:hidden" />
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent"> 끝났다.</span>
        </h1>
        <p className="text-gray-600 text-base sm:text-xl mb-10 max-w-2xl leading-relaxed">
          라이브 보드, 실시간 채팅, 운영자 도구까지.<br className="hidden sm:inline" />
          가입 없이 <strong className="text-gray-900 font-semibold">30초</strong>면 워크숍이 시작됩니다.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-14">
          <Link
            href="/boards/new"
            className="group inline-flex items-center justify-center h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition-all shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 hover:-translate-y-0.5"
          >
            보드 만들기
            <span className="ml-2 transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/boards/join"
            className="inline-flex items-center justify-center h-12 px-8 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-gray-300 text-gray-900 font-semibold text-base transition-all"
          >
            코드로 입장하기
          </Link>
        </div>

        {/* 템플릿 미리보기 */}
        <div className="w-full max-w-3xl mb-16">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
            Templates
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {TEMPLATES.map((t) => (
              <span
                key={t.label}
                tabIndex={0}
                className="group relative inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-gray-300 hover:border-indigo-400 hover:bg-white text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full cursor-help transition-colors focus:outline-none focus:border-indigo-500"
              >
                <span>{t.emoji}</span>
                {t.label}
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 whitespace-nowrap bg-gray-900 text-white text-[11px] font-normal px-2.5 py-1.5 rounded-md shadow-lg opacity-0 translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-y-0 group-focus:opacity-100 group-focus:translate-y-0"
                >
                  {t.desc}
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" aria-hidden />
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* 기능 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl w-full">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white/80 backdrop-blur-sm border border-gray-300 rounded-xl p-5 text-left transition-all hover:border-indigo-400 hover:bg-white hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* 슬로건 */}
        <p className="mt-16 text-sm text-gray-400 italic">
          &ldquo;고객의 물음표를 느낌표로!&rdquo;
        </p>
      </main>

      <footer className="relative text-center py-6 text-xs text-gray-400 border-t border-gray-100/80 backdrop-blur-sm bg-white/40">
        © 2026 REFERENCE HRD. All Rights Reserved.
      </footer>
      </div>
    </div>
  );
}
