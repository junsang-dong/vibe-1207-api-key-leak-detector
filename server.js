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

// JSON 파싱 미들웨어
app.use(express.json());

// API 엔드포인트 - analyze.js의 핸들러 사용
app.post('/api/analyze', async (req, res) => {
    try {
        // analyze.js의 핸들러 import
        const { handler } = require('./api/analyze.js');
        
        // Vercel Functions 형식의 req/res 객체 생성
        const vercelReq = {
            method: req.method,
            body: req.body,
            headers: req.headers
        };
        
        const vercelRes = {
            status: (code) => ({
                json: (data) => {
                    res.status(code).json(data);
                },
                end: () => {
                    res.status(code).end();
                }
            }),
            setHeader: (name, value) => {
                res.setHeader(name, value);
            }
        };

        // 핸들러 실행
        await handler(vercelReq, vercelRes);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
    }
});

// OPTIONS 요청 처리 (CORS preflight)
app.options('/api/analyze', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
});

// 모든 라우트를 index.html로 리다이렉트 (SPA 지원)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log(`📝 환경변수: .env.local 파일에서 OPENAI_API_KEY를 설정하세요.`);
});

