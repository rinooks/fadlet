import Link from 'next/link';
import { SiteFooter } from '@/components/shared/site-footer';

export const metadata = {
  title: '개인정보처리방침 · Fadlet',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-3">
          <Link href="/" className="relative text-indigo-600 font-bold text-xl hover:text-indigo-700 transition-colors">
            Fadlet
            <span className="absolute -top-1 -right-4 text-[10px] font-semibold text-indigo-400 leading-none">beta</span>
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm text-gray-600 font-medium">개인정보처리방침</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
        <p className="text-sm text-gray-500 mb-10">시행일: 2026년 5월 18일</p>

        <article className="space-y-8 text-sm leading-relaxed text-gray-700">
          <p>
            (주)레퍼런스에이치알디(이하 &ldquo;회사&rdquo;)는 Fadlet 서비스(이하 &ldquo;서비스&rdquo;) 이용자의
            개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은 회사가 수집·이용·보관하는
            개인정보의 범위와 처리 방법을 안내합니다.
          </p>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">1. 수집하는 개인정보의 항목</h2>
            <p className="mb-2">회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>퍼실리테이터(운영자) 회원가입 시</strong>: 이메일, 이름, 프로필 사진(Google 로그인 제공 정보)</li>
              <li><strong>워크숍 참여자</strong>: 닉네임(별명) — 익명 인증 기반, 실명 수집 없음</li>
              <li><strong>이용 과정에서 자동 생성</strong>: 보드/포스트/채팅 등 이용자가 작성한 콘텐츠, 접속 시각, 기기 정보, IP 주소</li>
              <li><strong>문의/피드백 시</strong>: 이메일, 문의 내용</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">2. 개인정보의 수집 및 이용 목적</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스 제공 및 본인 식별·인증</li>
              <li>워크숍 보드 생성, 진행, 결과 저장 및 내보내기</li>
              <li>서비스 안정성 확보, 부정 이용 방지, 신고 처리</li>
              <li>고객 문의 응대 및 베타 기간 중 기능 개선을 위한 분석</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">3. 개인정보의 보유 및 이용 기간</h2>
            <p>
              이용자의 개인정보는 수집·이용 목적이 달성된 후 지체 없이 파기합니다. 다만 관련 법령에서 일정 기간
              보관을 의무화한 경우 해당 기간 동안 보관합니다.
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>회원 정보: 회원 탈퇴 시까지</li>
              <li>보드/콘텐츠: 보드 삭제 시까지 (또는 회원 탈퇴 시)</li>
              <li>접속 기록: 「통신비밀보호법」에 따라 3개월</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">4. 개인정보의 제3자 제공</h2>
            <p>
              회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 법령에 근거하거나 수사기관의
              적법한 절차에 따른 요청이 있는 경우는 예외로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">5. 개인정보 처리의 위탁</h2>
            <p>회사는 안정적인 서비스 제공을 위해 다음 업체에 개인정보 처리를 위탁하고 있습니다.</p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-xs border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border border-gray-200 px-3 py-2 text-left">수탁업체</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">위탁 업무</th>
                    <th className="border border-gray-200 px-3 py-2 text-left">위치</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Google LLC (Firebase)</td>
                    <td className="border border-gray-200 px-3 py-2">인증, 데이터베이스, 파일 저장</td>
                    <td className="border border-gray-200 px-3 py-2">미국 등</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Vercel Inc.</td>
                    <td className="border border-gray-200 px-3 py-2">서비스 호스팅</td>
                    <td className="border border-gray-200 px-3 py-2">미국 등</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-200 px-3 py-2">Google LLC (Gemini API)</td>
                    <td className="border border-gray-200 px-3 py-2">AI 인사이트 생성 (퍼실리테이터 요청 시)</td>
                    <td className="border border-gray-200 px-3 py-2">미국 등</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">6. 이용자의 권리와 행사 방법</h2>
            <p>
              이용자는 언제든지 자신의 개인정보를 열람·정정·삭제·처리정지를 요구할 수 있으며, 회원 탈퇴를 통해
              수집된 정보의 삭제를 요청할 수 있습니다. 권리 행사는 아래 문의처로 요청해 주시기 바랍니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">7. 개인정보의 안전성 확보 조치</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>접근 권한 관리: Firebase 보안 규칙을 통한 데이터 접근 제어</li>
              <li>전송 구간 암호화: HTTPS(TLS) 전 구간 적용</li>
              <li>비밀번호 미보유: Google OAuth 인증 사용으로 회사가 비밀번호를 직접 저장하지 않음</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">8. 쿠키 및 로컬 저장소</h2>
            <p>
              서비스는 사용자 편의를 위해 브라우저 로컬 저장소에 닉네임, 보드 코드, 마지막 읽은 시각 등 최소한의
              정보를 저장합니다. 이용자는 브라우저 설정에서 이를 거부하거나 삭제할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">9. 개인정보 보호책임자</h2>
            <ul className="space-y-1">
              <li>책임자: 박준형</li>
              <li>소속: (주)레퍼런스에이치알디</li>
              <li>이메일: <a href="mailto:help@referencehrd.com" className="text-indigo-600 hover:underline">help@referencehrd.com</a></li>
              <li>전화: 070-4647-4757</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-2">10. 방침의 변경</h2>
            <p>
              본 방침의 내용이 변경되는 경우 변경 사항을 시행일 7일 전에 서비스 내 공지를 통해 안내합니다.
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
