# 🔐 API Key Leak Detector

GitHub 파일에서 API 키 유출을 탐지하고 위험도를 분석하는 웹 애플리케이션입니다.

## 📋 기능

- **GitHub Raw 파일 분석**: GitHub 저장소의 파일을 가져와 API 키 패턴을 탐지
- **다양한 API 키 탐지**: AWS, GCP, OpenAI, GitHub, Google, Stripe 등 주요 서비스의 API 키 패턴 지원
- **LLM 기반 위험도 분석**: 탐지된 키의 위험도를 분석하고 구체적인 사고 시나리오 제공
- **직관적인 UI**: 위험도별 색상 구분 및 카드 형태의 결과 표시

## 🚀 시작하기

### 1. 프로젝트 클론

```bash
git clone <repository-url>
cd vibe-1207-api-key-leak-detector
```

### 2. Vercel 배포

1. [Vercel](https://vercel.com)에 프로젝트를 연결합니다
2. 환경변수를 설정합니다 (아래 참조)
3. 배포합니다

### 3. 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 설정하세요:

```
OPENAI_API_KEY=your_openai_api_key_here
```

**설정 방법:**
1. Vercel 프로젝트 대시보드 접속
2. Settings → Environment Variables 메뉴
3. `OPENAI_API_KEY` 추가 (Production, Preview, Development 모두 선택)

## 📁 프로젝트 구조

```
vibe-1207-api-key-leak-detector/
├── index.html          # 메인 HTML 파일
├── style.css           # 스타일시트
├── main.js             # 클라이언트 사이드 로직
├── api/
│   └── analyze.js      # Vercel Functions 엔드포인트
└── README.md           # 프로젝트 문서
```

## 🔍 탐지 가능한 API 키 타입

- **AWS Access Key ID**: `AKIA`로 시작하는 20자리 키
- **AWS Secret Access Key**: 40자리 base64 문자열
- **GCP Service Account Key**: JSON 형식의 서비스 계정 키
- **OpenAI API Key**: `sk-`로 시작하는 51자리 키
- **GitHub Personal Access Token**: `ghp_`로 시작하는 토큰
- **Google API Key**: `AIza`로 시작하는 키
- **Stripe API Key**: `sk_live_` 또는 `sk_test_`로 시작하는 키

## 💻 사용 방법

1. 웹 애플리케이션에 접속
2. GitHub Raw 파일 URL 입력 (예: `https://raw.githubusercontent.com/user/repo/branch/file.js`)
3. "분석하기" 버튼 클릭
4. 탐지된 키와 위험도 분석 결과 확인

## ⚠️ 주의사항

- **공개 저장소만 지원**: 현재는 인증 토큰 없이 접근 가능한 공개 저장소만 분석 가능합니다
- **API 키 보안**: OpenAI API 키는 절대 클라이언트 코드에 포함하지 마세요. 반드시 Vercel 환경변수로 관리하세요
- **탐지 정확도**: 정규식 기반 탐지이므로 일부 false positive가 발생할 수 있습니다

## 🛠️ 기술 스택

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Backend**: Vercel Serverless Functions
- **LLM**: OpenAI GPT-4o-mini
- **배포**: Vercel

## 📝 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

