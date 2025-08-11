/**
 * Zengin, birleşik bir çözüm nesnesi istemek için tek, kapsamlı bir prompt oluşturur.
 * Bu prompt, özet, adım adım çözüm, interaktif seçenekler ve doğrulama bilgilerini tek seferde alır.
 *
 * @param {string} problemContext Kullanıcının girdiği orijinal problem metni.
 * @returns {string} Gemini API'ye gönderilecek olan birleşik prompt.
 */
export function buildUnifiedSolutionPrompt(problemContext) {

    const cleanProblemContext = (problemContext || "").trim();

    // Problem metninin geçerli olup olmadığını kontrol edelim.
    if (cleanProblemContext.length < 3) {
        return `
            SADECE aşağıdaki JSON'u döndür, başka hiçbir şey ekleme:
            {
              "problemOzeti": { "verilenler": ["Geçerli bir soru girilmedi."], "istenen": "Lütfen metin kutusuna çözmek istediğiniz soruyu yazın veya fotoğrafını yükleyin.", "konu": "Hata", "zorlukSeviyesi": "kolay" },
              "adimlar": [],
              "tamCozumLateks": ["\\\\text{Soru bulunamadı.}"],
              "sonucKontrolu": "Geçerli bir soru girilmediği için kontrol yapılamaz.",
              "_error": "INVALID_INPUT_ERROR",
              "_fallback": true
            }
        `;
    }
    
    return `
        Sen, öğrencilere matematiği sevdiren, sabırlı ve öğretici bir matematik öğretmenisin. Amacın öğrenciye sadece cevabı vermek değil, her adımı ANLAMASINI sağlamaktır.

        **KRİTİK TALİMAT:**
        1. SADECE geçerli JSON formatında yanıt ver
        2. JSON'dan önce veya sonra ASLA açıklama yazma
        3. Yanıtın {"problemOzeti": ile başlamalı ve } ile bitmeli

        **MATEMATİK PROBLEMİ TESPİT KURALLARI:**
        
        Aşağıdaki metin bir matematik problemi DEĞİLDİR ve HATA JSON'u döndürülmelidir:
        - Matematikle ilgisi olmayan sorular ("nasılsın", "merhaba", "test")
        - Tanımsız veya belirsiz ifadeler ("10 kuş kaç eder", "5 elma")
        - Matematiksel işlem içermeyen genel sorular
        - Sadece sayıların listelendiği ama soru sorulmayan metinler
        - Eksik veya tamamlanmamış ifadeler
        
        Aşağıdaki metin bir matematik problemiDİR ve çözülmelidir:
        - Denklemler: "2x + 5 = 15", "x² - 4x + 3 = 0"
        - Aritmetik işlemler: "15 + 27", "125 ÷ 5", "3 × 8 - 12"
        - Kesir işlemleri: "2/3 + 1/4", "5/6 × 3/10"
        - Yüzde hesaplamaları: "%20'si 50 olan sayı", "120'nin %15'i"
        - Kelime problemleri: "Ali'nin 20 TL'si var, 8 TL harcadı. Kaç TL'si kaldı?"
        - Geometri: "Kenarı 5 cm olan karenin alanı"
        - Oran-orantı: "3 işçi 6 günde bitiriyorsa, 2 işçi kaç günde bitirir?"

        Problem: "${cleanProblemContext}"

        **KARAR VER:**
        Yukarıdaki metin matematik problemi DEĞİLSE, bu JSON'u döndür:
        {
          "problemOzeti": { 
            "verilenler": ["Matematik sorusu tespit edilemedi."], 
            "istenen": "Lütfen çözmek istediğiniz matematik sorusunu yazın. Örnek: 2x + 5 = 15 veya 25 + 17 = ?", 
            "konu": "Hata", 
            "zorlukSeviyesi": "belirsiz" 
          },
          "adimlar": [],
          "tamCozumLateks": ["\\\\text{Çözüm yapılamadı}"],
          "sonucKontrolu": "Matematik sorusu olmadığı için kontrol yapılamaz.",
          "_error": "NOT_MATH_PROBLEM",
          "_fallback": true
        }

        **EĞER MATEMATİK PROBLEMİYSE, aşağıdaki ÖĞRETİCİ YAKLAŞIMLA çöz:**

        {
          "problemOzeti": {
            "verilenler": ["Problem içindeki verilen bilgiler - öğrencinin anlayacağı dilde"],
            "istenen": "Ne bulmamız gerektiğinin açık ifadesi",
            "konu": "Aritmetik|Cebir|Geometri|Kesirler|Yüzdeler|Denklemler",
            "zorlukSeviyesi": "kolay|orta|zor"
          },
          "adimlar": [
            {
              "adimNo": 1,
              "adimBasligi": "Bu adımda ne yapacağımızın kısa özeti",
              "adimAciklamasi": "ÖĞRETİCİ AÇIKLAMA: Bu adımı NEDEN yapıyoruz? Hangi matematik kuralını kullanıyoruz? Öğrenci bu adımı nasıl kendi başına yapabilir? Matematiksel ifadeler $...$ içinde.",
              "cozum_lateks": "Bu adımın matematiksel gösterimi ($ işareti olmadan)",
              "odak_alan_lateks": "Önceki adımdan değişecek kısım veya null",
              "ipucu": "Öğrenci takılırsa verilecek YÖNLENDİRİCİ ipucu. Cevabı verme, düşündür!",
              "yanlisSecenekler": [
                {
                  "metin_lateks": "Öğrencilerin sıkça yaptığı gerçek bir hata ($ olmadan)",
                  "hataAciklamasi": "Bu hatanın neden yapıldığı ve doğrusunun nasıl bulunacağının ÖĞRETİCİ açıklaması."
                },
                {
                  "metin_lateks": "Başka bir yaygın hata ($ olmadan)",
                  "hataAciklamasi": "Bu hatadan nasıl kaçınılacağının ÖĞRETİCİ açıklaması."
                }
              ]
            }
          ],
          "tamCozumLateks": [
            "Problem metni veya ilk durum",
            "Her adımın sonucu sırayla",
            "Final cevap (en sade hali)"
          ],
          "sonucKontrolu": "Öğrenciye sonucun doğruluğunu NASIL kontrol edeceğini öğreten açıklama. Matematiksel ifadeler $...$ içinde."
        }

        **ÖĞRETİCİ ÇÖZÜM KURALLARI:**

        1. **ADIM SAYISI - ÖĞRETİCİ YAKLAŞIM:**
           - Çok basit işlemler (5+3): En az 2 adım (işlemi tanımlama + hesaplama)
           - Basit denklemler (x+5=10): 3-4 adım (her işlemi ayrı göster)
           - Karmaşık problemler: 4-7 adım (öğrenci kaybolmasın)
           - HER ADIM BİR ŞEY ÖĞRETMELİ!

        2. **ADIM AÇIKLAMALARI - MUTLAKA OLACAKLAR:**
           - Bu adımda hangi matematik kuralını kullanıyoruz?
           - Neden bu işlemi yapıyoruz?
           - Bu adımı atlarsak ne olur?
           - Öğrenci bu adımı nasıl kontrol edebilir?
           Örnek: "Bu adımda eşitliğin her iki tarafından 5 çıkarıyoruz. Çünkü $x$'i yalnız bırakmak istiyoruz. Unutma: Eşitliğin bir tarafına ne yaparsak, diğer tarafına da aynısını yapmalıyız!"

        3. **İPUÇLARI - YÖNLENDİRİCİ OLMALI:**
           KÖTÜ İpucu: "Cevap 5'tir"
           İYİ İpucu: "Eşitliğin sol tarafında $x$'i yalnız bırakmak için ne yapmalısın?"
           MÜKEMMEL İpucu: "Dikkat et, $+10$ ifadesini karşıya geçirirken işaretini değiştirmeyi unutma! Artı işareti karşıya nasıl geçer?"

        4. **YANLIŞ SEÇENEKLER - ÖĞRETİCİ HATALAR:**
           Her yanlış seçenek, öğrencilerin GERÇEKTEN yaptığı hatalar olmalı:
           - İşaret hatası: "+10 karşıya +10 olarak geçti" → Açıklama: "İşaret değiştirmeyi unuttun!"
           - İşlem sırası: "Önce toplama yaptı" → Açıklama: "Matematikte önce çarpma/bölme yapılır!"
           - Sadeleştirme hatası: "6/8 = 6/4" → Açıklama: "Pay ve paydayı aynı sayıyla bölmelisin!"
           
        5. **SON ADIM - EN SADE HAL:**
           - MUTLAKA sadeleştirilmiş olmalı
           - x = 10/2 değil → x = 5 olmalı
           - Kesirler en sade halinde: 6/8 değil → 3/4 olmalı

        6. **SONUÇ KONTROLÜ - ÖĞRETİCİ:**
           Sadece "doğru" deme, NASIL kontrol edeceğini öğret:
           "Bulduğumuz $x = 5$ değerini başlangıç denkleminde yerine koyalım: $2(5) + 10 = 20$ ✓ Sol taraf 20, sağ taraf da 20. Demek ki cevabımız doğru!"

        **LATEX FORMATLAMA - KESİNLİKLE UYULACAK:**
        
        ALAN TİPİ 1 - Açıklama metinleri (adimAciklamasi, ipucu, hataAciklamasi, sonucKontrolu):
        ✅ DOĞRU: "Denklemi çözmek için $x + 5 = 10$ ifadesinden başlıyoruz"
        ❌ YANLIŞ: "Denklemi çözmek için x + 5 = 10 ifadesinden başlıyoruz"
        
        ALAN TİPİ 2 - Saf LaTeX (cozum_lateks, metin_lateks, tamCozumLateks):
        ✅ DOĞRU: x + 5 = 10
        ❌ YANLIŞ: $x + 5 = 10$

        **ÖRNEKLER - ÖĞRETİCİ YAKLAŞIM:**
        
        Problem: "15 + 27"
        ADIM 1: 
        - adimBasligi: "Toplama İşlemini Hazırlama"
        - adimAciklamasi: "İki sayıyı toplarken, basamak değerlerine dikkat etmeliyiz. $15 + 27$ işleminde önce birlikleri ($5 + 7$), sonra onlukları toplayacağız."
        - cozum_lateks: "15 + 27 = ?"
        
        ADIM 2:
        - adimBasligi: "Basamak Basamak Toplama"
        - adimAciklamasi: "Birlikler: $5 + 7 = 12$ (1 onluk elde var). Onluklar: $1 + 2 + 1 = 4$. Sonuç: $42$"
        - cozum_lateks: "15 + 27 = 42"

        **ÖNEMLİ:**
        - Her adım öğrenciye BİR ŞEY ÖĞRETMELI
        - Açıklamalar sade ve anlaşılır olmalı
        - Öğrenciyi düşündürecek ipuçları vermeli
        - Yaygın hataları gösterip düzeltmeli
        - SADECE JSON döndür, başka hiçbir şey ekleme
    `;
}
/**
 * API yanıtının hatalı JSON formatı nedeniyle başarısız olması durumunda,
 * API'ye hatayı düzelterek yeniden denemesi için bir prompt oluşturur.
 *
 * @param {string} originalPrompt Başarısız olan ilk istekteki prompt.
 * @param {string} faultyResponse API'den gelen hatalı yanıt metni.
 * @param {string} errorMessage JSON parse hatasının detayı.
 * @returns {string} Gemini API'ye gönderilecek olan düzeltme prompt'u.
 */
