// ============================================
// API Key Leak Detector - 메인 로직
// ============================================

// DOM 요소 참조
const openaiKeyInput = document.getElementById('openai-key');
const githubUrlInput = document.getElementById('github-url');
const analyzeBtn = document.getElementById('analyze-btn');
const errorMessage = document.getElementById('error-message');
const loadingSection = document.getElementById('loading-section');
const resultsSection = document.getElementById('results-section');
const detectedKeysDiv = document.getElementById('detected-keys');
const riskAnalysisDiv = document.getElementById('risk-analysis');

// ============================================
// API 키 패턴 정규식 정의
// ============================================

const API_KEY_PATTERNS = {
    // AWS Access Key ID (AKIA로 시작하는 20자리)
    awsAccessKey: {
        pattern: /AKIA[0-9A-Z]{16}/g,
        name: 'AWS Access Key ID',
        type: 'aws'
    },
    // AWS Secret Access Key (40자리 base64 문자열)
    awsSecretKey: {
        pattern: /aws_secret_access_key\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi,
        name: 'AWS Secret Access Key',
        type: 'aws'
    },
    // GCP Service Account Key (JSON 형식)
    gcpKey: {
        pattern: /"type"\s*:\s*"service_account".*?"private_key"\s*:\s*"-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----"/g,
        name: 'GCP Service Account Key',
        type: 'gcp'
    },
    // OpenAI API Key (sk-로 시작하는 51자리)
    openaiKey: {
        pattern: /sk-[a-zA-Z0-9]{48}/g,
        name: 'OpenAI API Key',
        type: 'openai'
    },
    // GitHub Personal Access Token (ghp_로 시작)
    githubToken: {
        pattern: /ghp_[a-zA-Z0-9]{36}/g,
        name: 'GitHub Personal Access Token',
        type: 'github'
    },
    // Google API Key (AIza로 시작)
    googleApiKey: {
        pattern: /AIza[0-9A-Za-z_-]{35}/g,
        name: 'Google API Key',
        type: 'google'
    },
    // Stripe API Key (sk_live_ 또는 sk_test_로 시작)
    stripeKey: {
        pattern: /sk_(live|test)_[a-zA-Z0-9]{24,}/g,
        name: 'Stripe API Key',
        type: 'stripe'
    }
};

// ============================================
// GitHub Raw 파일 가져오기
// ============================================

/**
 * GitHub Raw 파일 URL에서 파일 내용을 가져옵니다
 * @param {string} url - GitHub Raw 파일 URL
 * @returns {Promise<string>} 파일 내용
 */
async function fetchGitHubFile(url) {
    try {
        // URL 유효성 검사
        if (!url || !url.includes('raw.githubusercontent.com')) {
            throw new Error('올바른 GitHub Raw 파일 URL을 입력해주세요.');
        }

        // GitHub Raw URL로 변환 (일반 GitHub URL인 경우)
        let rawUrl = url;
        if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
            rawUrl = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        // 파일 가져오기
        const response = await fetch(rawUrl);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('파일을 찾을 수 없습니다. URL을 확인해주세요.');
            } else if (response.status === 403) {
                throw new Error('파일에 접근할 수 없습니다. 공개 저장소인지 확인해주세요.');
            } else {
                throw new Error(`파일을 가져오는 중 오류가 발생했습니다. (상태 코드: ${response.status})`);
            }
        }

        const content = await response.text();
        return content;
    } catch (error) {
        if (error.message) {
            throw error;
        }
        throw new Error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    }
}

// ============================================
// API 키 탐지 함수
// ============================================

/**
 * 파일 내용에서 API 키 패턴을 탐지합니다
 * @param {string} content - 파일 내용
 * @returns {Array} 탐지된 키 정보 배열
 */
function detectApiKeys(content) {
    const detectedKeys = [];

    // 각 패턴에 대해 검사
    for (const [key, config] of Object.entries(API_KEY_PATTERNS)) {
        const matches = content.matchAll(config.pattern);
        
        for (const match of matches) {
            // 매칭된 키 값 추출 (첫 번째 캡처 그룹이 있으면 사용, 없으면 전체 매치 사용)
            const keyValue = match[1] || match[0];
            
            // 중복 제거를 위해 이미 추가된 키인지 확인
            const isDuplicate = detectedKeys.some(
                dk => dk.value === keyValue && dk.type === config.type
            );

            if (!isDuplicate) {
                detectedKeys.push({
                    type: config.type,
                    name: config.name,
                    value: keyValue,
                    // 보안을 위해 키의 일부만 표시 (처음 8자 + ... + 마지막 4자)
                    preview: keyValue.length > 20 
                        ? `${keyValue.substring(0, 8)}...${keyValue.substring(keyValue.length - 4)}`
                        : keyValue.substring(0, 12) + '...'
                });
            }
        }
    }

    return detectedKeys;
}

// ============================================
// LLM API 호출 함수 (클라이언트에서 직접 호출)
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

/**
 * OpenAI API를 직접 호출하여 위험도 분석을 수행합니다
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

/**
 * 탐지된 API 키에 대한 위험도 분석을 LLM에 요청합니다
 * @param {Array} detectedKeys - 탐지된 키 배열
 * @param {string} openaiApiKey - OpenAI API 키
 * @returns {Promise<Object>} 위험도 분석 결과
 */
async function analyzeRiskWithLLM(detectedKeys, openaiApiKey) {
    try {
        // LLM 프롬프트 구성
        const prompt = buildPrompt(detectedKeys);

        // OpenAI API 직접 호출
        const analysisResult = await callOpenAI(openaiApiKey, prompt);

        return analysisResult;
    } catch (error) {
        throw new Error(`LLM 분석 실패: ${error.message}`);
    }
}

