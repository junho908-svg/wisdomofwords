import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import app, { db } from '../lib/firebase'; 

export default function AdminNewsletter() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);
  
  // 구독자 리스트 상태
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; createdAt?: string }[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // 비밀번호 확인 및 구독자 불러오기
  const handleCheckPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'wisdom123') {
      setIsAuthorized(true);
      await fetchSubscribers();
    } else {
      alert('비밀번호가 틀렸습니다.');
      setIsAuthorized(false);
    }
  };

  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const q = query(collection(db, 'newsletter_subscribers'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Firestore Timestamp 처리
        let dateString = '날짜 미상';
        if (data.createdAt) {
          if (typeof data.createdAt.toDate === 'function') {
            dateString = data.createdAt.toDate().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } else if (data.createdAt instanceof Date) {
            dateString = data.createdAt.toLocaleDateString();
          }
        }
        list.push({
          id: docSnap.id,
          email: data.email,
          createdAt: dateString
        });
      });
      setSubscribers(list);
    } catch (error) {
      console.error("구독자 목록 조회 실패:", error);
      alert("구독자 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
      setLoadingSubscribers(false);
    }
  };

  // 구독자 삭제 기능
  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`${email} 구독자를 정말 명단에서 삭제하시겠습니까?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'newsletter_subscribers', id));
      alert('성공적으로 삭제되었습니다.');
      await fetchSubscribers(); // 리스트 갱신
    } catch (error) {
      console.error("구독자 삭제 실패:", error);
      alert('삭제 중 에러가 발생했습니다.');
    }
  };

  // CSV 다운로드 기능
  const downloadCSV = () => {
    if (subscribers.length === 0) {
      alert('다운로드할 구독자가 없습니다.');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM 설정 (한글 깨짐 방지)
    csvContent += "이메일 주소,가입 일시\n";
    
    subscribers.forEach((sub) => {
      csvContent += `"${sub.email}","${sub.createdAt}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `말씀의지혜_구독자명단_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !htmlContent) {
      alert("제목과 본문을 입력해주세요.");
      return;
    }

    if (!confirm(`정말 총 ${subscribers.length}명의 구독자에게 메일을 발송하시겠습니까?`)) {
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
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* 권한 확인 (비밀번호 입력 전) */}
        {!isAuthorized ? (
          <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl mt-12">
            <h1 className="text-2xl font-bold mb-2 text-center">관리자 로그인</h1>
            <p className="text-white/60 mb-6 text-sm text-center">비밀번호를 입력하여 관리자 페이지를 활성화하세요.</p>
            
            <form onSubmit={handleCheckPassword} className="space-y-4">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-center"
                placeholder="비밀번호를 입력하세요"
              />
              <button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-all"
              >
                인증하기
              </button>
            </form>
          </div>
        ) : (
          /* 인증 완료된 관리자 화면 */
          <>
            {/* 뉴스레터 발송 폼 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold">전체 구독자 뉴스레터 발송</h1>
                  <p className="text-white/60 text-sm mt-1">
                    현재 구독 중인 모든 이메일 계정으로 단체 메일을 일괄 발송합니다.
                  </p>
                </div>
                <button 
                  onClick={() => setIsAuthorized(false)} 
                  className="px-4 py-2 border border-white/20 hover:bg-white/10 rounded-xl text-xs"
                >
                  로그아웃
                </button>
              </div>

              {result && (
                <div className={`p-4 mb-6 rounded-xl border ${result.success ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
                  {result.message}
                </div>
              )}

              <form onSubmit={handleSend} className="space-y-6">
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
                  {loading ? '발송 중...' : `구독자 ${subscribers.length}명에게 일괄 발송하기 🚀`}
                </button>
              </form>
            </div>

            {/* 구독자 명단 관리 테이블 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">뉴스레터 구독자 명단</h2>
                  <p className="text-white/60 text-sm mt-1">
                    총 <span className="text-blue-400 font-bold">{subscribers.length}명</span>의 독자가 구독 중입니다.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={fetchSubscribers}
                    disabled={loadingSubscribers}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all"
                  >
                    {loadingSubscribers ? '새로고침 중...' : '새로고침 🔄'}
                  </button>
                  <button 
                    onClick={downloadCSV}
                    className="px-4 py-2 bg-green-600/80 hover:bg-green-600 rounded-xl text-xs font-bold transition-all"
                  >
                    엑셀(CSV) 다운로드 📥
                  </button>
                </div>
              </div>

              {loadingSubscribers ? (
                <div className="py-12 text-center text-white/40">목록을 불러오는 중입니다...</div>
              ) : subscribers.length === 0 ? (
                <div className="py-12 text-center text-white/40">아직 구독자가 없습니다.</div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 border-b border-white/10 text-white/80 font-bold">
                      <tr>
                        <th className="px-6 py-4">이메일 주소</th>
                        <th className="px-6 py-4">구독 일시</th>
                        <th className="px-6 py-4 text-center">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-white/80">
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-medium">{sub.email}</td>
                          <td className="px-6 py-4 text-white/60">{sub.createdAt}</td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-semibold transition-all"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
