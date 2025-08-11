// www/js/services/apiService.js - YENİDEN DENEME MEKANİZMASI DÜZELTİLMİŞ NİHAİ VERSİYON

import {
    buildUnifiedSolutionPrompt,
    buildCorrectionPrompt,
    buildFlexibleStepValidationPrompt,
    buildVerificationPrompt,
    buildInputModerationPrompt
} from './promptBuilder.js';
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// --- Ayarlar ---
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1500;
const functions = getFunctions(undefined, 'europe-west1');
// Sunucu fonksiyonunu bir kez tanımla
const handleGeminiRequest = httpsCallable(functions, 'handleGeminiRequest');

// --- Yardımcı Fonksiyonlar (Değişiklik Yok) ---
function extractJson(text) {
    if (!text || typeof text !== 'string') return null;
    const jsonRegex = /```(json)?\s*(\{[\s\S]*\})\s*```/;
    const match = text.match(jsonRegex);
    if (match && match[2]) return match[2];
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        return text.substring(firstBrace, lastBrace + 1);
    }
    return null;
}

function safeJsonParse(jsonString) {
    if (!jsonString) return null;
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('JSON Parse Hatası:', error.message);
        return null;
    }
}

// --- AKILLI VEKİLİ ÇAĞIRAN MERKEZİ FONKSİYON (GÜÇLENDİRİLDİ) ---
async function callGeminiSmart(sessionType, initialPrompt, imageBase64, onProgress) {
    let lastError = null;
    let lastFaultyResponse = '';
    let currentPrompt = initialPrompt;
    let delay = INITIAL_DELAY;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 1 && onProgress) {
            const message = lastError && lastError.toLowerCase().includes('json')
                ? 'Yanıt formatı düzeltiliyor...'
                : `Geçici bir sorun oluştu. Yeniden denenecek...`;
            onProgress(message);
        }

        try {
            const payload = {
                prompt: currentPrompt,
                imageBase64: imageBase64,
                // Yeniden deneme ise (attempt > 1), sessionType'ı her zaman 'continue' yap (ücretsiz)
                sessionType: (attempt > 1) ? 'continue' : sessionType
            };

            const result = await handleGeminiRequest(payload);
            const rawText = result.data.responseText;

            if (!rawText) throw new Error('API yanıtı boş geldi.');

            lastFaultyResponse = rawText;
            const jsonString = extractJson(rawText);
            if (!jsonString) throw new Error('Yanıt içinde JSON formatı bulunamadı.');

            const parsedJson = safeJsonParse(jsonString);
            if (!parsedJson) throw new Error('JSON parse edilemedi (Syntax hatası).');

            console.log(`✅ API isteği Deneme #${attempt} başarılı!`);
            return parsedJson; // BAŞARILI! Fonksiyondan ve döngüden çık.

        } catch (error) {
            // Firebase'den gelen HttpsError'ları burada yakala ve kullanıcıya göster.
            // Bunlar yeniden denenecek hatalar değildir (örn: "resource-exhausted").
            if (error.code && error.code !== 'cancelled' && error.code !== 'deadline-exceeded') {
                console.error(`Firebase Fonksiyon Hatası (${error.code}): ${error.message}`);
                // Hata mesajını index.js'in yakalaması için yeniden fırlat.
                throw new Error(error.message); 
            }

            // Diğer hatalar (JSON, ağ hatası vb.) için yeniden deneme mantığına devam et.
            lastError = error.message || 'Bilinmeyen bir hata oluştu.';
            console.warn(`Deneme #${attempt} başarısız: ${lastError}`);

            if (attempt >= MAX_RETRIES) break; // Son deneme ise döngüyü kır.

            if (lastError.toLowerCase().includes('json')) {
                currentPrompt = buildCorrectionPrompt(initialPrompt, lastFaultyResponse, lastError);
                // JSON hatalarında bekleme, hemen yeniden dene.
                continue;
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }

    // Eğer döngü biterse ve hala bir sonuç yoksa, bu nihai başarısızlıktır.
    console.error("Tüm API denemeleri başarısız oldu. Son Hata:", lastError);
    // index.js'in yakalaması için son hatayı fırlat.
    throw new Error(`API ile iletişim kurulamadı: ${lastError}`);
}

// --- Dışa Aktarılan Fonksiyonlar (Değişiklik Yok) ---
// Bu fonksiyonlar artık yukarıdaki güçlendirilmiş callGeminiSmart'ı kullanacak.

export async function getUnifiedSolution(problemContext, imageBase64, onProgress) {
    if (onProgress) onProgress('Çözüm yolu oluşturuluyor...');
    const generationPrompt = buildUnifiedSolutionPrompt(problemContext);
    
    const initialSolution = await callGeminiSmart('start', generationPrompt, imageBase64, onProgress);
    if (!initialSolution) return null;

    const difficulty = initialSolution.problemOzeti?.zorlukSeviyesi;
    if (difficulty === 'zor') {
        if (onProgress) onProgress('Çözüm ek olarak kontrol ediliyor...');
        const verificationPrompt = buildVerificationPrompt(JSON.stringify(initialSolution, null, 2));
        const finalVerifiedSolution = await callGeminiSmart('continue', verificationPrompt, null, onProgress);
        return finalVerifiedSolution || initialSolution;
    }

    return initialSolution;
}

export async function validateStudentStep(studentInput, stepData, mistakeHistory) {
    const promptText = buildFlexibleStepValidationPrompt(studentInput, stepData, mistakeHistory);
    return await callGeminiSmart('continue', promptText, null, () => {});
}

export async function moderateUserInput(userInput) {
    const prompt = buildInputModerationPrompt(userInput);
    return await callGeminiSmart('continue', prompt, null, () => {});
}