import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function BankTransferModal({ isOpen, onClose, title = "말씀의지혜 후원 안내" }: BankTransferModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative"
            >
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-zinc-400 text-sm">
                  따뜻한 마음으로 전해주시는 소중한 후원금은<br />
                  더 좋은 콘텐츠를 만드는 데 사용됩니다.
                </p>
              </div>

              <div className="space-y-4">
                {/* 일반 계좌이체 영역 */}
                <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700/50 text-left space-y-3">
                  <div className="flex justify-between items-center border-b border-zinc-700/50 pb-2">
                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">일반 계좌 송금</span>
                    <span className="text-[10px] text-zinc-500 font-bold">수수료 무료</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-black text-sm">카카오뱅크</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText("3333-37-8521712");
                          alert("📋 계좌번호가 복사되었습니다!");
                        }}
                        className="text-xs text-yellow-400 hover:text-yellow-300 font-bold transition-colors cursor-pointer"
                      >
                        복사
                      </button>
                    </div>
                    <p className="text-lg font-black text-white tracking-wider font-mono">3333-37-8521712</p>
                  </div>
                  <div className="flex justify-between text-xs text-zinc-400 pt-2.5 border-t border-zinc-700/30">
                    <span>예금주</span>
                    <span className="text-white font-extrabold">커넥티드라이프</span>
                  </div>
                </div>

                {/* 카카오페이 영역 */}
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 flex flex-col items-center justify-center">
                  <div className="w-40 h-40 bg-zinc-700 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    <img
                      src="/kakaopay-qr.png"
                      alt="카카오페이 송금 QR코드"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-yellow-400 text-xs font-semibold mb-3">QR코드 스캔으로 간편 송금</p>
                  
                  {/* 모바일 송금 링크 버튼 */}
                  <a
                    href="https://qr.kakaopay.com/FGJw8z2Ty"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-[#FEE500] hover:bg-[#F4DC00] text-[#191919] rounded-lg font-bold text-[12px] text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.723 1.698 5.105 4.195 6.471-.233.842-1.042 3.197-1.127 3.493-.105.37.114.364.298.24 1.576-1.066 3.734-2.585 5.132-3.642.493.076 1.002.115 1.502.115 5.523 0 10-3.477 10-7.75S17.523 3 12 3z" />
                    </svg>
                    모바일 카카오페이로 연결
                  </a>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
                >
                  확인
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
