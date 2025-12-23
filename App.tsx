import React, { useState, useEffect } from 'react';
import { Grade, Student, Evaluation, SavedReport, ThemeConfig } from './types';
import { analyzeStudentWork } from './services/gemini';
import { saveToDB, getFromDB } from './storage';

const THEMES: ThemeConfig[] = [
  { id: 'indigo', name: 'Klasik İndigo', primary: '#4f46e5', secondary: '#eef2ff', accent: '#6366f1', isPremium: false },
  { id: 'emerald', name: 'Zümrüt Yeşili', primary: '#059669', secondary: '#ecfdf5', accent: '#10b981', isPremium: false },
  { id: 'rose', name: 'Gül Kurusu', primary: '#e11d48', secondary: '#fff1f2', accent: '#fb7185', isPremium: false },
];

const App: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // App Data States
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [referenceText, setReferenceText] = useState('');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [currentThemeId, setCurrentThemeId] = useState('indigo');
  
  // UI Interaction States
  const [activeGradeId, setActiveGradeId] = useState<string | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [isAddingGrade, setIsAddingGrade] = useState(false);
  const [newGradeName, setNewGradeName] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');

  // Load Local Data
  useEffect(() => {
    const loadData = async () => {
      const data = await getFromDB('appData');
      if (data) {
        setGrades(data.grades || []);
        setStudents(data.students || []);
        setSavedReports(data.savedReports || []);
        setReferenceText(data.referenceText || '');
        setCurrentThemeId(data.currentThemeId || 'indigo');
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  // Persist Data
  useEffect(() => {
    if (isLoaded) {
      saveToDB('appData', { grades, students, savedReports, referenceText, currentThemeId });
    }
  }, [grades, students, savedReports, referenceText, currentThemeId, isLoaded]);

  const addGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGradeName.trim()) return;
    const newGrade: Grade = { id: Date.now().toString(), name: newGradeName };
    setGrades([...grades, newGrade]);
    setNewGradeName('');
    setIsAddingGrade(false);
    setActiveGradeId(newGrade.id);
  };

  const addStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !activeGradeId) return;
    const newStudent: Student = { 
      id: Date.now().toString(), 
      name: newStudentName, 
      gradeId: activeGradeId 
    };
    setStudents([...students, newStudent]);
    setNewStudentName('');
    setIsAddingStudent(false);
  };

  const handleImageUpload = (studentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, workImage: base64, evaluation: undefined } : s));
    };
    reader.readAsDataURL(file);
  };

  const startAnalysis = async (student: Student) => {
    if (!student.workImage) return;
    setLoading(true);
    try {
      const activeGrade = grades.find(g => g.id === activeGradeId);
      const evaluation = await analyzeStudentWork(student.workImage, activeGrade?.name || 'Genel', referenceText);
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, evaluation } : s));
    } catch (error) {
      console.error(error);
      alert("AI Analiz sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div className="flex items-center justify-center min-h-screen font-black text-indigo-600 animate-pulse uppercase tracking-widest">Sistem Hazırlanıyor...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-slate-100 px-8 py-5 flex items-center justify-between no-print shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <span className="font-black text-xl tracking-tight text-slate-800 uppercase">Eğitim Analiz Portalı</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest border border-emerald-100">Aktif Oturum</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-1 space-y-6 no-print">
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-xs uppercase tracking-widest text-slate-400">Sınıf Düzeyleri</h2>
              <button onClick={() => setIsAddingGrade(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4"/></svg>
              </button>
            </div>
            {isAddingGrade && (
              <form onSubmit={addGrade} className="mb-6 animate-in slide-in-from-top duration-300">
                <input autoFocus type="text" placeholder="Örn: 3-A Sınıfı" className="w-full px-4 py-3 bg-slate-50 rounded-xl outline-none mb-2 text-sm border focus:border-indigo-500 transition-all font-medium" value={newGradeName} onChange={e => setNewGradeName(e.target.value)} />
                <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 active:scale-95 transition-all">SINIFA EKLE</button>
              </form>
            )}
            <div className="space-y-2">
              {grades.map(grade => (
                <button key={grade.id} onClick={() => setActiveGradeId(grade.id)} className={`w-full text-left px-5 py-4 rounded-2xl font-bold transition-all ${activeGradeId === grade.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02]' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-transparent'}`}>
                  {grade.name}
                </button>
              ))}
              {grades.length === 0 && <p className="text-slate-300 text-xs italic text-center py-4">Henüz sınıf eklenmedi.</p>}
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Referans / Örnek Metin</h2>
            <textarea className="w-full h-48 p-4 bg-slate-50 rounded-2xl outline-none text-sm font-medium resize-none border focus:border-indigo-500 transition-all leading-relaxed" placeholder="Yapay zekanın kıyaslama yapabilmesi için buraya örnek metni yapıştırın..." value={referenceText} onChange={e => setReferenceText(e.target.value)} />
            <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
               <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider leading-4">AI bu metni referans alarak öğrenci özgünlüğünü ve konu hakimiyetini ölçer.</p>
            </div>
          </section>
        </aside>

        {/* Content Area */}
        <section className="lg:col-span-3 space-y-6">
          {activeGradeId ? (
            <div className="animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-wrap items-center justify-between mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-black text-slate-900">{grades.find(g => g.id === activeGradeId)?.name}</h1>
                  <p className="text-slate-400 font-bold text-sm mt-1">Öğrenci Listesi & Analiz Yönetimi</p>
                </div>
                {!isAddingStudent ? (
                  <button onClick={() => setIsAddingStudent(true)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M12 4v16m8-8H4"/></svg>
                    Öğrenci Ekle
                  </button>
                ) : (
                  <form onSubmit={addStudent} className="flex gap-2 w-full md:w-auto">
                    <input autoFocus type="text" placeholder="Öğrenci Ad Soyad..." className="flex-1 px-5 py-4 bg-slate-50 rounded-2xl border outline-none focus:border-indigo-500 transition-all font-medium" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} />
                    <button type="submit" className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100">KAYDET</button>
                    <button type="button" onClick={() => setIsAddingStudent(false)} className="px-4 py-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 transition-all">
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </form>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {students.filter(s => s.gradeId === activeGradeId).map(student => (
                  <div key={student.id} onClick={() => setActiveStudentId(student.id)} className={`p-8 rounded-[40px] border-2 transition-all cursor-pointer group relative ${activeStudentId === student.id ? 'bg-white border-indigo-600 shadow-2xl scale-[1.02]' : 'bg-white border-transparent shadow-sm hover:shadow-xl hover:border-slate-100'}`}>
                    <h3 className="text-xl font-black text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors line-clamp-1">{student.name}</h3>
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-2.5 h-2.5 rounded-full ${student.evaluation ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : student.workImage ? 'bg-amber-500 animate-pulse' : 'bg-slate-200'}`}></div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {student.evaluation ? 'Analiz Tamamlandı' : student.workImage ? 'Fotoğraf Yüklendi' : 'Çalışma Bekleniyor'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1 text-center py-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase cursor-pointer hover:bg-slate-100 transition-colors border border-slate-100">
                        FOTOĞRAF
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(student.id, e)} />
                      </label>
                      {student.workImage && !student.evaluation && (
                        <button onClick={(e) => { e.stopPropagation(); startAnalysis(student); }} className="flex-1 py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors border border-indigo-100">ANALİZ ET</button>
                      )}
                      {student.evaluation && (
                        <div className="flex-1 py-4 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase text-center border border-emerald-100">SKOR: {student.evaluation.overallScore}</div>
                      )}
                    </div>
                  </div>
                ))}
                {students.filter(s => s.gradeId === activeGradeId).length === 0 && !isAddingStudent && (
                  <div className="col-span-full py-20 border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    <p className="font-black text-sm uppercase tracking-widest">Sınıf Listesi Boş</p>
                  </div>
                )}
              </div>

              {activeStudentId && students.find(s => s.id === activeStudentId)?.evaluation && (
                <div id="evaluation-report" className="mt-12 bg-white p-10 rounded-[50px] border border-slate-200 shadow-2xl animate-in slide-in-from-bottom duration-700 print-container">
                  <div className="flex justify-between items-start mb-10 flex-wrap gap-6">
                    <div>
                      <h2 className="text-5xl font-black text-slate-900 mb-2">{students.find(s => s.id === activeStudentId)?.name}</h2>
                      <div className="flex items-center gap-3">
                         <p className="text-indigo-600 font-black uppercase text-xs tracking-[0.2em]">Kapsamlı Analiz Raporu</p>
                         <span className="text-slate-300 text-xs">•</span>
                         <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">{grades.find(g => g.id === activeGradeId)?.name}</span>
                      </div>
                    </div>
                    <div className="bg-indigo-600 text-white p-8 rounded-[35px] text-center shadow-xl shadow-indigo-100 min-w-[140px]">
                      <p className="text-[10px] font-black uppercase opacity-60 mb-1">Genel Skor</p>
                      <p className="text-5xl font-black">{students.find(s => s.id === activeStudentId)?.evaluation?.overallScore}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                    <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">El Yazısı</p>
                      <p className="text-2xl font-black text-indigo-600">{students.find(s => s.id === activeStudentId)?.evaluation?.handwritingScore}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Yaratıcılık</p>
                      <p className="text-2xl font-black text-indigo-600">{students.find(s => s.id === activeStudentId)?.evaluation?.creativityScore}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Özgünlük</p>
                      <p className="text-2xl font-black text-indigo-600">{students.find(s => s.id === activeStudentId)?.evaluation?.originalityScore}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Hatalar</p>
                      <p className="text-2xl font-black text-rose-500">{students.find(s => s.id === activeStudentId)?.evaluation?.punctuationErrors.length}</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="font-black text-xs uppercase text-slate-400 mb-4 tracking-widest">Öğrenci Metin Dökümü</h4>
                      <p className="text-lg text-slate-600 italic leading-relaxed bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        "{students.find(s => s.id === activeStudentId)?.evaluation?.transcribedText}"
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100">
                        <h4 className="font-black text-xs uppercase text-emerald-700 mb-4 tracking-widest">Kavram Bilgisi & Gelişim</h4>
                        <p className="text-sm text-emerald-800 font-medium leading-loose">{students.find(s => s.id === activeStudentId)?.evaluation?.conceptKnowledge}</p>
                      </div>
                      <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
                        <h4 className="font-black text-xs uppercase text-indigo-700 mb-4 tracking-widest">Özel Gelişim Önerileri</h4>
                        <ul className="space-y-4">
                          {students.find(s => s.id === activeStudentId)?.evaluation?.suggestions.map((s, i) => (
                            <li key={i} className="flex gap-4">
                              <span className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0"></span>
                              <div>
                                <p className="text-[10px] font-black uppercase text-indigo-400">{s.topic}</p>
                                <p className="text-sm font-bold text-indigo-900">{s.action}</p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="mt-10 pt-10 border-t border-slate-100 flex justify-end no-print">
                    <button onClick={() => window.print()} className="px-10 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-black transition-all active:scale-95 flex items-center gap-3">
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                       PDF Raporu İndir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-[60px] p-32 text-center shadow-inner border border-slate-100 flex flex-col items-center animate-in fade-in duration-1000">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Başlamak için bir sınıf seçin</h3>
              <p className="text-slate-400 font-medium mt-4">Henüz sınıfınız yoksa sol panelden '+' butonu ile ekleyebilirsiniz.</p>
            </div>
          )}
        </section>
      </main>

      {loading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-white p-12 rounded-[50px] shadow-2xl flex flex-col items-center text-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
            <h3 className="text-2xl font-black text-slate-900">Yapay Zeka Analiz Ediyor...</h3>
            <p className="text-slate-400 mt-2 font-medium">Öğrenci çalışması inceleniyor, metin dökümü ve puanlama yapılıyor.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;