import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, CheckCircle } from 'lucide-react';

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function BankTransferModal({ isOpen, onClose, title = "말씀의지혜 후원 안내" }: BankTransferModalProps) {
  const [copied, setCopied] = useState(false);

  // TODO: 실제 정보로 변경 필요
  const bankInfo = {
    bankName: "카카오뱅크",
    accountNumber: "3333-21-0560955",
    accountHolder: "전준호"
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bankInfo.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                {/* 카카오페이 영역 (추후 실제 QR 이미지로 교체) */}
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 flex flex-col items-center justify-center">
                  <div className="w-40 h-40 bg-zinc-700 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    <img
                      src="/kakaopay-qr.png"
                      alt="카카오페이 송금 QR코드"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-yellow-400 text-sm font-medium mb-3">카카오페이 스캔으로 간편 송금</p>
                  
                  {/* 모바일 송금 링크 버튼 */}
                  <a
                    href="https://qr.kakaopay.com/FGJw8z2Ty"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-[#FEE500] hover:bg-[#F4DC00] text-[#191919] rounded-lg font-bold text-[13px] text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.723 1.698 5.105 4.195 6.471-.233.842-1.042 3.197-1.127 3.493-.105.37.114.364.298.24 1.576-1.066 3.734-2.585 5.132-3.642.493.076 1.002.115 1.502.115 5.523 0 10-3.477 10-7.75S17.523 3 12 3z" />
                    </svg>
                    모바일 카카오페이 앱 열기
                  </a>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink-0 mx-4 text-zinc-500 text-xs uppercase">또는</span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                {/* 계좌이체 영역 */}
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-400 text-sm">{bankInfo.bankName}</span>
                    <span className="text-zinc-400 text-sm">{bankInfo.accountHolder}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white font-mono text-lg tracking-wider">{bankInfo.accountNumber}</span>
                    <button
                      onClick={handleCopy}
                      className="p-2 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-1 text-zinc-300"
                      title="계좌번호 복사"
                    >
                      {copied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
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
