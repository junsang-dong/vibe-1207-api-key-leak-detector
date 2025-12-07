// ============================================
// Vercel Functions - LLM 위험도 분석 API
// ============================================

/**
 * Vercel Serverless Function
 * 탐지된 API 키에 대한 위험도 분석을 LLM에 요청합니다
 */

// CommonJS와 ES6 모듈 모두 지원
async function handler(req, res) {
    // CORS 헤더 설정 (로컬 개발 환경 지원)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // OPTIONS 요청 처리 (CORS preflight)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // POST 요청만 허용
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { detectedKeys, openaiApiKey: requestApiKey } = req.body;

        // 입력 검증
        if (!detectedKeys || !Array.isArray(detectedKeys) || detectedKeys.length === 0) {
            return res.status(400).json({ error: '탐지된 키 정보가 필요합니다.' });
        }

        // OpenAI API 키 가져오기 (요청 body 우선, 없으면 환경변수 사용)
        const openaiApiKey = requestApiKey || process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            return res.status(400).json({ 
                error: 'OpenAI API Key가 필요합니다. 입력 필드에 API Key를 입력하거나 서버 환경변수를 설정해주세요.' 
            });
        }

        // API 키 형식 검증
        if (!openaiApiKey.startsWith('sk-')) {
            return res.status(400).json({ 
                error: '올바른 OpenAI API Key 형식이 아닙니다.' 
            });
        }

        // LLM 프롬프트 구성
        const prompt = buildPrompt(detectedKeys);

        // OpenAI API 호출
        const analysisResult = await callOpenAI(openaiApiKey, prompt);

        // 응답 반환
        return res.status(200).json(analysisResult);

    } catch (error) {
        console.error('Analysis error:', error);
        return res.status(500).json({ 
            error: error.message || '위험도 분석 중 오류가 발생했습니다.' 
        });
    }
}

// ============================================
// 프롬프트 구성 함수
// ============================================

/**
 * 탐지된 키 정보를 바탕으로 LLM 프롬프트를 생성합니다
 * @param {Array} detectedKeys - 탐지된 키 배열
 * @returns {string} LLM 프롬프트
 */
function buildPrompt(detectedKeys) {
    // 탐지된 키 타입 목록 생성
    const keyTypes = detectedKeys.map(k => k.name).join(', ');

    return `당신은 보안 전문가입니다. 다음 정보를 바탕으로 API 키 유출의 위험도를 분석해주세요.

탐지된 API 키 타입: ${keyTypes}

다음 JSON 형식으로 응답해주세요. 한국어로 작성해주세요.

{
  "risk": "High | Medium | Low",
  "reasons": ["위험 근거1", "위험 근거2", "위험 근거3"],
  "possible_incidents": ["예상 사고 시나리오1", "예상 사고 시나리오2", "예상 사고 시나리오3"],
  "advice": "대응 가이드 (구체적인 조치 방법 포함)"
}

분석 시 다음 사항을 반드시 고려해주세요:

1. **클라우드 비용 폭증**: 
   - AWS/GCP 키 유출 시 악의적 사용자가 대량의 리소스를 생성하여 비용 폭증 가능
   - 한국 실무에서 자주 발생하는 문제: EC2 인스턴스 대량 생성, S3 스토리지 무제한 업로드

2. **OpenAI Key 악용**:
   - OpenAI API 키 유출 시 무료 크레딧이나 유료 계정의 크레딧을 악의적으로 소진
   - 대량의 API 호출로 인한 비용 폭증 및 서비스 제한

3. **스토리지 무단 접근**:
   - S3, GCS 등 클라우드 스토리지에 저장된 민감 정보 유출
   - 데이터베이스 백업 파일, 개인정보, 기업 기밀 문서 등 접근 가능

4. **위험도 판단 기준**:
   - High: 프로덕션 환경 키, 전체 권한 키, 금융/의료 등 민감 산업
   - Medium: 개발 환경 키, 제한적 권한 키
   - Low: 테스트용 키, 읽기 전용 권한 키

위험 근거와 예상 사고는 구체적이고 실무적인 내용으로 작성해주세요.`;
}

// Vercel Functions는 기본적으로 CommonJS 형식을 사용합니다
// handler를 기본 export로 설정
module.exports = handler;

// ============================================
// OpenAI API 호출 함수
// ============================================

/**
 * OpenAI API를 호출하여 위험도 분석을 수행합니다
 * @param {string} apiKey - OpenAI API 키
 * @param {string} prompt - 프롬프트
 * @returns {Promise<Object>} 분석 결과
 */
async function callOpenAI(apiKey, prompt) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // 비용 효율적인 모델 사용
                messages: [
                    {
                        role: 'system',
                        content: '당신은 보안 전문가입니다. API 키 유출 위험도를 분석하고 JSON 형식으로 응답합니다.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' } // JSON 형식 강제
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'OpenAI API 호출 실패');
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('LLM 응답이 비어있습니다.');
        }

        // JSON 파싱
        const analysisResult = JSON.parse(content);

        // 응답 형식 검증
        if (!analysisResult.risk || !analysisResult.reasons || !analysisResult.possible_incidents || !analysisResult.advice) {
            throw new Error('LLM 응답 형식이 올바르지 않습니다.');
        }

        return analysisResult;

    } catch (error) {
        // JSON 파싱 오류 처리
        if (error instanceof SyntaxError) {
            throw new Error('LLM 응답을 파싱할 수 없습니다.');
        }
        throw error;
    }
}

