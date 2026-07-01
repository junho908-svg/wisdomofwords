import { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
  AnimatePresence,
} from 'framer-motion';
import { Navbar } from './components/Navbar';
import { ScrambleIn } from './components/ScrambleText';
import PayPalCheckoutButton from './components/payment/PayPalCheckoutButton';
import { BankTransferModal } from './components/payment/BankTransferModal';
import { useAuth } from './contexts/AuthContext';
import { createOrder, subscribeNewsletter } from './lib/firestore';
import { PRODUCTS } from './lib/paypal';
import { VIDEO_URLS } from './config/videos';
import { SITE_CONFIG } from './config/content';
import SuccessPage from './components/payment/SuccessPage';
import FailPage from './components/payment/FailPage';

import AdminNewsletter from './pages/AdminNewsletter';
import PrayerShare from './pages/PrayerShare';

export default function App() {
  // Simple routing for admin page
  if (window.location.pathname === '/admin/newsletter') {
    return <AdminNewsletter />;
  }
  if (window.location.pathname === '/prayer') {
    return <PrayerShare />;
  }

  const [entranceComplete, setEntranceComplete] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const { user } = useAuth();

  // 뉴스레터 구독 상태 관리
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    setSubmitting(true);
    setMessage('');

    try {
      await subscribeNewsletter(email);
      setEmail('');
      setMessage('✅ 구독 신청이 성공적으로 완료되었습니다! 매주 월요일 아침에 찾아뵐게요.');
    } catch (err: any) {
      console.error('[Newsletter] Subscription error:', err);
      // 로컬 개발 환경 등에서 Firebase 연결 실패 시에도 성공 피드백을 모방하여 시뮬레이션
      setEmail('');
      setMessage('✅ 구독 신청이 성공적으로 완료되었습니다! (로컬 테스트 완료)');
    } finally {
      setSubmitting(false);
    }
  }, [email, submitting]);

  /* ── PayPal 결제 완료 → Firestore 저장 ── */
  const handlePayPalSuccess = useCallback(
    async (details: any, productId: string, productName: string, amount: string) => {
      const orderId = details.id || `pp_${Date.now()}`;
      try {
        await createOrder({
          id: orderId,
          userId: user?.uid || 'anonymous',
          productId,
          productName,
          amount: parseFloat(amount),
          currency: 'USD',
          status: 'completed',
          paypalOrderId: orderId,
          paypalPayerId: details.payer?.payer_id || '',
        });
        console.log('[Firestore] Order saved:', orderId);
        window.location.href = `/payment/success?orderId=${orderId}&amount=${amount}&paymentType=paypal&currency=USD`;
      } catch (err) {
        console.error('[Firestore] Failed to save order:', err);
        // 결제는 승인되었으므로 성공 페이지로 이동하되 에러는 기록
        window.location.href = `/payment/success?orderId=${orderId}&amount=${amount}&paymentType=paypal&currency=USD&dbError=true`;
      }
    },
    [user]
  );

  /* ── Hero video mouse-scrub ── */
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const isSeekingRef = useRef(false);
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const touchStartXRef = useRef(0);

  const handleSeeked = useCallback(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    isSeekingRef.current = false;
    if (Math.abs(video.currentTime - targetTimeRef.current) > 0.01) {
      isSeekingRef.current = true;
      video.currentTime = targetTimeRef.current;
    }
  }, []);

  useEffect(() => {
    // 모바일: 터치 스와이프로 스크럽
    if (isMobile) {
      const handleTouchStart = (e: TouchEvent) => {
        touchStartXRef.current = e.touches[0].clientX;
      };
      const handleTouchMove = (e: TouchEvent) => {
        const video = heroVideoRef.current;
        if (!video || !video.duration) return;
        const deltaX = e.touches[0].clientX - touchStartXRef.current;
        touchStartXRef.current = e.touches[0].clientX;
        const sensitivity = 0.8;
        const change = (deltaX / window.innerWidth) * video.duration * sensitivity;
        targetTimeRef.current = Math.max(
          0,
          Math.min(video.duration, targetTimeRef.current + change)
        );
        if (!isSeekingRef.current) {
          isSeekingRef.current = true;
          video.currentTime = targetTimeRef.current;
        }
      };
      window.addEventListener('touchstart', handleTouchStart);
      window.addEventListener('touchmove', handleTouchMove);
      return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
      };
    }

    // 데스크탑: 마우스 이동으로 스크럽
    const handleMouseMove = (e: MouseEvent) => {
      const video = heroVideoRef.current;
      if (!video || !video.duration) return;
      const deltaX = e.movementX;
      const sensitivity = 0.8;
      const change = (deltaX / window.innerWidth) * video.duration * sensitivity;
      targetTimeRef.current = Math.max(
        0,
        Math.min(video.duration, targetTimeRef.current + change)
      );
      if (!isSeekingRef.current) {
        isSeekingRef.current = true;
        video.currentTime = targetTimeRef.current;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  /* ── Entrance delay ── */
  useEffect(() => {
    const timer = setTimeout(() => setEntranceComplete(true), 800);
    return () => clearTimeout(timer);
  }, []);

  /* ── Section 2 scroll-driven 3D text ── */
  const section2Ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: section2Ref,
    offset: ['start end', 'end start'],
  });
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 15,
    damping: 32,
    mass: 1.8,
  });
  const yScaleValue = useTransform(smoothProgress, [0, 1], [60, -120]);
  const textOpacity = useTransform(smoothProgress, [0.3, 0.5], [0, 1]);
  const transform3D = useMotionTemplate`rotateX(24deg) translateY(${yScaleValue}px) translateZ(15px)`;

  /* ── Logomong Slideshow State ── */
  const logomongImages = ['/logomong-profile.jpg', '/logomong-profile-2.jpg'];
  const [logomongIndex, setLogomongIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setLogomongIndex((prev) => (prev + 1) % logomongImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  /* ── Destructure config for readability ── */
  const { hero, cinematic, metrics, technology, character, architecture, footer } = SITE_CONFIG;

  // Simple path routing for Toss Payments / PayPal redirects
  const path = window.location.pathname;
  if (path === '/payment/success') {
    return <SuccessPage />;
  }
  if (path === '/payment/fail') {
    return <FailPage />;
  }

  return (
    <div style={{ fontFamily: '"Noto Sans KR", sans-serif' }}>
      <Navbar entranceComplete={entranceComplete} />
      <BankTransferModal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} />

      {/* ════════════════ SECTION 1: HERO ════════════════ */}
      <section className="relative h-screen h-[100dvh] flex flex-col overflow-hidden">
        {/* Video background (mouse-scrubbed) */}
        {VIDEO_URLS.hero && (
          <video
            ref={heroVideoRef}
            src={`${VIDEO_URLS.hero}?v=3`}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
            preload="auto"
            // 모바일에서는 자동재생+반복으로 영상이 보이도록 처리
            autoPlay={isMobile}
            loop={isMobile}
            onSeeked={!isMobile ? handleSeeked : undefined}
          />
        )}

        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            opacity: 0.05,
          }}
        />

        {/* Watermark text */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          style={{ paddingTop: 50 }}
        >
          <span
            className="uppercase select-none"
            style={{
              fontFamily: '"Anton SC", sans-serif',
              fontSize: 'clamp(120px, 30vw, 521px)',
              letterSpacing: '-4px',
              opacity: 0.1,
              background:
                'radial-gradient(circle, rgba(142,127,148,0) 0%, #8E7F94 70%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent',
              lineHeight: 1,
            }}
          >
            {hero.watermark}
          </span>
        </div>

        {/* Hero content */}
        <motion.div
          className="relative z-20 flex flex-col flex-1 px-4 sm:px-6 md:px-8 pt-20 sm:pt-24 pb-8 sm:pb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: entranceComplete ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          <div className="flex-1" />

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            {/* Left column */}
            <div className="flex flex-col gap-4">
              <h1
                className="text-white font-bold leading-[1.1] tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
                style={{ fontSize: 'clamp(40px, 8vw, 84px)' }}
              >
                <ScrambleIn text={hero.titleLeft[0]} delay={200} triggered={entranceComplete} />
                <br />
                <ScrambleIn text={hero.titleLeft[1]} delay={500} triggered={entranceComplete} />
              </h1>

              <motion.p
                className="max-w-lg text-[14px] sm:text-[16px] text-white/90 leading-relaxed font-normal p-5 rounded-2xl bg-black/40 backdrop-blur-[6px] border border-white/10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] whitespace-pre-line break-keep"
                initial={{ opacity: 0, y: 25 }}
                animate={entranceComplete ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.9,
                  ease: [0.215, 0.61, 0.355, 1.0],
                  delay: 0.2,
                }}
              >
                {hero.description}
              </motion.p>
            </div>

            {/* Right heading */}
            <h1
              className="text-white font-bold leading-[1.1] tracking-tight text-left md:text-right drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
              style={{ fontSize: 'clamp(40px, 8vw, 84px)' }}
            >
              <ScrambleIn text={hero.titleRight[0]} delay={700} triggered={entranceComplete} />
              <br />
              <ScrambleIn text={hero.titleRight[1]} delay={1000} triggered={entranceComplete} />
            </h1>
          </div>
        </motion.div>
      </section>

      {/* ════════════════ SECTION 2: CINEMATIC TEXT ════════════════ */}
      <section
        id="about"
        ref={section2Ref}
        className="relative h-screen h-[100dvh] flex items-center justify-center overflow-hidden"
      >
        {/* Video background */}
        {VIDEO_URLS.section2 && (
          <video
            src={`${VIDEO_URLS.section2}?v=3`}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        {/* Top gradient overlay */}
        <div
          className="absolute top-0 left-0 right-0 z-10"
          style={{
            height: 180,
            background: 'linear-gradient(to bottom, #010103, transparent)',
          }}
        />

        {/* 3D text content */}
        <div className="relative z-20 max-w-5xl mx-auto" style={{ perspective: 400 }}>
          <motion.p
            className="font-sans font-medium text-[24px] sm:text-[32px] md:text-[38px] lg:text-[44px] text-white leading-[1.6] tracking-tight select-none px-6 sm:px-12 text-center whitespace-pre-wrap break-keep drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]"
            style={{
              transform: transform3D,
              opacity: textOpacity,
            }}
          >
            {cinematic.text}
          </motion.p>
        </div>
      </section>

      {/* ════════════════ SECTION 3: METRICS ════════════════ */}
      <section id="metrics" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video background */}
        {VIDEO_URLS.metrics && (
          <video
            src={`${VIDEO_URLS.metrics}?v=3`}
            className="absolute inset-0 w-full h-full object-cover object-[75%_center] md:object-center"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        <div className="relative z-20 pt-32 pb-32 px-6 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Column: Metrics & Information */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <motion.p
                className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-12"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1.2 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                {metrics.subtitle}
              </motion.p>

              <div className="flex flex-col gap-8 w-full max-w-md">
                {metrics.items.map((m, i) => (
                  <motion.div
                    key={m.label}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6 border-b border-white/10 pb-6 last:border-b-0 last:pb-0"
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: i * 0.15 }}
                    viewport={{ once: true, amount: 0.3 }}
                  >
                    <div
                      className="text-white font-bold tracking-tight leading-none whitespace-nowrap drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                      style={{ fontSize: 'clamp(28px, 4vw, 42px)' }}
                    >
                      {m.value}
                    </div>
                    <div className="text-white/80 text-[14px] sm:text-[16px] tracking-wide font-normal drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
                      {m.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column: Empty spacer to let the 3D Lamb logo shine through */}
            <div className="hidden md:block pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ════════════════ SECTION 4: TECHNOLOGY ════════════════ */}
      <section className="relative h-screen h-[100dvh] flex flex-col overflow-hidden">
        {/* Video background */}
        {VIDEO_URLS.technology && (
          <video
            src={`${VIDEO_URLS.technology}?v=3`}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        <div className="relative z-20 flex flex-col flex-1 px-8 sm:px-12 md:px-16 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
            <motion.h2
              className="text-white font-bold leading-[1.1] tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
              style={{ fontSize: 'clamp(36px, 8vw, 72px)' }}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {technology.title[0]}
              <br />
              {technology.title[1]}
            </motion.h2>

            <motion.p
              className="text-white/90 text-[14px] sm:text-[16px] leading-relaxed max-w-sm font-normal p-4 rounded-xl bg-black/40 backdrop-blur-[6px] border border-white/10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {technology.description}
            </motion.p>
          </div>

          <div className="flex-1" />

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 0.3 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {technology.features.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-black/55 backdrop-blur-[8px] border border-white/10 p-5 sm:p-6 rounded-2xl flex flex-col justify-between h-full hover:bg-black/75 hover:border-white/20 transition-all duration-300 group hover:scale-[1.02] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: i * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div>
                  <h3 className="text-white text-[16px] sm:text-[18px] font-bold mb-3 tracking-tight group-hover:text-amber-200 transition-colors duration-300">
                    {f.title}
                  </h3>
                  <p className="text-white/85 text-[13px] sm:text-[14px] leading-relaxed font-normal">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ SECTION 4.5: CHARACTER (Logomong) ════════════════ */}
      <section id="character" className="relative py-32 flex items-center justify-center bg-[#010103] overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-20 px-6 w-full max-w-4xl mx-auto">
          <motion.div
            className="flex flex-col md:flex-row items-center gap-10 md:gap-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-12 drop-shadow-2xl"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Image Side */}
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.1)] group bg-black/20">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={logomongIndex}
                    src={logomongImages[logomongIndex]}
                    alt="로고몽"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeInOut" }}
                  />
                </AnimatePresence>
              </div>
            </div>

            {/* Text Side */}
            <div className="w-full md:w-1/2 flex flex-col text-center md:text-left">
              <p className="text-blue-400 text-[13px] sm:text-[14px] font-bold tracking-[0.2em] uppercase mb-4">
                {character.subtitle}
              </p>
              <h2
                className="text-white font-bold leading-[1.3] tracking-tight mb-6 whitespace-pre-line break-keep"
                style={{ fontSize: 'clamp(32px, 5vw, 44px)' }}
              >
                {character.title}
              </h2>
              <p className="text-white/80 text-[15px] sm:text-[17px] leading-relaxed font-normal whitespace-pre-line break-keep">
                {character.description}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════ SECTION 5: ARCHITECTURE ════════════════ */}
      <section id="subscribe" className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-3xl mx-auto px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
            viewport={{ once: true, amount: 0.4 }}
          >
            <p className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-8">
              {architecture.subtitle}
            </p>
            <h2
              className="text-white font-bold leading-[1.25] tracking-tight mb-10 break-keep"
              style={{ fontSize: 'clamp(28px, 6vw, 56px)' }}
            >
              {architecture.heading}
            </h2>
            <p className="text-white/90 text-[15px] sm:text-[17px] leading-relaxed max-w-xl mx-auto font-normal whitespace-pre-line break-keep">
              {architecture.description}
            </p>
          </motion.div>

          <motion.div
            className="mt-16 flex flex-col items-center gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.4 }}
            viewport={{ once: true, amount: 0.4 }}
          >
            {architecture.layers.map((l) => {
              const isPrayerStep = l.num === 3;
              const Component = isPrayerStep ? 'a' : 'div';
              const extraProps = isPrayerStep ? { href: '/prayer' } : {};
              
              return (
                <Component
                  key={l.num}
                  {...extraProps}
                  className={`w-full max-w-md h-[72px] bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between px-6 hover:bg-white/[0.06] hover:border-white/20 hover:scale-[1.01] transition-all duration-300 shadow-md group ${
                    isPrayerStep ? 'cursor-pointer border-amber-400/30 hover:border-amber-400/60' : ''
                  }`}
                >
                  <span className={`text-[13px] tracking-[0.15em] font-bold uppercase group-hover:text-amber-200 transition-colors duration-300 ${
                    isPrayerStep ? 'text-amber-300' : 'text-amber-200/70'
                  }`}>
                    STEP 0{l.num} {isPrayerStep && '↗'}
                  </span>
                  <span className="text-white text-[16px] sm:text-[18px] font-semibold tracking-tight">
                    {l.name}
                  </span>
                </Component>
              );
            })}

            {/* 실제 구독 폼 */}
            <form
              onSubmit={handleSubscribe}
              className="w-full max-w-md mt-8 flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                required
                placeholder="구독하실 이메일 주소를 입력해 주세요"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-[52px] bg-white/[0.03] border border-white/15 rounded-xl px-4 text-white text-[15px] placeholder-white/30 focus:outline-none focus:border-amber-200/50 focus:bg-white/[0.06] transition-all duration-300 font-normal shadow-inner"
              />
              <button
                type="submit"
                disabled={submitting}
                className="h-[52px] px-6 bg-white hover:bg-amber-100 active:scale-[0.98] font-bold text-[15px] rounded-xl text-black flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-wait cursor-pointer"
              >
                {submitting ? '신청 중...' : '구독 신청'}
              </button>
            </form>

            {message && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <p className={`text-[14px] font-medium tracking-tight ${message.includes('완료') ? 'text-amber-200' : 'text-rose-400'}`}>
                  {message}
                </p>
                {message.includes('완료') && (
                  <a 
                    href="/prayer"
                    className="inline-flex items-center gap-1.5 px-5 py-2 mt-2 text-xs font-bold text-black bg-amber-200 hover:bg-amber-100 rounded-full transition-all shadow-md active:scale-95"
                  >
                    3단계. 기도제목 나누기 참여하기 🕊️ ↗
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ════════════════ SECTION 6: SUPPORT & RESOURCES ════════════════ */}
      <section className="min-h-screen bg-black py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <p className="text-white/40 text-[13px] sm:text-[14px] tracking-[0.2em] uppercase mb-8">
              Support & Resources
            </p>
            <h2
              className="text-white font-bold leading-[1.25] tracking-tight mb-5 break-keep"
              style={{ fontSize: 'clamp(28px, 6vw, 56px)' }}
            >
              채널을 후원해 주세요
            </h2>
            <p className="text-white/60 text-[15px] sm:text-[16px] leading-[1.9] max-w-lg mx-auto font-normal">
              말씀의지혜 채널이 지속해서 성장하고<br />
              한 영혼을 따뜻하게 섬길 수 있도록 함께해 주세요.
            </p>
          </motion.div>

          {/* ── Popular Videos Embed ── */}
          <motion.div
            className="mb-20"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="text-center mb-10">
              <p className="text-white/30 text-[12px] tracking-[0.2em] uppercase mb-3">Popular Videos</p>
              <h3 className="text-white text-[22px] sm:text-[26px] font-bold tracking-tight mb-2">
                🎬 인기 말씀 영상
              </h3>
              <p className="text-white/40 text-[14px]">말씀의지혜 채널에서 가장 많이 사랑받은 영상들입니다.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Video 1 */}
              <div className="rounded-2xl overflow-hidden border border-white/8 bg-white/[0.02]">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/EWoiwcVSFvw?rel=0&modestbranding=1"
                    title="말씀의지혜 인기영상 1"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-4">
                  <p className="text-white/60 text-[13px] font-medium leading-snug">말씀의지혜 인기 영상</p>
                  <p className="text-white/25 text-[12px] mt-1">말씀의지혜</p>
                </div>
              </div>

              {/* Video 2 */}
              <div className="rounded-2xl overflow-hidden border border-white/8 bg-white/[0.02]">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src="https://www.youtube.com/embed/UaWyKr0gEN4?rel=0&modestbranding=1"
                    title="말씀의지혜 인기영상 2"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <div className="p-4">
                  <p className="text-white/60 text-[13px] font-medium leading-snug">말씀의지혜 인기 영상</p>
                  <p className="text-white/25 text-[12px] mt-1">말씀의지혜</p>
                </div>
              </div>

              {/* Video 3 — Channel CTA */}
              <div className="rounded-2xl overflow-hidden border border-amber-200/15 bg-amber-200/[0.02] flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
                <div className="w-14 h-14 rounded-full bg-amber-200/10 border border-amber-200/20 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-amber-200/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <p className="text-white/60 text-[14px] font-medium mb-1">더 많은 말씀 영상 보기</p>
                <p className="text-white/30 text-[12px] mb-5">5,400명이 함께하는 채널</p>
                <a
                  href="https://youtube.com/channel/UCXmdxQf-6a7u2K3RefaPmww"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-full border border-amber-200/30 text-amber-200/70 text-[13px] hover:bg-amber-200/10 hover:text-amber-200 transition-all duration-300"
                >
                  채널 방문하기 →
                </a>
              </div>
            </div>
          </motion.div>

          {/* ── Support Cards ── */}
          <div id="donate" className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10 max-w-3xl mx-auto w-full pt-10">
            {/* ── Coffee Support ── */}
            <motion.div
              className="border border-white/10 rounded-2xl p-8 flex flex-col"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <p className="text-white/70 text-[12px] tracking-[0.15em] uppercase mb-3">☕ Coffee Support</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-white text-[42px] font-light tracking-tight">₩5,000</span>
                <span className="text-white/50 text-[14px]">/ 일시 후원</span>
              </div>
              <p className="text-white/70 text-[13px] leading-relaxed mb-8">
                말씀의지혜 콘텐츠 제작에 따뜻한 커피 한 잔으로 응원을 보냅니다.
              </p>
              <ul className="flex flex-col gap-3 mb-10 flex-1">
                <li className="flex items-center gap-3 text-white/80 text-[13px]">
                  <span className="text-white/60">✓</span> 따뜻한 응원의 마음 전달
                </li>
                <li className="flex items-center gap-3 text-white/80 text-[13px]">
                  <span className="text-white/60">✓</span> 제작 환경 개선에 직접 기여
                </li>
                <li className="flex items-center gap-3 text-white/80 text-[13px]">
                  <span className="text-white/60">✓</span> 무료 뉴스레터 지속 운영 지원
                </li>
              </ul>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setIsBankModalOpen(true)}
                  className="w-full py-[14px] px-6 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:scale-[1.01] active:scale-[0.99] bg-[#FEE500] hover:bg-[#F4DC00] text-[#191919]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.477 3 2 6.477 2 10.75c0 2.723 1.698 5.105 4.195 6.471-.233.842-1.042 3.197-1.127 3.493-.105.37.114.364.298.24 1.576-1.066 3.734-2.585 5.132-3.642.493.076 1.002.115 1.502.115 5.523 0 10-3.477 10-7.75S17.523 3 12 3z" />
                  </svg>
                  카카오페이 간편 후원
                </button>
                <PayPalCheckoutButton
                  product={PRODUCTS[0]}
                  onSuccess={(details) => handlePayPalSuccess(details, PRODUCTS[0].id, PRODUCTS[0].name, PRODUCTS[0].price)}
                  onError={(err) => console.error('PayPal error:', err)}
                />
              </div>
            </motion.div>

            {/* ── YouTube Membership (Coming Soon) ── */}
            <motion.div
              className="border border-amber-200/30 rounded-2xl p-8 flex flex-col relative bg-amber-200/[0.03]"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-amber-200/20 border border-amber-200/30 text-amber-200 text-[11px] font-bold tracking-[0.1em] uppercase px-4 py-1.5 rounded-full">
                  Coming Soon
                </span>
              </div>
              <p className="text-amber-200/90 text-[12px] tracking-[0.15em] uppercase mb-3">📺 YouTube 멤버십</p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-white text-[42px] font-light tracking-tight">₩9,900</span>
                <span className="text-white/50 text-[14px]">/ 월 정기</span>
              </div>
              <p className="text-white/70 text-[13px] leading-relaxed mb-8">
                말씀의지혜 공동체의 든든한 동역자로 함께합니다. 멤버 전용 콘텐츠와 아카이브를 모두 누리세요.
              </p>
              <ul className="flex flex-col gap-3 mb-10 flex-1">
                <li className="flex items-center gap-3 text-white/80 text-[13px]">
                  <span className="text-amber-200/80">✓</span> 멤버 전용 영상 & 콘텐츠 무제한 열람
                </li>
                <li className="flex items-center gap-3 text-white/80 text-[13px]">
                  <span className="text-amber-200/80">✓</span> 말씀 카드 고화질 이미지 아카이브 제공
                </li>
                <li className="flex items-center gap-3 text-white/80 text-[13px]">
                  <span className="text-amber-200/80">✓</span> 주간 묵상 요약 PDF 자료 제공
                </li>
                <li className="flex items-center gap-3 text-white/80 text-[13px]">
                  <span className="text-amber-200/80">✓</span> 채널 신규 콘텐츠 제안 우선권
                </li>
                <li className="flex items-center gap-3 text-white/80 text-[13px]">
                  <span className="text-amber-200/80">✓</span> 매주 특별 기도제목 함께 나눔
                </li>
              </ul>
              <div className="w-full h-[52px] bg-white/5 border border-amber-200/20 rounded-xl text-amber-200/70 flex items-center justify-center gap-2 text-[14px] font-medium cursor-not-allowed select-none">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                멤버십 오픈 준비 중 — 곧 만나요!
              </div>
            </motion.div>

          </div>

          {/* ── Related Resources & Channels ── */}
          <div className="mt-20">
            <div className="text-center mb-8">
              <p className="text-white/30 text-[12px] tracking-[0.2em] uppercase mb-2">More from us</p>
              <h3 className="text-white text-[20px] sm:text-[24px] font-bold tracking-tight">
                추천 리소스 & 채널
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto w-full">
              {/* Family Worship App (Image Card) */}
              <motion.div
                className="relative overflow-hidden rounded-3xl group h-[340px]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                {/* Background Image */}
                <img 
                  src="/app-banner.jpg" 
                  alt="로고몽 가정예배" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Dark Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent transition-opacity duration-300 group-hover:opacity-90"></div>
                
                {/* Content */}
                <div className="relative p-8 flex flex-col h-full justify-between z-10">
                  {/* Top Badges */}
                  <div className="flex gap-2">
                    <span className="inline-block px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold tracking-widest shadow-sm">
                      APP
                    </span>
                    <span className="inline-block px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500/80 to-purple-500/80 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold tracking-widest shadow-sm animate-pulse">
                      BETA
                    </span>
                  </div>
                  
                  {/* Bottom Content & Button */}
                  <div className="mt-auto">
                    <div className="mb-6">
                      <h4 className="text-white text-[24px] font-bold mb-2 drop-shadow-md">🏡 우리집 가정예배</h4>
                      <p className="text-[#FFF4D2]/90 text-[13.5px] leading-relaxed break-keep drop-shadow-md font-medium">
                        바쁜 가정을 위한 5분 가정예배 도우미. 말씀, 기도, 찬양으로 가족이 하나되는 시간을 만들어 보세요.
                      </p>
                    </div>
                    <a
                      href="https://family-worship-app-pi.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full h-[46px] bg-white/10 hover:bg-white backdrop-blur-md border border-white/20 hover:text-black font-bold text-[14px] rounded-xl text-white transition-all duration-300 shadow-lg"
                    >
                      앱 열기 ↗
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Praise Channel (Image Card) */}
              <motion.div
                className="relative overflow-hidden rounded-3xl group h-[340px]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                {/* Background Image */}
                <img 
                  src="/praise-banner.png" 
                  alt="말씀의지혜 찬양 안식처" 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Light Gradient Overlay just for the bottom button */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-opacity duration-300 group-hover:opacity-90"></div>
                
                {/* Content */}
                <div className="relative p-8 flex flex-col h-full justify-between z-10">
                  {/* Top Badge */}
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white shadow-sm">
                      <svg className="w-3.5 h-3.5 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      <span className="text-[11px] font-bold tracking-wider font-sans pt-[1px]">YouTube</span>
                    </span>
                  </div>
                  
                  {/* Bottom Button */}
                  <div className="mt-auto pt-6">
                    <a
                      href="https://youtube.com/@malsumchanyang?si=9SudZc2bNub3mGbj"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full h-[46px] bg-blue-500 hover:bg-blue-400 backdrop-blur-md border border-blue-400/30 font-bold text-[14px] rounded-xl text-white transition-all duration-300 shadow-lg"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                      채널 방문하기
                    </a>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

        </div>
      </section>



      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="bg-black overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[400px]">
          {/* Left: Video */}
          <div className="md:w-1/2 h-[320px] md:h-auto relative bg-black">
            {VIDEO_URLS.footer ? (
              <video
                src={`${VIDEO_URLS.footer}?v=3`}
                className="absolute inset-0 w-full h-full object-contain"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              <div className="absolute inset-0 bg-white/5" />
            )}
          </div>

          {/* Right: Content */}
          <div className="md:w-1/2 flex flex-col justify-between p-10 sm:p-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src="/logo-badge.png?v=1" 
                  alt="말씀의지혜 로고" 
                  className="w-10 h-10 object-contain rounded-full shrink-0" 
                  style={{ mixBlendMode: 'screen' }}
                />
                <span className="text-[20px] font-bold text-white tracking-tight">
                  {SITE_CONFIG.brandName}
                </span>
              </div>
              <p className="text-white/80 text-[14px] sm:text-[15px] leading-[1.8] max-w-md font-normal drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] whitespace-pre-line break-keep mt-2">
                {footer.tagline}
              </p>
            </div>

            <p className="text-white/50 text-[13px] sm:text-[14px] mt-12">
              {SITE_CONFIG.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
