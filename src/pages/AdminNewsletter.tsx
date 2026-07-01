import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../lib/firebase'; // Ensure firebase is initialized here

export default function AdminNewsletter() {
  const [password, setPassword] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !subject || !htmlContent) {
      alert("모든 항목을 입력해주세요.");
      return;
    }

    if (!confirm("정말 모든 구독자에게 메일을 발송하시겠습니까? 이 작업은 취소할 수 없습니다.")) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const functions = getFunctions(app); // Default us-central1
      const sendMassNewsletter = httpsCallable(functions, 'sendMassNewsletter');
      
      const response = await sendMassNewsletter({
        password,
        subject,
        htmlContent
      });

      const data = response.data as any;
      setResult({ success: true, message: data.message });
      
      // Clear form on success
      setSubject('');
      setHtmlContent('');
    } catch (error: any) {
      console.error("Newsletter send error:", error);
      setResult({ 
        success: false, 
        message: error.message === 'permission-denied' 
          ? '비밀번호가 틀렸습니다.' 
          : '발송 중 에러가 발생했습니다: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-20">
      <div className="max-w-3xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
        <h1 className="text-2xl font-bold mb-2">전체 구독자 뉴스레터 발송</h1>
        <p className="text-white/60 mb-8 text-sm">데이터베이스에 수집된 모든 구독자에게 이메일을 일괄 발송합니다.</p>

        {result && (
          <div className={`p-4 mb-6 rounded-xl border ${result.success ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
            {result.message}
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">관리자 비밀번호</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="발송 권한 확인용 비밀번호"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">메일 제목</label>
            <input 
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="예: [말씀의지혜] 이번 주 새로운 영상이 업로드되었습니다!"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">메일 본문 (HTML 지원)</label>
            <p className="text-white/40 text-xs mb-2">
              HTML 태그를 사용하여 메일을 예쁘게 꾸밀 수 있습니다. (예: &lt;h2&gt;제목&lt;/h2&gt;, &lt;br/&gt;)
            </p>
            <textarea 
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={12}
              className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono text-sm"
              placeholder="<div>안녕하세요! 말씀의지혜입니다...</div>"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '발송 중...' : '전체 구독자에게 일괄 발송하기 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