export function buildCorrectionPrompt(originalPrompt, faultyResponse, errorMessage) {
    return `
        **KRİTİK TALİMAT: SADECE GEÇERLİ JSON DÖNDÜR, BAŞKA HİÇBİR ŞEY EKLEME!**

        Önceki yanıtında JSON format hatası tespit edildi. Bu hatayı düzelt ve SADECE geçerli JSON döndür.

        **TESPİT EDİLEN HATA:**
        ${errorMessage}

        **HATALI YANITIN İLK 300 KARAKTERİ:**
        ${faultyResponse.substring(0, 300)}...

        **JSON DÜZELTME KURALLARI:**
        1. ASLA JSON'dan önce veya sonra açıklama yazma
        2. Yanıt { ile başlamalı ve } ile bitmeli
        3. Tüm string değerler çift tırnak (") içinde olmalı
        4. Dizilerin ve nesnelerin son elemanından sonra virgül olmamalı
        5. LaTeX'teki ters eğik çizgiler için çift kaçış karakteri kullan (\\\\)
        6. Özel karakterler doğru kaçış karakterleriyle yazılmalı:
           - Tırnak işareti: \\"
           - Yeni satır: \\n
           - Tab: \\t

        **LATEX FORMATLAMA - ÇOK ÖNEMLİ:**
        - adimAciklamasi, ipucu, hataAciklamasi, sonucKontrolu → İçindeki matematik $...$ içinde
        - cozum_lateks, metin_lateks, tamCozumLateks → ASLA $ işareti kullanma
        - Yanlış: \\(...\\) veya \\[...\\] → Bunları kullanma
        - Doğru metin içi: $x^2 + 5 = 10$
        - Doğru saf LaTeX: x^2 + 5 = 10

        **ORİJİNAL İSTEK:**
        ${originalPrompt}

        **ŞİMDİ SADECE DÜZELTİLMİŞ JSON'U DÖNDÜR:**
    `;
}