// ============================================
// UI 업데이트 함수들
// ============================================

/**
 * 에러 메시지를 표시합니다
 * @param {string} message - 에러 메시지
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * 에러 메시지를 숨깁니다
 */
function hideError() {
    errorMessage.classList.add('hidden');
}

/**
 * 로딩 상태를 표시합니다
 */
function showLoading() {
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    analyzeBtn.disabled = true;
}

/**
 * 로딩 상태를 숨깁니다
 */
function hideLoading() {
    loadingSection.classList.add('hidden');
    analyzeBtn.disabled = false;
}

/**
 * 탐지된 키 목록을 화면에 표시합니다
 * @param {Array} detectedKeys - 탐지된 키 배열
 */
function renderDetectedKeys(detectedKeys) {
    if (detectedKeys.length === 0) {
        detectedKeysDiv.innerHTML = '<p style="color: #48bb78; font-weight: 600;">✅ API 키가 탐지되지 않았습니다. 안전합니다!</p>';
        return;
    }

    detectedKeysDiv.innerHTML = '<h3 style="margin-bottom: 15px; color: #2d3748;">탐지된 API 키</h3>';
    
    detectedKeys.forEach(key => {
        const keyItem = document.createElement('div');
        keyItem.className = 'key-item';
        keyItem.innerHTML = `
            <div class="key-type">${key.name}</div>
            <div class="key-preview">${key.preview}</div>
        `;
        detectedKeysDiv.appendChild(keyItem);
    });
}

/**
 * 위험도 분석 결과를 카드 형태로 표시합니다
 * @param {Object} analysis - 위험도 분석 결과
 */
function renderRiskAnalysis(analysis) {
    riskAnalysisDiv.innerHTML = '';

    // 위험도에 따른 CSS 클래스 결정
    const riskClass = `risk-${analysis.risk.toLowerCase()}`;
    const riskLabel = {
        'high': '🔴 높음',
        'medium': '🟡 중간',
        'low': '🟢 낮음'
    }[analysis.risk.toLowerCase()] || analysis.risk;

    // 위험도 카드 생성
    const card = document.createElement('div');
    card.className = `risk-card ${riskClass}`;
    card.innerHTML = `
        <h3>
            위험도 분석
            <span class="risk-badge">${riskLabel}</span>
        </h3>
        
        <section>
            <h4>위험 근거</h4>
            <ul>
                ${analysis.reasons.map(reason => `<li>${reason}</li>`).join('')}
            </ul>
        </section>
        
        <section>
            <h4>예상 사고 시나리오</h4>
            <ul>
                ${analysis.possible_incidents.map(incident => `<li>${incident}</li>`).join('')}
            </ul>
        </section>
        
        <section>
            <h4>대응 가이드</h4>
            <p>${analysis.advice}</p>
        </section>
    `;

    riskAnalysisDiv.appendChild(card);
    resultsSection.classList.remove('hidden');
}

// ============================================
// 메인 분석 함수
// ============================================

/**
 * 전체 분석 프로세스를 실행합니다
 */
async function performAnalysis() {
    // 초기화
    hideError();
    showLoading();
    detectedKeysDiv.innerHTML = '';
    riskAnalysisDiv.innerHTML = '';

    try {
        // 1. URL 가져오기
        const url = githubUrlInput.value.trim();
        if (!url) {
            throw new Error('GitHub URL을 입력해주세요.');
        }

        // 2. GitHub 파일 가져오기
        const fileContent = await fetchGitHubFile(url);

        // 3. API 키 탐지
        const detectedKeys = detectApiKeys(fileContent);

        // 4. 탐지된 키 표시
        renderDetectedKeys(detectedKeys);

        // 5. 키가 탐지된 경우에만 LLM 분석 수행
        if (detectedKeys.length > 0) {
            // OpenAI API 키 가져오기
            const openaiApiKey = openaiKeyInput.value.trim();
            if (!openaiApiKey) {
                throw new Error('LLM 분석을 위해 OpenAI API Key를 입력해주세요.');
            }
            
            // API 키 형식 검증 (sk-로 시작하는지 확인)
            if (!openaiApiKey.startsWith('sk-')) {
                throw new Error('올바른 OpenAI API Key 형식이 아닙니다. (sk-로 시작해야 합니다)');
            }

            const analysis = await analyzeRiskWithLLM(detectedKeys, openaiApiKey);
            renderRiskAnalysis(analysis);
        } else {
            // 키가 없으면 결과 섹션만 표시
            resultsSection.classList.remove('hidden');
        }

    } catch (error) {
        showError(error.message);
        resultsSection.classList.add('hidden');
    } finally {
        hideLoading();
    }
}

// ============================================
// 이벤트 리스너 등록
// ============================================

// 분석 버튼 클릭 이벤트
analyzeBtn.addEventListener('click', performAnalysis);

// Enter 키 입력 이벤트
githubUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performAnalysis();
    }
});

// 입력 시 에러 메시지 자동 숨김
githubUrlInput.addEventListener('input', () => {
    hideError();
});

openaiKeyInput.addEventListener('input', () => {
    hideError();
});

// Enter 키 입력 이벤트 (OpenAI Key 입력 필드)
openaiKeyInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performAnalysis();
    }
});

// ============================================
// 예시 링크 버튼 이벤트
// ============================================

/**
 * 예시 링크 버튼 클릭 시 URL을 입력 필드에 자동으로 채웁니다
 */
document.querySelectorAll('.example-link-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        if (url) {
            githubUrlInput.value = url;
            // 입력 필드로 포커스 이동
            githubUrlInput.focus();
            // 에러 메시지 숨기기
            hideError();
        }
    });
});

