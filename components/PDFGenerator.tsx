
import React from 'react';
import { Student, Grade } from '../types';

interface PDFGeneratorProps {
  student: Student;
  grade: Grade | undefined;
}

export const PDFGenerator: React.FC<PDFGeneratorProps> = ({ student, grade }) => {
  const handlePrint = () => {
    // Yazdırma işlemi sırasında sayfa başlığını değiştirerek PDF ismini etkiliyoruz
    const originalTitle = document.title;
    document.title = `${student.name}_Analiz_Raporu`;
    window.print();
    document.title = originalTitle;
  };

  if (!student.evaluation) return null;

  return (
    <div className="mt-4 flex justify-end no-print">
      <button
        onClick={handlePrint}
        className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        PDF OLARAK İNDİR / YAZDIR
      </button>
      <style>{`
        @media print {
          /* Yazdırma sırasında sadece .print-container görünür kalsın */
          .no-print, header, aside, nav, .sidebar, button { display: none !important; }
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          .print-container { 
            width: 100% !important; 
            border: none !important; 
            box-shadow: none !important; 
            padding: 20px !important;
            margin: 0 !important;
          }
          /* Sayfa kesilmelerini önle */
          .print-container { page-break-after: always; }
          img { max-width: 100% !important; border-radius: 10px !important; }
        }
      `}</style>
    </div>
  );
};
