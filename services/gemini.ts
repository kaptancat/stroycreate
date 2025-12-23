
import { GoogleGenAI, Type } from "@google/genai";
import { Evaluation, Student } from "../types";

// Always use the API key directly from process.env.API_KEY when initializing the client.
// This is mandated by the library's coding guidelines.

export const analyzeStudentWork = async (
  base64Image: string,
  gradeLevel: string,
  referenceText: string
): Promise<Evaluation> => {
  // Use named parameter and direct process.env reference
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Aşağıdaki resmi ve içindeki öğrenci el yazısını analiz et. 
    Sınıf düzeyi: ${gradeLevel}
    Örnek/Referans Metin (Eğer varsa): ${referenceText}

    Lütfen şu kriterlere göre değerlendir:
    1. Yazı Güzelliği (Okunabilirlik, düzen)
    2. Özgünlük (Kendi fikirlerini katma derecesi)
    3. Noktalama Hataları
    4. Kavram Bilgisi (Konuyu anlama ve doğru kelime kullanımı)
    5. Kopye/Benzerlik (Referans metinle aşırı benzerlik var mı?)
    6. Yaratıcı Güç
    7. Genel Puan (0-100)
    8. Eksik Yönler ve Çözüm Önerileri (Konu, kavram ve kitap okuma odaklı)
    9. Transkripsiyon: Kağıtta yazan metnin TAMAMINI olduğu gibi yazıya dök (transcribedText).

    Cevabı mutlaka JSON formatında döndür.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: "image/png" } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          handwritingScore: { type: Type.NUMBER },
          originalityScore: { type: Type.NUMBER },
          punctuationErrors: { type: Type.ARRAY, items: { type: Type.STRING } },
          conceptKnowledge: { type: Type.STRING },
          transcribedText: { type: Type.STRING, description: "Öğrencinin yazdığı metnin tam dökümü." },
          creativityScore: { type: Type.NUMBER },
          plagiarismNote: { type: Type.STRING },
          overallScore: { type: Type.NUMBER },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                action: { type: Type.STRING }
              },
              required: ["topic", "action"]
            }
          }
        },
        required: [
          "handwritingScore", "originalityScore", "punctuationErrors", 
          "conceptKnowledge", "transcribedText", "creativityScore", 
          "plagiarismNote", "overallScore", "weaknesses", "suggestions"
        ]
      }
    }
  });

  // Access response.text directly (it is a property, not a function)
  const evaluation: Evaluation = JSON.parse(response.text || "{}");
  return evaluation;
};

export const compareStudentsForPlagiarism = async (
  students: Student[],
  gradeLevel: string
): Promise<string> => {
  if (students.length < 2) return "Kıyaslama için en az 2 öğrenci analizi gereklidir.";
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Send the actual transcribed texts for word-for-word comparison
  const studentData = students
    .filter(s => s.evaluation?.transcribedText)
    .map(s => `Öğrenci: ${s.name}\nMetin: ${s.evaluation?.transcribedText}`)
    .join("\n\n---\n\n");

  const prompt = `
    Aşağıda ${gradeLevel} düzeyindeki öğrencilerin kağıtlarından dökülen metinler var. 
    Bu metinleri karşılaştırarak TIPA TIP AYNI OLAN (verbatim/kelimesi kelimesine) cümleleri veya kısımları bul.
    
    Raporu şu şekilde oluştur:
    1. Hangi öğrenciler arasında tıpatıp benzerlik var?
    2. AYNI OLAN METİN KISIMLARI NELER? (Tırnak içinde belirt)
    3. Bu benzerliklerin kopye olma ihtimalini değerlendir ve öğretmen için öneri sun.
    
    Veriler:
    ${studentData}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  // Access response.text directly (it is a property, not a function)
  return response.text || "Karşılaştırma yapılamadı.";
};
