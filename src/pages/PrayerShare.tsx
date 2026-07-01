import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function PrayerShare() {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [shareConsent, setShareConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert("기도제목을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'prayer_requests'), {
        name: name.trim() || '익명',
        content: content.trim(),
        shareConsent,
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      setName('');
      setContent('');
      setShareConsent(false);
    } catch (error) {
      console.error("기도제목 제출 실패:", error);
      alert("제출 도중 에러가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col justify-between p-6">
      
      {/* 상단 가짜 네비게이션 / 뒤로가기 */}
      <div className="max-w-xl mx-auto w-full pt-6 flex justify-between items-center">
        <a href="/" className="text-white/60 hover:text-white transition-colors text-sm font-semibold flex items-center gap-1">
          ← 메인 홈으로
        </a>
        <span className="text-xs text-white/40 font-mono">Step 3. Prayer Request</span>
      </div>

      {/* 메인 폼 카드 */}
      <div className="max-w-xl mx-auto w-full my-auto py-12">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold tracking-wider">
              기도제목 나누기
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight pt-1">
              말씀의지혜 공동체 기도제목 🙏
            </h1>
            <p className="text-white/60 text-[13.5px] leading-relaxed break-keep">
              구독자님의 소중한 기도제목을 나누어 주세요. 함께 기도하며 하나님의 선한 인도하심을 신뢰하고 소망합니다.
            </p>
          </div>

          {success ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center space-y-4">
              <span className="text-4xl">🕊️</span>
              <h2 className="text-lg font-bold text-green-300">기도제목이 성공적으로 전달되었습니다</h2>
              <p className="text-white/70 text-xs leading-relaxed break-keep">
                올려주신 기도제목을 품고 말씀의지혜 팀과 구독자 공동체가 함께 중보기도 하겠습니다. 하나님의 위로와 평안이 가득하시길 빕니다.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="px-5 py-2 bg-green-600 hover:bg-green-500 rounded-xl text-xs font-bold transition-all text-white"
              >
                추가 제출하기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2 tracking-wider">이름 / 닉네임</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 bg-black/40 border border-white/20 focus:border-amber-400/50 rounded-xl px-4 text-sm focus:outline-none transition-colors"
                  placeholder="공란으로 두시면 '익명'으로 전송됩니다."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-2 tracking-wider">나의 기도제목 (필수)</label>
                <textarea 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full bg-black/40 border border-white/20 focus:border-amber-400/50 rounded-xl p-4 text-sm focus:outline-none transition-colors leading-relaxed"
                  placeholder="여기에 기도제목을 자세히 작성해 주세요..."
                />
              </div>

              <div className="flex items-start gap-3 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <input 
                  type="checkbox"
                  id="shareConsent"
                  checked={shareConsent}
                  onChange={(e) => setShareConsent(e.target.checked)}
                  className="w-5 h-5 rounded-md border-white/20 bg-black/40 text-amber-500 focus:ring-0 cursor-pointer mt-0.5"
                />
                <label htmlFor="shareConsent" className="text-xs text-white/60 cursor-pointer leading-relaxed select-none">
                  <strong className="text-white/80 block mb-1">뉴스레터 및 주간 기도 공유에 동의합니다 (선택)</strong>
                  체크하시면 대표님이 매주 정기 뉴스레터를 보낼 때 다른 구독자들과 기도제목을 익명으로 공유하여 함께 기도할 수 있습니다.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-13 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl font-bold text-white text-sm transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
              >
                {loading ? '제출 중...' : '기도제목 올려드리기 🕊️'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 하단 푸터 */}
      <div className="max-w-xl mx-auto w-full pb-6 text-center text-[11px] text-white/30">
        © 2026 말씀의지혜. All rights reserved.
      </div>
    </div>
  );
}
