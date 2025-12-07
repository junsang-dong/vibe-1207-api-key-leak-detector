// ============================================
// 로컬 개발 서버 (Express)
// ============================================

// 환경변수 로드 (.env.local 파일 자동 읽기)
require('dotenv').config({ path: '.env.local' });

const express = require('express');
const path = require('path');

const app = express();
const PORT = 5177;

// 정적 파일 서빙 (HTML, CSS, JS)
app.use(express.static(__dirname));

// API 엔드포인트는 더 이상 필요하지 않습니다
// 클라이언트에서 직접 OpenAI API를 호출합니다

// 모든 라우트를 index.html로 리다이렉트 (SPA 지원)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`📝 환경변수: .env.local 파일에서 OPENAI_API_KEY를 설정하세요.`);
});

