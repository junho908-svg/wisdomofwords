import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart } from 'lucide-react';

interface BankTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function BankTransferModal({ isOpen, onClose, title = "말씀의지혜 후원 안내" }: BankTransferModalProps) {
  const cteeUrl = "https://ctee.kr/place/wisdomofwords";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 뒷배경 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          >
            {/* 모달 본체 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              {/* 상단 장식 빛그라데이션 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-gradient-to-b from-amber-500/10 to-transparent blur-xl pointer-events-none" />

              {/* 닫기 버튼 */}
              <button
                onClick={onClose}
                className="absolute right-5 top-5 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6 space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-2">
                  <Heart className="w-6 h-6 fill-amber-400/10" />
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                <p className="text-zinc-400 text-[13px] leading-relaxed break-keep">
                  보내주시는 따뜻한 사랑과 후원은<br />
                  더 은혜롭고 깊이 있는 말씀 묵상 콘텐츠를<br />
                  제작하는 데 정성껏 사용됩니다.
                </p>
              </div>

              <div className="space-y-4">
                {/* 공식 크리에이터 후원 채널 안내 카드 */}
                <div className="bg-white/[0.02] rounded-2xl p-5 border border-white/5 space-y-4 text-center">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Official Support
                    </span>
                    <h4 className="text-white font-bold text-[15px] pt-1">말씀의지혜 공식 크리에이터 후원</h4>
                    <p className="text-zinc-500 text-[11px] leading-relaxed break-keep">
                      실명이나 계좌번호가 전혀 노출되지 않는 공식 후원 창구입니다. 네이버페이, 카카오페이, 신용카드 등으로 간편하게 동참하실 수 있습니다.
                    </p>
                  </div>

                  {/* 후원 페이지 바로가기 버튼 */}
                  <a
                    href={cteeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold text-[14px] text-center flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 active:scale-95"
                  >
                    🕊️ 말씀의지혜 후원하기 ↗
                  </a>
                </div>
              </div>

              <div className="mt-5">
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  창 닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
