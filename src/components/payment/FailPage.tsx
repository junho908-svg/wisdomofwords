import React, { useEffect, useState } from 'react';

const FailPage: React.FC = () => {
  const [params, setParams] = useState({
    code: '',
    message: '',
    orderId: '',
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setParams({
      code: searchParams.get('code') || '',
      message: searchParams.get('message') || '결제 중 오류가 발생했거나 사용자가 취소했습니다.',
      orderId: searchParams.get('orderId') || '',
    });
  }, []);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
      {/* 백그라운드 디자인 데코 */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-lg bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl text-center shadow-2xl drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
        {/* 실패 엑스 아이콘 */}
        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <svg className="w-10 h-10 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-white text-[24px] sm:text-[30px] font-bold tracking-tight mb-4 break-keep">
          결제에 실패했습니다
        </h1>
        <p className="text-white/60 text-[14px] sm:text-[16px] leading-relaxed mb-10 max-w-md mx-auto break-keep">
          요청 처리 도중 오류가 발생했습니다. 아래 오류 메시지를 확인하신 뒤 다시 시도해 주시기 바랍니다.
        </p>

        {/* 결제 정보 내역 */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-left mb-8 flex flex-col gap-3">
          <h2 className="text-white/80 text-[15px] font-bold border-b border-white/5 pb-2 mb-1">오류 내역 정보</h2>
          
          <div className="flex justify-between text-[13px] sm:text-[14px]">
            <span className="text-white/40">오류 코드</span>
            <span className="text-white/80 font-mono tracking-tight">{params.code || 'UNKNOWN_ERROR'}</span>
          </div>

          <div className="flex flex-col text-[13px] sm:text-[14px] gap-1">
            <span className="text-white/40">상세 원인</span>
            <span className="text-rose-300 font-medium leading-relaxed break-keep">
              {params.message}
            </span>
          </div>

          {params.orderId && (
            <div className="flex justify-between text-[13px] sm:text-[14px] border-t border-white/5 pt-2 mt-1">
              <span className="text-white/40">주문 번호</span>
              <span className="text-white/80 font-mono tracking-tight">{params.orderId}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleGoHome}
          className="w-full h-14 bg-white hover:bg-rose-100 font-bold text-[16px] text-black rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-300 cursor-pointer shadow-md"
        >
          홈페이지로 이동하여 다시 시도
        </button>
      </div>
    </div>
  );
};

export default FailPage;
