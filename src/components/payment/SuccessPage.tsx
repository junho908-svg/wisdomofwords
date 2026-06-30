import React, { useEffect, useState } from 'react';
import { createOrder } from '../../lib/firestore';

const SuccessPage: React.FC = () => {
  const [params, setParams] = useState({
    orderId: '',
    amount: '',
    paymentKey: '',
    paymentType: '',
    currency: 'KRW',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const orderId = searchParams.get('orderId') || '';
    const amountStr = searchParams.get('amount') || '';
    const paymentKey = searchParams.get('paymentKey') || '';
    const paymentType = searchParams.get('paymentType') || '';
    const currency = searchParams.get('currency') || 'KRW';

    setParams({
      orderId,
      amount: amountStr,
      paymentKey,
      paymentType,
      currency,
    });

    if (paymentType === 'paypal') {
      // 페이팔은 이미 App.tsx의 handlePayPalSuccess에서 저장 완료되었으므로 바로 완료 처리
      setSaveStatus('saved');
      return;
    }

    if (orderId && amountStr) {
      setSaveStatus('saving');
      // 토스 결제 완료 기록을 Firestore DB에 안전하게 기록
      createOrder({
        id: orderId,
        userId: 'anonymous', // 비로그인 후원자
        productId: 'toss-support',
        productName: 'Toss Payments Support',
        amount: parseFloat(amountStr),
        currency: 'KRW',
        status: 'completed',
        tossPaymentKey: paymentKey,
      })
        .then(() => {
          console.log('[Firestore] Toss order saved:', orderId);
          setSaveStatus('saved');
        })
        .catch((err) => {
          console.error('[Firestore] Failed to save Toss order:', err);
          setSaveStatus('failed');
        });
    }
  }, []);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
      {/* 백그라운드 디자인 데코 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-lg bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl text-center shadow-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
        {/* 성공 체크 아이콘 */}
        <div className="w-20 h-20 bg-amber-200/10 border border-amber-200/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-pulse">
          <svg className="w-10 h-10 text-amber-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-white text-[24px] sm:text-[30px] font-bold tracking-tight mb-4 break-keep">
          따뜻한 마음에 깊이 감사드립니다
        </h1>
        <p className="text-white/60 text-[14px] sm:text-[16px] leading-relaxed mb-10 max-w-md mx-auto break-keep">
          보내주신 소중한 후원금은 말씀의지혜 채널의 안정적인 묵상 콘텐츠 제작 및 더 나은 영상 환경 구축을 위해 가치 있게 사용됩니다.
        </p>

        {/* 결제 정보 내역 */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-left mb-8 flex flex-col gap-3">
          <h2 className="text-white/80 text-[15px] font-bold border-b border-white/5 pb-2 mb-1">후원 내역 정보</h2>
          
          <div className="flex justify-between text-[13px] sm:text-[14px]">
            <span className="text-white/40">주문 번호</span>
            <span className="text-white/80 font-mono tracking-tight">{params.orderId || 'N/A'}</span>
          </div>

          <div className="flex justify-between text-[13px] sm:text-[14px]">
            <span className="text-white/40">후원 금액</span>
            <span className="text-amber-200 font-bold">
              {params.amount ? (params.currency === 'USD' ? `$${params.amount}` : `${Number(params.amount).toLocaleString()}원`) : 'N/A'}
            </span>
          </div>

          {params.paymentKey && (
            <div className="flex flex-col text-[12px] gap-1">
              <span className="text-white/40">결제 고유 키</span>
              <span className="text-white/30 font-mono break-all bg-white/[0.01] p-2 rounded-lg border border-white/5 select-all">
                {params.paymentKey}
              </span>
            </div>
          )}

          <div className="border-t border-white/5 pt-3 mt-1 flex justify-between items-center text-[12px]">
            <span className="text-white/40">클라우드 DB 저장 상태</span>
            {saveStatus === 'saving' && <span className="text-yellow-400/80 animate-pulse">⏳ 저장 중...</span>}
            {saveStatus === 'saved' && <span className="text-amber-200">✅ 안전하게 기록됨</span>}
            {saveStatus === 'failed' && <span className="text-rose-400">❌ 기록 실패</span>}
          </div>
        </div>

        <button
          onClick={handleGoHome}
          className="w-full h-14 bg-white hover:bg-amber-100 font-bold text-[16px] text-black rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-300 cursor-pointer shadow-md"
        >
          홈페이지로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
