# Private Equity Flow Dashboard

사모·투신 추종 전략을 웹 대시보드로 보여주는 Next.js 앱입니다.

## 지금 구조

- 배포 시점에 최근 거래일 스냅샷 JSON을 미리 생성합니다.
- 웹은 그 정적 JSON만 읽습니다.
- 그래서 무료 정적 호스팅에 더 잘 맞고, 접속 시 서버 계산이 없습니다.

## 로컬 실행

```bash
npm install
pip install -r requirements.txt
npm run build
```

빌드가 끝나면 정적 결과물은 `out/` 에 생성됩니다.

개발 모드:

```bash
npm run dev
```

## 주요 기능

- 최근 거래일 스냅샷 기반 사모+투신 추종 랭킹
- 기준일/비교일 선택
- 메인신호/추종점수 변화 비교
- 종목 클릭 시 네이버증권 이동

## 데이터 생성

- `scripts/build_private_equity_ranking.py`
  - 단일 날짜 스냅샷 계산
- `scripts/generate_static_dashboards.py`
  - 최근 여러 거래일 스냅샷을 정적 JSON으로 생성

## Render 배포

이제는 `Web Service`보다 `Static Site`가 더 맞습니다.

1. Render에서 `New +`
2. `Static Site`
3. GitHub repo 연결
4. Build Command:

```bash
npm ci && pip install -r requirements.txt && npm run build
```

5. Publish Directory:

```bash
out
```

## 주의

- 현재는 최근 거래일 스냅샷 몇 개만 미리 생성합니다.
- 더 많은 날짜가 필요하면 생성 개수를 늘리면 됩니다.
