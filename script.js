const form = document.getElementById('promptForm');
const loading = document.getElementById('loading');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const generateBtn = document.getElementById('generateBtn');
const apiKeySelect = document.getElementById('apiKeySelect');
const customApiGroup = document.getElementById('customApiGroup');
const apiKey = document.getElementById('apiKey');
const apiStatus = document.getElementById('apiStatus');

// Handle API key selection
apiKeySelect.addEventListener('change', function() {
    if (this.value === 'custom') {
        customApiGroup.style.display = 'block';
        apiStatus.innerHTML = '<small style="color: #856404;">⚠️ Vui lòng nhập API Key riêng của bạn</small>';
        apiStatus.className = 'api-status api-warning';
    } else if (this.value === '') {
        customApiGroup.style.display = 'none';
        apiStatus.innerHTML = '<small style="color: #721c24;">❌ Vui lòng chọn API Key</small>';
        apiStatus.className = 'api-status api-error';
    } else {
        customApiGroup.style.display = 'none';
        apiStatus.innerHTML = '<small style="color: #28a745;">✅ Sử dụng API Key demo - Có thể bị giới hạn request</small>';
        apiStatus.className = 'api-status';
    }
});

function getSelectedApiKey() {
    if (apiKeySelect.value === 'custom') {
        return apiKey.value.trim();
    } else {
        return apiKeySelect.value;
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const selectedApiKey = getSelectedApiKey();
    if (!selectedApiKey) {
        alert('Vui lòng chọn hoặc nhập API Key Gemini!');
        return;
    }

    const formData = {
        targetAudience: document.getElementById('targetAudience').value.trim(),
        videoDuration: document.getElementById('videoDuration').value,
        productName: document.getElementById('productName').value.trim(),
        customerProblem: document.getElementById('customerProblem').value.trim(),
        productBenefits: document.getElementById('productBenefits').value.trim(),
        voiceTone: document.getElementById('voiceTone').value,
        outputLanguage: document.getElementById('outputLanguage').value
    };

    // Validate form
    const requiredFields = Object.keys(formData);
    for (let field of requiredFields) {
        if (!formData[field]) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }
    }

    generateBtn.disabled = true;
    loading.style.display = 'block';
    resultSection.style.display = 'none';

    try {
        const prompt = createPrompt(formData);
        const result = await callGeminiAPI(selectedApiKey, prompt);
        
        resultContent.textContent = result;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error:', error);
        showError('Có lỗi xảy ra: ' + error.message);
    } finally {
        loading.style.display = 'none';
        generateBtn.disabled = false;
    }
});

function createPrompt(data) {
    const languageInstruction = data.outputLanguage === 'vietnamese' 
        ? 'Bạn phải trả lời HOÀN TOÀN bằng tiếng Việt, bao gồm cả prompt và tất cả nội dung.'
        : 'You must respond in English, but keep Vietnamese product names if provided.';

    return `${languageInstruction}

Bạn là một chuyên gia sáng tạo nội dung quảng cáo. Hãy tạo một prompt video quảng cáo chi tiết dựa trên thông tin sau:

- Đối tượng khách hàng: ${data.targetAudience}
- Thời lượng video: ${data.videoDuration} giây
- Tên sản phẩm/dịch vụ: ${data.productName}
- Vấn đề khách hàng: ${data.customerProblem}
- Lợi ích sản phẩm: ${data.productBenefits}
- Tông giọng voice: ${data.voiceTone}

Hãy tạo ra:
1. **Prompt tạo video AI hoàn chỉnh** - chia thành từng cảnh cụ thể với thời gian
2. **Script lời thoại** phù hợp với tông giọng yêu cầu
3. **Mô tả visual** cho từng cảnh

Format như sau:
👉 **Prompt tạo video AI:**
[Mô tả tổng quan]
- Cảnh 1 (Xs): [Mô tả chi tiết]
- Cảnh 2 (Xs): [Mô tả chi tiết]  
- Cảnh 3 (Xs): [Mô tả chi tiết]

**Voice ${data.voiceTone}:** "[Script lời thoại hoàn chỉnh]"

Hãy làm cho prompt này thật chi tiết và có thể sử dụng được cho các AI tạo video như Runway, Sora, Google Veo.`;
}

async function callGeminiAPI(apiKey, prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
    
    const requestBody = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }],
        generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Không nhận được phản hồi hợp lệ từ API');
    }

    return data.candidates[0].content.parts[0].text;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error');
    existingErrors.forEach(error => error.remove());
    
    // Add new error message
    loading.parentNode.insertBefore(errorDiv, loading.nextSibling);
}

function copyResult() {
    const text = resultContent.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const copyBtn = event.target;
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Đã sao chép!';
        copyBtn.style.background = '#28a745';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '#28a745';
        }, 2000);
    }).catch(err => {
        console.error('Không thể sao chép:', err);
        alert('Không thể sao chép. Vui lòng copy thủ công.');
    });
}

// Auto-save API key selection
const savedApiSelection = localStorage.getItem('gemini_api_selection');
const savedCustomApiKey = localStorage.getItem('gemini_custom_api_key');

if (savedApiSelection) {
    apiKeySelect.value = savedApiSelection;
    if (savedApiSelection === 'custom' && savedCustomApiKey) {
        apiKey.value = savedCustomApiKey;
        customApiGroup.style.display = 'block';
        apiStatus.innerHTML = '<small style="color: #856404;">⚠️ Sử dụng API Key riêng đã lưu</small>';
        apiStatus.className = 'api-status api-warning';
    } else if (savedApiSelection !== '' && savedApiSelection !== 'custom') {
        apiStatus.innerHTML = '<small style="color: #28a745;">✅ Sử dụng API Key demo - Có thể bị giới hạn request</small>';
        apiStatus.className = 'api-status';
    }
}

// Save API selection when changed
apiKeySelect.addEventListener('change', () => {
    localStorage.setItem('gemini_api_selection', apiKeySelect.value);
});

// Save custom API key when changed
apiKey.addEventListener('change', () => {
    if (apiKey.value.trim()) {
        localStorage.setItem('gemini_custom_api_key', apiKey.value.trim());
    }
});