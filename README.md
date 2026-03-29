# Private Equity Flow Dashboard

사모·투신 추종 전략을 웹 대시보드로 보여주는 Next.js 앱입니다.

## 로컬 실행

가장 쉬운 방법:

- `사모투신 대시보드.bat`

필요할 때만 수동 재빌드:

- `rebuild_follow_dashboard.bat`

직접 실행:

```bash
npm install
pip install -r requirements.txt
npm run build
npm run start
```

브라우저에서 `http://127.0.0.1:3000` 으로 접속하면 됩니다.

## 주요 기능

- 최근 5거래일 기준 사모+투신 추종 랭킹
- 날짜 선택
- 기준일 vs 비교일 비교
- 종목 클릭 시 네이버증권 종목 페이지 이동
- KRX/Naver 기반 데이터 수집

## 구조

- `src/app/api/dashboard/route.ts`
  - 메인 대시보드 API
- `src/lib/services/follow-dashboard-service.ts`
  - Node 서버에서 파이썬 스크립트를 실행해 JSON으로 받는 부분
- `scripts/build_private_equity_ranking.py`
  - 데이터 수집 및 계산 로직
- `src/components/dashboard-page.tsx`
  - 메인 대시보드 UI

## 배포

이 프로젝트는 정적 사이트가 아니라 서버에서 파이썬을 실행합니다.
그래서 `Vercel`보다 아래 플랫폼이 더 잘 맞습니다.

- Render
- Railway
- Fly.io
- VPS

### Render 배포

1. GitHub에 이 프로젝트를 올립니다.
2. Render에서 `New +` → `Web Service`를 누릅니다.
3. GitHub repo를 연결합니다.
4. Render가 `Dockerfile`과 `render.yaml`을 읽어 빌드합니다.
5. 배포가 끝나면 발급된 URL을 공유하면 됩니다.

### Docker 로컬 테스트

```bash
docker build -t follow-dashboard .
docker run -p 3000:3000 follow-dashboard
```

## 주의

- 첫 요청은 KRX 수집 때문에 수 초에서 수십 초 걸릴 수 있습니다.
- `/api/dashboard`는 10분 캐시를 사용합니다.
- 무료 Render 웹 서비스는 일정 시간 비활성 상태면 잠들 수 있습니다.