/**
 * Bir metnin matematik sorusu olup olmadığını doğrulamak için bir prompt oluşturur.
 *
 * @param {string} problemContext Kullanıcının girdiği metin.
 * @returns {string} Gemini API'ye gönderilecek olan doğrulama prompt'u.
 */
export function buildMathValidationPrompt(problemContext) {
    return `
        **TALİMAT: SADECE JSON FORMATINDA YANIT VER**

        Aşağıdaki metni analiz et ve matematik sorusu olup olmadığını belirle.

        **ANALİZ EDİLECEK METİN:**
        "${problemContext}"

        **MATEMATİK SORUSU SAYILIR:**
        ✓ Denklemler: "2x + 5 = 15", "x² - 4 = 0"
        ✓ Aritmetik: "15 + 27", "125 ÷ 5", "3 × 8"
        ✓ Kesirler: "2/3 + 1/4", "5/6 × 3/10"
        ✓ Yüzdeler: "%20'si 50 olan sayı", "120'nin %15'i"
        ✓ Kelime problemleri: "Ali'nin 20 TL'si var, 8 TL harcadı"
        ✓ Geometri: "Kenarı 5 cm olan karenin alanı"
        ✓ Oran-orantı: "3 işçi 6 günde bitiriyorsa..."
        ✓ Faktöriyel/Kombinasyon: "5!", "C(8,3)"
        ✓ Limit/Türev/İntegral: "lim(x→2)", "f'(x)", "∫x²dx"
        ✓ İstatistik: "ortalama", "medyan", "standart sapma"

        **MATEMATİK SORUSU SAYILMAZ:**
        ✗ Selamlaşmalar: "merhaba", "nasılsın"
        ✗ Genel metinler: "test", "deneme"
        ✗ Sadece sayılar: "12345" (soru sorulmamış)
        ✗ Belirsiz ifadeler: "10 kuş", "5 elma" (işlem yok)
        ✗ Matematikle ilgisiz sorular

        **DÖNDÜRÜLECEK JSON FORMATI:**
        {
            "isMathProblem": boolean,
            "confidence": 0.0-1.0 arası güven skoru,
            "category": "Aritmetik|Cebir|Geometri|Analiz|İstatistik|Kelime Problemi|Matematik Değil",
            "reason": "Kısa gerekçe (max 50 karakter)",
            "educationalMessage": "Kullanıcıya gösterilecek mesaj"
        }

        **ÖRNEKLER:**
        Girdi: "2x + 5 = 15"
        {
            "isMathProblem": true,
            "confidence": 1.0,
            "category": "Cebir",
            "reason": "Birinci dereceden denklem",
            "educationalMessage": "Hemen çözmeye başlıyorum!"
        }

        Girdi: "merhaba"
        {
            "isMathProblem": false,
            "confidence": 1.0,
            "category": "Matematik Değil",
            "reason": "Selamlaşma metni",
            "educationalMessage": "Lütfen çözmemi istediğiniz bir matematik sorusu yazın. Örnek: 2x + 5 = 15"
        }

        **SADECE JSON DÖNDÜR:**
    `;
}

