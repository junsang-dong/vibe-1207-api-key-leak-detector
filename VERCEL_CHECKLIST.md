# ✅ Vercel 배포 체크리스트

## 📋 배포 전 확인사항

### 1. 파일 구조 확인 ✅
- [x] `index.html` - 메인 HTML 파일
- [x] `style.css` - 스타일시트
- [x] `main.js` - 클라이언트 로직
- [x] `api/analyze.js` - Vercel Functions 엔드포인트
- [x] `vercel.json` - Vercel 설정 파일
- [x] `package.json` - 프로젝트 의존성
- [x] `.gitignore` - Git 제외 파일 설정

### 2. Vercel 설정 확인 ✅
- [x] `vercel.json` 파일 존재
- [x] API Functions 경로 설정 (`/api/analyze`)
- [x] Node.js 런타임 설정 (nodejs18.x)

### 3. GitHub 리포지토리 확인 ✅
- [x] 모든 소스코드 커밋 및 푸시 완료
- [x] 리포지토리: `junsang-dong/vibe-1207-api-key-leak-detector`
- [x] 브랜치: `main`

### 4. 환경변수 설정 (선택사항)
- [ ] `OPENAI_API_KEY` - Vercel 대시보드에서 설정
  - 참고: 사용자가 웹 UI에서 직접 입력할 수도 있음

## 🚀 배포 단계

### Step 1: Vercel 프로젝트 생성
1. [Vercel 대시보드](https://vercel.com/dashboard) 접속
2. "Add New Project" 클릭
3. GitHub 리포지토리 `junsang-dong/vibe-1207-api-key-leak-detector` 선택
4. "Import" 클릭

### Step 2: 프로젝트 설정
- **Framework Preset**: Other
- **Root Directory**: `./` (기본값)
- **Build Command**: (비워두기)
- **Output Directory**: `./` (기본값)
- **Install Command**: `npm install` (자동 감지)

### Step 3: 환경변수 설정 (선택사항)
1. "Environment Variables" 섹션으로 이동
2. 변수 추가:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-your-openai-api-key-here`
   - **Environment**: Production, Preview, Development 모두 선택
3. "Save" 클릭

### Step 4: 배포 실행
1. "Deploy" 버튼 클릭
2. 배포 완료 대기 (약 1-2분)
3. 배포 완료 후 URL 확인

## 🌐 배포 후 확인사항

- [ ] 웹앱이 정상적으로 로드되는지 확인
- [ ] `/api/analyze` 엔드포인트가 작동하는지 확인
- [ ] GitHub Raw 파일 URL 입력 테스트
- [ ] API 키 탐지 기능 테스트
- [ ] LLM 분석 기능 테스트 (OpenAI API Key 입력)

## 🔗 유용한 링크

- **GitHub 리포지토리**: https://github.com/junsang-dong/vibe-1207-api-key-leak-detector
- **Vercel 대시보드**: https://vercel.com/dashboard
- **상세 배포 가이드**: `DEPLOY.md` 파일 참조

## 📝 참고사항

- 환경변수는 선택사항입니다. 사용자가 웹 UI에서 직접 OpenAI API Key를 입력할 수 있습니다.
- GitHub에 푸시할 때마다 자동으로 재배포됩니다.
- 프로덕션 URL은 자동으로 생성됩니다 (예: `https://vibe-1207-api-key-leak-detector.vercel.app`).

