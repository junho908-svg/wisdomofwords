import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../lib/firebase';

export default function AdminNewsletter() {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'subscribers' | 'prayers'>('send');

  // 뉴스레터 발송 폼 상태
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // 예약 목록 상태
  const [scheduledList, setScheduledList] = useState<{ id: string; subject: string; scheduledAt: string }[]>([]);
  const [loadingScheduled, setLoadingScheduled] = useState(false);

  // 구독자 리스트 상태
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; createdAt: string; rawDate: Date | null }[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // 발송 이력 상태
  const [historyList, setHistoryList] = useState<{ id: string; subject: string; sentAt: string; recipientCount: number; rawDate: Date | null }[]>([]);

  // 기도제목 상태
  const [prayerList, setPrayerList] = useState<{ id: string; name: string; content: string; shareConsent: boolean; createdAt: string }[]>([]);
  const [loadingPrayers, setLoadingPrayers] = useState(false);

  // 캘린더 상태
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDaySubscribers, setSelectedDaySubscribers] = useState<{ email: string; time: string }[]>([]);
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null);

  // 어드민 비밀번호 확인
  const handleCheckPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'wisdom123') {
      setIsAuthorized(true);
      await fetchAllData();
    } else {
      alert('비밀번호가 틀렸습니다.');
      setIsAuthorized(false);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchSubscribers(),
      fetchScheduledList(),
      fetchHistoryList(),
      fetchPrayerList()
    ]);
  };

  // 구독자 조회
  const fetchSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const functions = getFunctions(app);
      const getSubscribersList = httpsCallable(functions, 'getSubscribersList');
      const response = await getSubscribersList({ password });
      const data = response.data as any;
      if (data.success) {
        const formattedList = data.list.map((item: any) => {
          const date = item.createdAt ? new Date(item.createdAt) : null;
          const dateString = date
            ? date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : '날짜 미상';
          return {
            id: item.id,
            email: item.email,
            createdAt: dateString,
            rawDate: date
          };
        });
        setSubscribers(formattedList);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("구독자 조회 실패:", error);
      return false;
    } finally {
      setLoadingSubscribers(false);
    }
  };

  // 예약 뉴스레터 목록 조회
  const fetchScheduledList = async () => {
    setLoadingScheduled(true);
    try {
      const functions = getFunctions(app);
      const getScheduledNewsletters = httpsCallable(functions, 'getScheduledNewsletters');
      const response = await getScheduledNewsletters({ password });
      const data = response.data as any;
      if (data.success) {
        setScheduledList(data.list);
      }
    } catch (error) {
      console.error("예약 목록 조회 실패:", error);
    } finally {
      setLoadingScheduled(false);
    }
  };

  // 발송 이력 조회
  const fetchHistoryList = async () => {
    try {
      const functions = getFunctions(app);
      const getNewsletterHistory = httpsCallable(functions, 'getNewsletterHistory');
      const response = await getNewsletterHistory({ password });
      const data = response.data as any;
      if (data.success) {
        const formatted = data.list.map((item: any) => {
          const date = item.sentAt ? new Date(item.sentAt) : null;
          const dateStr = date ? date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '날짜 미상';
          return {
            ...item,
            sentAt: dateStr,
            rawDate: date
          };
        });
        setHistoryList(formatted);
      }
    } catch (error) {
      console.error("발송 이력 조회 실패:", error);
    }
  };

  // 기도제목 조회
  const fetchPrayerList = async () => {
    setLoadingPrayers(true);
    try {
      const functions = getFunctions(app);
      const getPrayerRequests = httpsCallable(functions, 'getPrayerRequests');
      const response = await getPrayerRequests({ password });
      const data = response.data as any;
      if (data.success) {
        const formatted = data.list.map((item: any) => {
          const date = item.createdAt ? new Date(item.createdAt) : null;
          const dateStr = date ? date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) : '날짜 미상';
          return {
            ...item,
            createdAt: dateStr
          };
        });
        setPrayerList(formatted);
      }
    } catch (error) {
      console.error("기도제목 조회 실패:", error);
    } finally {
      setLoadingPrayers(false);
    }
  };

  // 구독자 삭제
  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`${email} 구독자를 정말 삭제하시겠습니까?`)) return;
    try {
      const functions = getFunctions(app);
      const deleteSubscriber = httpsCallable(functions, 'deleteSubscriber');
      await deleteSubscriber({ password, id });
      alert('성공적으로 삭제되었습니다.');
      await fetchSubscribers();
    } catch (error: any) {
      alert('삭제 실패: ' + error.message);
    }
  };

  // 예약 발송 취소(삭제)
  const handleDeleteScheduled = async (id: string, subject: string) => {
    if (!confirm(`"${subject}" 예약을 취소하시겠습니까?`)) return;
    try {
      const functions = getFunctions(app);
      const deleteScheduledNewsletter = httpsCallable(functions, 'deleteScheduledNewsletter');
      await deleteScheduledNewsletter({ password, id });
      alert('예약이 취소되었습니다.');
      await fetchScheduledList();
    } catch (error: any) {
      alert('예약 취소 실패: ' + error.message);
    }
  };

  // 기도제목 삭제
  const handleDeletePrayer = async (id: string) => {
    if (!confirm("이 기도제목을 삭제하시겠습니까?")) return;
    try {
      const functions = getFunctions(app);
      const deletePrayerRequest = httpsCallable(functions, 'deletePrayerRequest');
      await deletePrayerRequest({ password, id });
      alert('기도제목이 삭제되었습니다.');
      await fetchPrayerList();
    } catch (error: any) {
      alert('삭제 실패: ' + error.message);
    }
  };

  // 기도제목 내용을 뉴스레터 본문으로 복사하여 첨부
  const handleCopyPrayerToNewsletter = (name: string, content: string) => {
    const divider = htmlContent ? "<br/><br/>" : "";
    const htmlSnippet = `
      <div style="background-color: #fffaf0; border: 1px solid #feebc8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h4 style="margin-top: 0; color: #dd6b20; font-size: 15px;">🙏 함께 기도해주세요 (${name} 성도님)</h4>
        <p style="margin: 0; font-size: 14.5px; color: #744210; line-height: 1.8;">
          "${content.replace(/\n/g, '<br/>')}"
        </p>
      </div>
    `.trim();
    
    setHtmlContent(prev => prev + divider + htmlSnippet);
    setActiveTab('send');
    alert("기도제목 템플릿이 뉴스레터 본문 하단에 추가되었습니다!");
  };

  // 뉴스레터 발송 및 예약 등록 처리
  const handleSendOrSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !htmlContent) {
      alert("제목과 본문을 입력해주세요.");
      return;
    }

    if (isScheduled && !scheduledAt) {
      alert("예약 발송 시간을 선택해 주세요.");
      return;
    }

    const actionText = isScheduled 
      ? `${scheduledAt}에 예약 발송을 등록하시겠습니까?`
      : `총 ${subscribers.length}명의 구독자에게 메일을 즉시 발송하시겠습니까?`;

    if (!confirm(actionText)) return;

    setLoading(true);
    setResult(null);

    try {
      const functions = getFunctions(app);
      if (isScheduled) {
        // 예약 발송 등록
        const createScheduledNewsletter = httpsCallable(functions, 'createScheduledNewsletter');
        const response = await createScheduledNewsletter({
          password,
          subject,
          htmlContent,
          scheduledAt: new Date(scheduledAt).toISOString()
        });
        const data = response.data as any;
        if (data.success) {
          setResult({ success: true, message: "예약 뉴스레터가 성공적으로 등록되었습니다." });
          setSubject('');
          setHtmlContent('');
          setIsScheduled(false);
          setScheduledAt('');
          await fetchScheduledList();
        }
      } else {
        // 즉시 발송
        const sendMassNewsletter = httpsCallable(functions, 'sendMassNewsletter');
        const response = await sendMassNewsletter({
          password,
          subject,
          htmlContent
        });
        const data = response.data as any;
        if (data.success) {
          setResult({ success: true, message: data.message });
          setSubject('');
          setHtmlContent('');
          await fetchHistoryList(); // 발송 이력 새로고침
        }
      }
    } catch (error: any) {
      setResult({ success: false, message: '오류가 발생했습니다: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // CSV 다운로드
  const downloadCSV = () => {
    if (subscribers.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
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

  // 캘린더 생성 관련 헬퍼 함수
  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    setSelectedDayString(null);
    setSelectedDaySubscribers([]);
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
    setSelectedDayString(null);
    setSelectedDaySubscribers([]);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendarCells = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const totalDays = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const cells = [];
    // 빈 셀 채우기
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="bg-transparent border border-white/5 min-h-[70px]"></div>);
    }

    // 날짜별 가입자/발송이력 매핑
    for (let day = 1; day <= totalDays; day++) {
      
      // 1. 해당 날짜 가입한 구독자 찾기
      const daySubs = subscribers.filter(sub => {
        if (!sub.rawDate) return false;
        return sub.rawDate.getFullYear() === year &&
               sub.rawDate.getMonth() === month &&
               sub.rawDate.getDate() === day;
      });

      // 2. 해당 날짜 발송된 메일 찾기
      const dayHistory = historyList.filter(hist => {
        if (!hist.rawDate) return false;
        return hist.rawDate.getFullYear() === year &&
               hist.rawDate.getMonth() === month &&
               hist.rawDate.getDate() === day;
      });

      const isSelected = selectedDayString === `${year}-${month + 1}-${day}`;

      cells.push(
        <div 
          key={`day-${day}`}
          onClick={() => {
            if (daySubs.length > 0) {
              const formattedSubs = daySubs.map(s => ({
                email: s.email,
                time: s.rawDate ? s.rawDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : ''
              }));
              setSelectedDaySubscribers(formattedSubs);
              setSelectedDayString(`${year}-${month + 1}-${day}`);
            } else {
              setSelectedDaySubscribers([]);
              setSelectedDayString(null);
            }
          }}
          className={`border border-white/5 p-2 min-h-[75px] flex flex-col justify-between transition-colors cursor-pointer group ${
            isSelected ? 'bg-amber-500/20 border-amber-500/40' : 'bg-white/[0.01] hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-[12px] font-semibold ${isSelected ? 'text-amber-300' : 'text-white/60'}`}>{day}</span>
            {daySubs.length > 0 && (
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-bold border border-blue-500/20">
                +{daySubs.length}
              </span>
            )}
          </div>
          <div className="space-y-1">
            {dayHistory.map((hist) => (
              <div 
                key={hist.id} 
                title={`${hist.subject} (${hist.recipientCount}명 발송)`}
                className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded px-1 py-0.5 truncate max-w-full flex items-center gap-0.5"
              >
                ✉️ <span className="truncate">{hist.subject}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 pt-20">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* 권한 확인 (비밀번호 입력 전) */}
        {!isAuthorized ? (
          <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl mt-12">
            <h1 className="text-2xl font-bold mb-2 text-center">말씀의지혜 통합관리</h1>
            <p className="text-white/60 mb-6 text-sm text-center">비밀번호를 입력하여 통합 관리자 페이지를 활성화하세요.</p>
            
            <form onSubmit={handleCheckPassword} className="space-y-4">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors text-center font-mono"
                placeholder="비밀번호 입력"
              />
              <button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-white transition-all shadow-md"
              >
                로그인 및 데이터 로딩
              </button>
            </form>
          </div>
        ) : (
          /* 인증 완료된 관리자 화면 */
          <>
            {/* 상단 통합 제어바 및 탭 메뉴 */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
              <div>
                <h1 className="text-2xl font-bold">말씀의지혜 통합 어드민 🕊️</h1>
                <p className="text-white/50 text-xs mt-1">뉴스레터 일괄 발송, 캘린더 분석, 예약, 기도제목을 실시간 제어합니다.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                  <button 
                    onClick={() => setActiveTab('send')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'send' ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    뉴스레터 발송
                  </button>
                  <button 
                    onClick={() => setActiveTab('subscribers')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'subscribers' ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    구독자 & 캘린더
                  </button>
                  <button 
                    onClick={() => setActiveTab('prayers')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'prayers' ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white'}`}
                  >
                    기도제목 나눔 ({prayerList.length})
                  </button>
                </div>
                <button 
                  onClick={() => setIsAuthorized(false)} 
                  className="px-4 py-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 rounded-xl text-xs font-bold transition-all"
                >
                  로그아웃
                </button>
              </div>
            </div>

            {/* ── 탭 1: 뉴스레터 발송 ── */}
            {activeTab === 'send' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 메일 작성 폼 */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-6">
                  <h2 className="text-lg font-bold">뉴스레터 작성 및 전송</h2>
                  
                  {result && (
                    <div className={`p-4 mb-4 rounded-xl border ${result.success ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}>
                      {result.message}
                    </div>
                  )}

                  <form onSubmit={handleSendOrSchedule} className="space-y-6">
                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-2">메일 제목</label>
                      <input 
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="메일 제목을 입력해주세요"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/70 mb-2">메일 본문 (HTML 지원)</label>
                      <textarea 
                        value={htmlContent}
                        onChange={(e) => setHtmlContent(e.target.value)}
                        rows={14}
                        className="w-full bg-black/40 border border-white/20 rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="<html> 본문 내용을 입력해주세요 </html>"
                      />
                    </div>

                    {/* 예약 발송 토글 설정 */}
                    <div className="border border-white/10 bg-white/[0.02] rounded-xl p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <label className="text-xs font-bold text-white/80 block">📅 뉴스레터 예약 발송</label>
                          <span className="text-[10px] text-white/40">원하는 시각을 지정하여 자동으로 메일을 발송합니다.</span>
                        </div>
                        <input 
                          type="checkbox"
                          checked={isScheduled}
                          onChange={(e) => setIsScheduled(e.target.checked)}
                          className="w-5 h-5 cursor-pointer rounded border-white/20 bg-black/40 text-blue-500 focus:ring-0"
                        />
                      </div>
                      {isScheduled && (
                        <div className="pt-2">
                          <input 
                            type="datetime-local"
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            className="bg-black/40 border border-white/20 rounded-xl px-4 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center disabled:opacity-50"
                    >
                      {loading ? '처리 중...' : isScheduled ? '예약 메일 등록하기 ⏰' : `구독자 ${subscribers.length}명에게 즉시 발송하기 🚀`}
                    </button>
                  </form>
                </div>

                {/* 예약 대기 목록 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl h-fit space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold">⏰ 발송 대기 예약 ({scheduledList.length})</h2>
                    <button onClick={fetchScheduledList} className="text-xs text-white/40 hover:text-white">새로고침 🔄</button>
                  </div>

                  {loadingScheduled ? (
                    <div className="text-center py-6 text-white/40 text-xs">예약 목록 로딩 중...</div>
                  ) : scheduledList.length === 0 ? (
                    <div className="text-center py-12 text-white/40 text-xs">대기 중인 예약 메일이 없습니다.</div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                      {scheduledList.map((item) => (
                        <div key={item.id} className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-2 relative group">
                          <div className="pr-8">
                            <h4 className="text-xs font-bold text-white truncate" title={item.subject}>{item.subject}</h4>
                            <p className="text-[10px] text-blue-400 mt-1 font-mono">
                              ⏰ {new Date(item.scheduledAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteScheduled(item.id, item.subject)}
                            className="absolute top-4 right-4 text-[10px] px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 rounded"
                          >
                            취소
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 탭 2: 구독자 & 캘린더 관리 ── */}
            {activeTab === 'subscribers' && (
              <div className="space-y-8">
                
                {/* 캘린더 섹션 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold">📅 구독 & 발송 현황 달력</h2>
                      <p className="text-white/40 text-xs mt-1">파란색은 구독자 가입 수, 보라색은 이메일 발송 이력을 나타냅니다.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={handlePrevMonth} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold">이전 달</button>
                      <span className="text-sm font-bold text-white/90">
                        {calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월
                      </span>
                      <button onClick={handleNextMonth} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold">다음 달</button>
                    </div>
                  </div>

                  {/* 달력 그리드 */}
                  <div className="grid grid-cols-7 gap-1 border border-white/10 rounded-xl overflow-hidden">
                    {['일', '월', '화', '수', '목', '금', '토'].map((w, idx) => (
                      <div key={w} className={`text-center py-2 text-[11px] font-bold border-b border-white/10 bg-white/5 ${idx === 0 ? 'text-red-400' : idx === 6 ? 'text-blue-400' : 'text-white/60'}`}>
                        {w}
                      </div>
                    ))}
                    {renderCalendarCells()}
                  </div>

                  {/* 달력 특정 일 가입자 노출 */}
                  {selectedDayString && selectedDaySubscribers.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mt-4 space-y-3">
                      <h4 className="text-xs font-bold text-blue-300">
                        📅 {selectedDayString} 신규 가입자 ({selectedDaySubscribers.length}명)
                      </h4>
                      <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto">
                        {selectedDaySubscribers.map((s, idx) => (
                          <span key={idx} className="text-[11px] bg-black/40 border border-white/10 px-2.5 py-1 rounded-lg">
                            {s.email} <span className="text-white/30 text-[9px] ml-1">{s.time}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 구독자 테이블 리스트 */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold">뉴스레터 구독자 명단</h2>
                      <p className="text-white/60 text-xs mt-1">총 {subscribers.length}명의 독자가 구독 중입니다.</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={fetchSubscribers} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all">새로고침 🔄</button>
                      <button onClick={downloadCSV} className="px-4 py-2 bg-green-600/80 hover:bg-green-600 rounded-xl text-xs font-bold transition-all">엑셀(CSV) 다운로드 📥</button>
                    </div>
                  </div>

                  {loadingSubscribers ? (
                    <div className="text-center py-12 text-white/40">목록 로딩 중...</div>
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
                        <tbody className="divide-y divide-white/5 text-white/70">
                          {subscribers.map((sub) => (
                            <tr key={sub.id} className="hover:bg-white/[0.01] transition-colors">
                              <td className="px-6 py-4 font-medium">{sub.email}</td>
                              <td className="px-6 py-4 text-white/50">{sub.createdAt}</td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 rounded-lg text-xs"
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

              </div>
            )}

            {/* ── 탭 3: 기도제목 나눔 관리 ── */}
            {activeTab === 'prayers' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold">🙏 제출된 기도제목 목록 ({prayerList.length})</h2>
                    <p className="text-white/60 text-xs mt-1">구독자들이 보낸 마음을 모으고 뉴스레터에 중보기도로 첨부합니다.</p>
                  </div>
                  <button onClick={fetchPrayerList} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all">새로고침 🔄</button>
                </div>

                {loadingPrayers ? (
                  <div className="text-center py-12 text-white/40">목록 로딩 중...</div>
                ) : prayerList.length === 0 ? (
                  <div className="text-center py-12 text-white/40">아직 등록된 기도제목이 없습니다.</div>
                ) : (
                  <div className="space-y-4">
                    {prayerList.map((prayer) => (
                      <div key={prayer.id} className="border border-white/10 bg-black/40 rounded-2xl p-6 space-y-4 hover:border-white/20 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-bold text-white/95">{prayer.name}</span>
                            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border ${
                              prayer.shareConsent 
                                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              {prayer.shareConsent ? '뉴스레터 공유 동의' : '비공개 기도'}
                            </span>
                          </div>
                          <span className="text-[11px] text-white/40">{prayer.createdAt}</span>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{prayer.content}</p>
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => handleCopyPrayerToNewsletter(prayer.name, prayer.content)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-all"
                          >
                            📝 뉴스레터 본문으로 복사 첨부
                          </button>
                          <button
                            onClick={() => handleDeletePrayer(prayer.id)}
                            className="px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 text-xs font-semibold rounded-lg transition-all"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}