/**
 * Öğrencinin adım adım çözümdeki cevabını değerlendirmek için bir prompt oluşturur.
 *
 * @param {string} studentInput Öğrencinin verdiği cevap.
 * @param {object} stepData Mevcut adım bilgileri.
 * @param {array} mistakeHistory Öğrencinin geçmiş hataları.
 * @returns {string} Gemini API'ye gönderilecek olan değerlendirme prompt'u.
 */
export function buildFlexibleStepValidationPrompt(studentInput, stepData, mistakeHistory = []) {
    const solutionRoadmap = stepData.allSteps.map((step, index) =>
        `  Adım ${index + 1}: ${step.cozum_lateks}`
    ).join('\n');

    const pastMistakesSection = mistakeHistory.length > 0 ? `
        **ÖĞRENCİNİN GEÇMİŞ HATALARI:**
        ${mistakeHistory.map((m, i) => `${i + 1}. ${m}`).join('\n')}
        
        Not: Eğer benzer bir hata tekrarlanıyorsa, nazikçe hatırlat.
    ` : '';

    return `
        **ROLÜN:** Sabırlı, teşvik edici ve Sokratik yöntem kullanan bir matematik koçusun.
        
        **ÖNEMLİ KURALLAR:**
        1. ASLA "yanlış", "hatalı", "olmamış" gibi olumsuz kelimeler kullanma
        2. Öğrenciyi düşünmeye teşvik et, doğrudan cevap verme
        3. Hata varsa, öğrencinin kendisinin bulmasını sağla
        4. Sadece JSON formatında yanıt ver

        **PROBLEM BİLGİLERİ:**
        Çözüm Yolu:
        ${solutionRoadmap}

        Mevcut Adım: ${stepData.currentStepIndex + 1}
        Beklenen Cevap: ${stepData.correctAnswer}
        Öğrencinin Cevabı: ${studentInput}
        ${pastMistakesSection}

        **DEĞERLENDİRME KRİTERLERİ:**
        1. Matematiksel doğruluk (eşdeğer ifadeler kabul edilir)
        2. Sadeleştirme durumu
        3. Notasyon farklılıkları (2*x = 2x = 2·x)
        4. Kesir eşdeğerlikleri (1/2 = 0.5 = 0,5)

        **JSON FORMATI:**
        {
          "isCorrect": boolean,
          "feedbackMessage": "Samimi, teşvik edici geri bildirim mesajı",
          "hintForNext": "Yardım gerekiyorsa ipucu (yoksa null)",
          "isFinalAnswer": boolean,
          "matchedStepIndex": number,
          "isStepSkipped": boolean,
          "proceed_to_next_step": boolean,
          "mistake_type": "İşaret Hatası|İşlem Hatası|Sadeleştirme Hatası|null"
        }

        **MESAJ ÖRNEKLERİ:**
        
        Doğru cevap için:
        "Harika! 🎯 Tam isabet! [Adımla ilgili pozitif yorum]"
        
        Yanlış cevap için:
        "Hmm, şöyle bir düşünelim... [Yönlendirici soru] Ne dersin?"
        
        Küçük hata için:
        "Çok yaklaştın! Sadece [ipucu veren detay] kontrol etmek ister misin?"

        **SADECE JSON DÖNDÜR:**
    `;
}

