import Link from 'next/link';

export const metadata = {
  title: '페이지를 찾을 수 없습니다 · Fadlet',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <p className="text-7xl font-bold text-indigo-600 tracking-tight">404</p>
        <h1 className="mt-6 text-2xl font-bold text-gray-900">페이지를 찾을 수 없어요</h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          요청하신 주소가 변경되었거나 더 이상 존재하지 않습니다.<br />
          보드 코드로 입장하시려면 입장 페이지를 이용해 주세요.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            홈으로 가기
          </Link>
          <Link
            href="/boards/join"
            className="inline-flex h-11 items-center justify-center rounded-full border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
          >
            보드 코드로 입장
          </Link>
        </div>
      </div>
    </div>
  );
}
