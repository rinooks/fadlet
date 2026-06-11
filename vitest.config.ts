import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 보안 규칙 테스트만 포함 (Firestore 에뮬레이터 필요)
    include: ['tests/**/*.test.ts'],
    // 에뮬레이터 부팅/시드 여유
    testTimeout: 15000,
    hookTimeout: 30000,
    // 에뮬레이터 상태 공유 — 파일 간 병렬 실행 비활성화
    fileParallelism: false,
  },
});