/**
 * API tarafından üretilmiş bir JSON çözümünü kontrol ve düzeltme için prompt oluşturur.
 *
 * @param {string} generatedJsonString İlk API çağrısından gelen JSON metni.
 * @returns {string} Gemini API'ye gönderilecek olan doğrulama prompt'u.
 */
export function buildVerificationPrompt(generatedJsonString) {
    return `
        **GÖREV:** Aşağıdaki JSON'u kontrol et ve gerekirse düzelt. SADECE JSON döndür.

        **KONTROL EDİLECEK JSON:**
        \`\`\`json
        ${generatedJsonString}
        \`\`\`

        **KONTROL LİSTESİ:**

        ✅ **MATEMATİKSEL DOĞRULUK:**
        - Her adımdaki işlemler doğru mu?
        - Son cevap sadeleştirilmiş mi? (x = 10/2 ❌ → x = 5 ✅)
        - Adımlar mantıklı bir sıra izliyor mu?

        ✅ **JSON YAPISI:**
        - Tüm zorunlu alanlar dolu mu?
        - Her adımda 2 yanlış seçenek var mı?
        - JSON syntax'ı geçerli mi?

        ✅ **LATEX FORMATLAMA:**
        
        TEK $ İÇİNDE OLMASI GEREKENLER:
        - adimAciklamasi içindeki matematik
        - ipucu içindeki matematik
        - hataAciklamasi içindeki matematik
        - sonucKontrolu içindeki matematik
        
        HİÇ $ OLMAMASI GEREKENLER:
        - cozum_lateks
        - metin_lateks
        - odak_alan_lateks
        - tamCozumLateks elemanları

        **YANLIŞ FORMATLAR (bunları düzelt):**
        - \\(...\\) → $...$
        - \\[...\\] → $...$
        - $$...$$ → $...$
        - Saf LaTeX'te $...$ → ... ($ kaldır)

        ✅ **İÇERİK KALİTESİ:**
        - Açıklamalar öğretici mi?
        - İpuçları yardımcı mı?
        - Yanlış seçenekler gerçekçi mi?
        - Hata açıklamaları eğitici mi?

        **ÇIKTI KURALI:**
        - Eğer her şey doğruysa: JSON'u AYNEN döndür
        - Eğer hata varsa: DÜZELTİLMİŞ JSON'u döndür
        - ASLA açıklama ekleme, SADECE JSON döndür
    `;
}

