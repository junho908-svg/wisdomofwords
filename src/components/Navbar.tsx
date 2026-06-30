import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquashHamburger } from './SquashHamburger';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  entranceComplete: boolean;
}

export function Navbar({ entranceComplete }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80; // 80px offset for fixed navbar
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 h-20 flex items-center px-4 sm:px-6 md:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: entranceComplete ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* ===== DESKTOP ===== */}
        <div className="hidden sm:flex items-center justify-between w-full">
          {/* Left group */}
          <div className="flex items-center gap-3">
            {/* Logo pill */}
            <motion.div
              className={`h-16 px-6 bg-black/65 backdrop-blur-lg rounded-[18px] flex items-center gap-4 border border-white/15 cursor-pointer ${
                menuOpen ? 'hidden lg:flex' : 'flex'
              }`}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.8)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img 
                src="/logo-badge.png?v=1" 
                alt="말씀의지혜 로고" 
                className="w-[54px] h-[54px] object-contain rounded-full shrink-0" 
                style={{ mixBlendMode: 'screen' }}
              />
              <span className="text-[22px] font-bold tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                말씀의지혜
              </span>
            </motion.div>

            {/* Expanding menu pill */}
            <motion.div
              className="h-14 rounded-[16px] bg-black/65 backdrop-blur-lg flex items-center overflow-hidden border border-white/15"
              animate={{ width: menuOpen ? 580 : 54 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            >
              {/* Hamburger button */}
              <motion.button
                className="flex items-center justify-center shrink-0 cursor-pointer"
                style={{
                  width: menuOpen ? 40 : 54,
                  height: menuOpen ? 40 : 54,
                  borderRadius: menuOpen ? 12 : 16,
                  backgroundColor: menuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                  marginLeft: menuOpen ? 7 : 0,
                }}
                onClick={() => setMenuOpen(!menuOpen)}
                whileHover={{ backgroundColor: menuOpen ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)' }}
              >
                <SquashHamburger isOpen={menuOpen} />
              </motion.button>

              {/* Nav links */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className="flex items-center gap-7 ml-5 whitespace-nowrap"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.25 }}
                  >
                    <button
                      className="text-[17px] sm:text-[18px] font-medium text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                      onClick={() => scrollTo('about')}
                    >
                      채널 소개
                    </button>
                    <button
                      className="text-[17px] sm:text-[18px] font-medium text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                      onClick={() => scrollTo('metrics')}
                    >
                      묵상 배달
                    </button>
                    <button
                      className="text-[17px] sm:text-[18px] font-medium text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                      onClick={() => scrollTo('character')}
                    >
                      로고몽 인사
                    </button>
                    <button
                      className="text-[17px] sm:text-[18px] font-medium text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                      onClick={() => scrollTo('subscribe')}
                    >
                      구독 신청
                    </button>
                    <button
                      className="text-[17px] sm:text-[18px] font-medium text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                      onClick={() => scrollTo('donate')}
                    >
                      채널 후원
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-3">

            {/* App button */}
            <motion.a
              href="https://family-worship-app-pi.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-14 pl-2 pr-6 bg-black/65 backdrop-blur-lg rounded-full flex items-center gap-3 cursor-pointer border border-white/15 no-underline"
              whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.1)' }}
              whileTap={{ scale: 0.97 }}
            >
              <img src="/logomong-profile.jpg" alt="로고몽" className="w-10 h-10 rounded-full object-cover shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
              <span className="text-white text-[16px] sm:text-[17px] font-bold">
                가정예배 App
              </span>
            </motion.a>
          </div>
        </div>

        {/* ===== MOBILE ===== */}
        <div className="flex sm:hidden items-center justify-between w-full">
          {/* Left group */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Logo pill (collapses when menu open) */}
            <motion.div
              className="h-13 px-4 bg-black/65 backdrop-blur-lg rounded-[14px] flex items-center gap-2.5 overflow-hidden shrink-0 border border-white/15 cursor-pointer"
              animate={{ width: menuOpen ? 0 : 'auto', opacity: menuOpen ? 0 : 1, paddingLeft: menuOpen ? 0 : 16, paddingRight: menuOpen ? 0 : 16 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img 
                src="/logo-badge.png?v=1" 
                alt="말씀의지혜 로고" 
                className="w-[42px] h-[42px] object-contain rounded-full shrink-0" 
                style={{ mixBlendMode: 'screen' }}
              />
              <span className="text-[17px] font-bold tracking-tight text-white whitespace-nowrap">
                말씀의지혜
              </span>
            </motion.div>

            {/* Expanding menu capsule */}
            <motion.div
              className="h-13 rounded-[14px] bg-black/65 backdrop-blur-lg flex items-center overflow-hidden border border-white/15"
              animate={{ width: menuOpen ? '100%' : 50 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            >
              <motion.button
                className="flex items-center justify-center shrink-0 cursor-pointer"
                style={{
                  width: menuOpen ? 38 : 50,
                  height: menuOpen ? 38 : 50,
                  borderRadius: menuOpen ? 10 : 14,
                  backgroundColor: menuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
                  marginLeft: menuOpen ? 6 : 0,
                }}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <SquashHamburger isOpen={menuOpen} isMobile />
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className="flex items-center gap-6 ml-4 whitespace-nowrap"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      className="text-[16px] font-bold text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                      onClick={() => scrollTo('about')}
                    >
                      채널 소개
                    </button>
                    <button
                      className="text-[16px] font-bold text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                      onClick={() => scrollTo('metrics')}
                    >
                      묵상 배달
                    </button>
                    <button
                      className="text-[16px] font-bold text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                      onClick={() => scrollTo('character')}
                    >
                      로고몽 인사
                    </button>
                    <button
                      className="text-[16px] font-bold text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                      onClick={() => scrollTo('subscribe')}
                    >
                      구독 신청
                    </button>
                    <button
                      className="text-[16px] font-bold text-white/70 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                      onClick={() => scrollTo('donate')}
                    >
                      채널 후원
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-2 ml-2">

            {/* App button */}
            <motion.a
              href="https://family-worship-app-pi.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-13 pl-1.5 pr-5 bg-black/65 backdrop-blur-lg rounded-full flex items-center gap-2.5 cursor-pointer border border-white/15 shrink-0 no-underline"
              whileTap={{ scale: 0.95 }}
            >
              <img src="/logomong-profile.jpg" alt="로고몽" className="w-10 h-10 rounded-full object-cover shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
              <span className="text-white text-[15px] font-bold">앱 열기</span>
            </motion.a>
          </div>
        </div>
      </motion.nav>

      {/* Auth Modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
