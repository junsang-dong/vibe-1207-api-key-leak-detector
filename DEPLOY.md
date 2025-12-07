# 🚀 Vercel 배포 가이드

이 문서는 API Key Leak Detector를 Vercel에 배포하는 방법을 설명합니다.

## 📋 사전 준비

1. GitHub 계정에 리포지토리가 업로드되어 있어야 합니다
2. Vercel 계정이 필요합니다 ([vercel.com](https://vercel.com)에서 무료 가입 가능)
3. OpenAI API Key가 필요합니다 (선택사항 - 사용자가 웹 UI에서 직접 입력 가능)

## 🔧 배포 단계

### 1단계: Vercel 프로젝트 생성

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. "Add New Project" 버튼 클릭
3. GitHub 리포지토리 `junsang-dong/vibe-1207-api-key-leak-detector` 선택
4. "Import" 클릭

### 2단계: 프로젝트 설정

Vercel이 자동으로 프로젝트를 감지하지만, 다음 설정을 확인하세요:

- **Framework Preset**: Other
- **Root Directory**: `./` (기본값)
- **Build Command**: (비워두기 - 빌드 불필요)
- **Output Directory**: `./` (기본값)
- **Install Command**: `npm install` (자동 감지됨)

### 3단계: 환경변수 설정 (선택사항)

**중요**: 환경변수는 선택사항입니다. 사용자가 웹 UI에서 직접 OpenAI API Key를 입력할 수 있습니다.

환경변수를 설정하려면:

1. "Environment Variables" 섹션으로 이동
2. 다음 변수 추가:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-your-openai-api-key-here`
   - **Environment**: Production, Preview, Development 모두 선택
3. "Save" 클릭

### 4단계: 배포 실행

1. "Deploy" 버튼 클릭
2. 배포가 완료될 때까지 대기 (약 1-2분)
3. 배포 완료 후 제공되는 URL로 접속

## 🌐 배포 후 확인

배포가 완료되면:

1. Vercel이 자동으로 프로덕션 URL을 생성합니다 (예: `https://vibe-1207-api-key-leak-detector.vercel.app`)
2. 브라우저에서 해당 URL로 접속하여 웹앱이 정상 작동하는지 확인
3. GitHub에 푸시할 때마다 자동으로 재배포됩니다 (자동 배포 활성화)

## 🔄 자동 배포 설정

Vercel은 기본적으로 GitHub와 연동되어:
- `main` 브랜치에 푸시하면 프로덕션 배포
- 다른 브랜치에 푸시하면 Preview 배포

이 기능은 자동으로 활성화되어 있습니다.

## 🛠️ 문제 해결

### 배포 실패 시

1. **빌드 로그 확인**: Vercel 대시보드의 "Deployments" 탭에서 로그 확인
2. **환경변수 확인**: 환경변수가 올바르게 설정되었는지 확인
3. **파일 구조 확인**: `api/analyze.js` 파일이 올바른 위치에 있는지 확인

### API 엔드포인트 오류 시

- `/api/analyze` 엔드포인트가 404 오류를 반환하는 경우:
  - `vercel.json` 파일이 올바른지 확인
  - Vercel Functions 런타임이 올바르게 설정되었는지 확인

### 환경변수 관련

- 환경변수를 설정하지 않아도 사용자가 웹 UI에서 직접 API Key를 입력하면 작동합니다
- 환경변수는 fallback으로 사용됩니다

## 📝 추가 설정

### 커스텀 도메인 연결

1. Vercel 프로젝트 설정 → Domains
2. 원하는 도메인 입력
3. DNS 설정 안내에 따라 DNS 레코드 추가

## 🔗 유용한 링크

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vercel Functions 문서](https://vercel.com/docs/functions)
- [GitHub 리포지토리](https://github.com/junsang-dong/vibe-1207-api-key-leak-detector)