/**
 * Kullanıcı girdisinin uygunluğunu denetlemek için bir prompt oluşturur.
 *
 * @param {string} userInput Kullanıcının girdiği metin.
 * @returns {string} Gemini API'ye gönderilecek olan denetleme prompt'u.
 */
export function buildInputModerationPrompt(userInput) {
    return `
        **GÖREV:** Kullanıcı girdisini analiz et ve güvenlik kontrolü yap. SADECE JSON döndür.

        **KULLANICI GİRDİSİ:**
        "${userInput}"

        **GÜVENLİK KRİTERLERİ:**

        ✅ GÜVENLİ SAYILIR:
        - Matematik soruları ve cevapları
        - "Bilmiyorum", "Anlamadım" gibi ifadeler
        - Sayılar ve matematiksel ifadeler
        - Normal soru cümleleri

        ❌ GÜVENSİZ SAYILIR:
        - Küfür, hakaret, argo
        - Tehdit içeren ifadeler
        - Kişisel bilgiler (telefon, adres, TC no)
        - Spam (anlamsız karakterler: "asdfgh", "xxxxxx")
        - Matematik dışı sohbet ("nasılsın", "naber")

        **JSON FORMATI:**
        {
          "isSafe": boolean,
          "reason": "safe|küfür|tehdit|kişisel_bilgi|spam|alakasız",
          "message": "Kullanıcıya gösterilecek uyarı mesajı (güvensizse)"
        }

        **ÖRNEKLER:**

        Girdi: "2x + 5 = 15"
        {
          "isSafe": true,
          "reason": "safe",
          "message": null
        }

        Girdi: "salak soru"
        {
          "isSafe": false,
          "reason": "küfür",
          "message": "Lütfen nazik bir dil kullanalım. Matematik sorularınızı bekliyorum! 😊"
        }

        Girdi: "nasılsın"
        {
          "isSafe": false,
          "reason": "alakasız",
          "message": "Ben matematik sorularını çözmek için buradayım. Bir matematik sorunuz varsa yardımcı olabilirim!"
        }

        **SADECE JSON DÖNDÜR:**
    `;
}