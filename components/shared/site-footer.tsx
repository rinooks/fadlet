import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="relative bg-gray-950 text-gray-400">
      <div className="mx-auto max-w-6xl px-6 py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-12 sm:gap-8">
          {/* 브랜드 */}
          <div className="sm:col-span-7">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-white tracking-tight">Fadlet</span>
              <span className="text-xs font-semibold text-indigo-400">워크숍 OS</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-400 max-w-sm">
              기술과 교육의 경계를 허무는 HRD 파트너.<br />
              데이터와 경험을 통해 조직의 성장을 돕습니다.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900/60 px-3 py-1.5">
                <span className="text-xs font-bold text-pink-400">♀</span>
                <span className="text-[11px] font-semibold text-gray-300">여성기업 인증</span>
                <span className="text-[11px] font-mono text-gray-500">제 0118-2022-23209호</span>
              </div>
              <a
                href="https://referencehrd.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
              >
                회사소개
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          </div>

          {/* Contact */}
          <div className="sm:col-span-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Contact</h3>
            <ul className="space-y-2.5 text-sm">
              <li className="text-gray-400 leading-relaxed">
                서울특별시 강서구 마곡동 757<br />
                두산더랜드파크 A동 410호<br />
                <span className="text-gray-500 text-xs">(우) 07788</span>
              </li>
              <li>
                <a href="tel:070-4647-4757" className="text-gray-300 hover:text-white transition-colors">
                  070-4647-4757
                </a>
              </li>
              <li>
                <a href="mailto:help@referencehrd.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                  help@referencehrd.com
                </a>
              </li>
              <li className="text-xs text-gray-500">평일 09:00~18:00</li>
            </ul>
          </div>
        </div>

        {/* 하단 사업자 정보 + 저작권 */}
        <div className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3 text-xs">
            <Link href="/terms" className="text-gray-300 hover:text-white transition-colors font-semibold">
              이용약관
            </Link>
            <span className="text-gray-700">·</span>
            <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors font-semibold">
              개인정보처리방침
            </Link>
            <span className="text-gray-700">·</span>
            <Link href="/help" className="text-gray-400 hover:text-white transition-colors">
              도움말
            </Link>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500 leading-relaxed">
              상호명 <span className="text-gray-400">(주)레퍼런스에이치알디</span> ·
              대표 <span className="text-gray-400">박준형, 강윤정</span> ·
              사업자등록번호 <span className="text-gray-400 font-mono">887-81-01384</span>
            </p>
            <p className="text-xs text-gray-500">
              © 2026 REFERENCE HRD Inc. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
