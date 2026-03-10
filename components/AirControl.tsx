
import React, { useEffect, useRef, useState } from 'react';

declare const Hands: any;
declare const Camera: any;

interface AirControlProps {
  isActive: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AirControl: React.FC<AirControlProps> = ({ isActive, activeTab, onTabChange }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const [isMinimized, setIsMinimized] = useState(window.innerWidth < 768);
  const [debugMsg, setDebugMsg] = useState('Pronto');
  const [hasCameraError, setHasCameraError] = useState(false);
  const [isMobile] = useState(window.innerWidth < 768);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);

  // Refs de Estado, Estabilização e Movimento
  const currentPosRef = useRef({ x: 0, y: 0 });
  const targetPosRef = useRef({ x: 0, y: 0 });
  const lastRawYRef = useRef<number | null>(null);
  const pinchBufferRef = useRef<number>(0);
  const isClickingRef = useRef(false);
  const isScrollingRef = useRef(false);
  const pinchStartTimeRef = useRef<number>(0);
  const lastGestureTime = useRef(0);
  const lastDetectionTime = useRef(Date.now());
  const dwellTimerRef = useRef<number | null>(null);

  const tabs = ['dashboard', 'map', 'notifications', 'clients', 'agenda', 'reports', 'finance'];
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '←'],
    ['SPACE', 'LIMPAR', 'FECHAR']
  ];

  const handleAirType = (key: string) => {
    const target = activeInputRef.current || document.activeElement as HTMLInputElement;
    if (!target || !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

    if (key === '←') target.value = target.value.slice(0, -1);
    else if (key === 'SPACE') target.value += ' ';
    else if (key === 'LIMPAR') target.value = '';
    else if (key === 'FECHAR') setHoveredKey(null);
    else target.value += key;
    
    target.dispatchEvent(new Event('input', { bubbles: true }));
    if ('vibrate' in navigator) navigator.vibrate(30);
  };

  const resetAirState = () => {
    isClickingRef.current = false;
    isScrollingRef.current = false;
    pinchStartTimeRef.current = 0;
    pinchBufferRef.current = 0;
    lastRawYRef.current = null;
    setHoveredKey(null);
    const cursor = document.getElementById('air-cursor');
    if (cursor) {
      cursor.classList.remove('clicking', 'active-click', 'scrolling');
      if (!isListening) cursor.classList.remove('listening');
    }
  };

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (activeInputRef.current) {
          activeInputRef.current.value = transcript;
          activeInputRef.current.dispatchEvent(new Event('input', { bubbles: true }));
        }
      };
      recognition.onend = () => {
        setIsListening(false);
        setDebugMsg('Concluído');
        document.getElementById('air-cursor')?.classList.remove('listening');
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = (target: HTMLInputElement | HTMLTextAreaElement) => {
    if (recognitionRef.current && !isListening) {
      activeInputRef.current = target;
      setIsListening(true);
      setDebugMsg('Ouvindo...');
      document.getElementById('air-cursor')?.classList.add('listening');
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  useEffect(() => {
    let animationFrame: number;
    const updateCursorPosition = () => {
      const cursor = document.getElementById('air-cursor');
      if (cursor && isActive) {
        const easing = isMobile ? 0.35 : 0.25;
        currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * easing;
        currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * easing;
        cursor.style.left = `${currentPosRef.current.x}px`;
        cursor.style.top = `${currentPosRef.current.y}px`;

        if (Date.now() - lastDetectionTime.current > 400) {
          resetAirState();
        }
      }
      animationFrame = requestAnimationFrame(updateCursorPosition);
    };
    if (isActive) animationFrame = requestAnimationFrame(updateCursorPosition);
    return () => cancelAnimationFrame(animationFrame);
  }, [isActive, isMobile]);

  // Dwell Logic for Keyboard
  useEffect(() => {
    if (hoveredKey) {
      setDwellProgress(0);
      const start = Date.now();
      dwellTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - start;
        const progress = Math.min((elapsed / 450) * 100, 100);
        setDwellProgress(progress);
        if (progress >= 100) {
          handleAirType(hoveredKey);
          clearInterval(dwellTimerRef.current!);
          setHoveredKey(null);
        }
      }, 16);
    } else {
      if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
      setDwellProgress(0);
    }
    return () => { if (dwellTimerRef.current) clearInterval(dwellTimerRef.current); };
  }, [hoveredKey]);

  useEffect(() => {
    const cursor = document.getElementById('air-cursor');
    if (!cursor) return;
    if (!isActive) {
      cursor.style.display = 'none';
      if (cameraRef.current) cameraRef.current.stop();
      return;
    }
    cursor.style.display = 'flex';

    const onResults = (results: any) => {
      lastDetectionTime.current = Date.now();
      
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        resetAirState();
        return;
      }

      const landmarks = results.multiHandLandmarks[0];
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];
      const middleTip = landmarks[12];
      const pinkyTip = landmarks[20];
      const palmBase = landmarks[0];

      const sensitivity = isMobile ? 1.8 : 1.4;
      let targetX = (1 - indexTip.x) * window.innerWidth * sensitivity - (window.innerWidth * (sensitivity - 1) / 2);
      let targetY = indexTip.y * window.innerHeight * sensitivity - (window.innerHeight * (sensitivity - 1) / 2);
      targetPosRef.current = { 
        x: Math.max(0, Math.min(window.innerWidth, targetX)), 
        y: Math.max(0, Math.min(window.innerHeight, targetY)) 
      };

      const element = document.elementFromPoint(currentPosRef.current.x, currentPosRef.current.y);
      if (element instanceof HTMLElement) {
        const key = element.getAttribute('data-air-key');
        if (key) setHoveredKey(key);
        else setHoveredKey(null);
      }

      const now = Date.now();
      const pinchDist = Math.sqrt(Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2));
      const isHandOpen = Math.abs(middleTip.y - palmBase.y) > (isMobile ? 0.18 : 0.22) && Math.abs(pinkyTip.y - palmBase.y) > (isMobile ? 0.15 : 0.18);
      
      if (isHandOpen && !isClickingRef.current && !isListening && !hoveredKey) {
        if (!isScrollingRef.current) {
          isScrollingRef.current = true;
          cursor.classList.add('scrolling');
          lastRawYRef.current = indexTip.y;
        }

        if (lastRawYRef.current !== null) {
          const dy = indexTip.y - lastRawYRef.current;
          const scrollFactor = isMobile ? 2200 : 1500;
          if (Math.abs(dy) > 0.002) {
            window.scrollBy({ top: dy * scrollFactor, behavior: 'auto' });
            setDebugMsg('Rolando');
          }
        }
        lastRawYRef.current = indexTip.y;
        return;
      } else {
        if (isScrollingRef.current) {
           isScrollingRef.current = false;
           cursor.classList.remove('scrolling');
           lastRawYRef.current = null;
        }
      }

      const PINCH_THRESHOLD = 0.05;
      if (pinchDist < PINCH_THRESHOLD) {
        pinchBufferRef.current++;
        if (pinchBufferRef.current > 3 && !isClickingRef.current) {
          isClickingRef.current = true;
          pinchStartTimeRef.current = now;
          cursor.classList.add('clicking');
          setDebugMsg('Pressionando');
        }

        if (isClickingRef.current && now - pinchStartTimeRef.current > 1200 && !isListening) {
          const elementUnder = document.elementFromPoint(currentPosRef.current.x, currentPosRef.current.y);
          if (elementUnder instanceof HTMLInputElement || elementUnder instanceof HTMLTextAreaElement) {
            startListening(elementUnder);
            resetAirState();
          }
        }
      } else {
        if (isClickingRef.current) {
          if (now - pinchStartTimeRef.current < 1000) {
            cursor.classList.add('active-click');
            const elementUnder = document.elementFromPoint(currentPosRef.current.x, currentPosRef.current.y);
            if (elementUnder) (elementUnder as HTMLElement).click();
            setDebugMsg('Clique OK');
            setTimeout(() => cursor.classList.remove('active-click'), 150);
          }
        }
        isClickingRef.current = false;
        pinchBufferRef.current = 0;
        cursor.classList.remove('clicking');
      }

      if (now - lastGestureTime.current > 1200 && !isClickingRef.current && !isScrollingRef.current && !isListening && !hoveredKey) {
        const dx = (indexTip.x - 0.5);
        if (Math.abs(dx) > 0.38) {
          const currentIndex = tabs.indexOf(activeTab);
          if (dx > 0 && currentIndex > 0) {
            onTabChange(tabs[currentIndex - 1]);
            lastGestureTime.current = now;
            setDebugMsg('Anterior');
          } else if (dx < 0 && currentIndex < tabs.length - 1) {
            onTabChange(tabs[currentIndex + 1]);
            lastGestureTime.current = now;
            setDebugMsg('Próxima');
          }
        }
      }
    };

    setHasCameraError(false);
    handsRef.current = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsRef.current.setOptions({
      maxNumHands: 1,
      modelComplexity: 0,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    handsRef.current.onResults(onResults);

    if (videoRef.current) {
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          if (isActive && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current! });
          }
        },
        width: 640,
        height: 480
      });
      cameraRef.current.start().catch((err: any) => {
        console.error("Camera access failed:", err);
        setHasCameraError(true);
        setDebugMsg('Câmera não detectada');
      });
    }

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      cursor.style.display = 'none';
      resetAirState();
    };
  }, [isActive, activeTab, isMinimized, isListening]);

  if (!isActive) return null;

  return (
    <>
      <div className={`fixed z-[300] transition-all duration-500 ease-in-out ${
        isMinimized 
          ? 'bottom-24 right-4 w-36 h-14 bg-baccarim-navy/90 backdrop-blur rounded-full shadow-2xl border border-baccarim-border/20' 
          : 'bottom-24 right-4 w-56 bg-baccarim-card rounded-[2.5rem] shadow-2xl border border-slate-100'
      } overflow-hidden flex flex-col`}>
        
        <div 
          className={`p-4 flex items-center justify-between cursor-pointer ${isMinimized ? 'h-full bg-transparent text-baccarim-text' : 'bg-baccarim-navy text-baccarim-text'}`}
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${hasCameraError ? 'bg-red-500' : isListening ? 'bg-baccarim-amber animate-ping' : 'bg-baccarim-blue animate-pulse'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Air Sensor</span>
          </div>
          <i className={`fas ${isMinimized ? 'fa-expand-alt' : 'fa-compress-alt'} text-[10px] opacity-40`}></i>
        </div>

        {!isMinimized && (
          <>
            <div className="relative aspect-video bg-slate-900">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] opacity-40 grayscale" autoPlay playsInline muted />
              {hasCameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-baccarim-text-muted p-4 text-center">
                  <i className="fas fa-video-slash text-2xl mb-2"></i>
                  <p className="text-[8px] font-black uppercase">Erro de Hardware</p>
                </div>
              )}
              {!hasCameraError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 border border-baccarim-border-hover rounded-full animate-ping"></div>
                </div>
              )}
            </div>

            <div className="p-5 bg-baccarim-card">
              <div className="flex flex-col items-center mb-4">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${hasCameraError ? 'bg-red-50 text-red-500' : isListening ? 'bg-amber-50 text-baccarim-amber' : 'bg-baccarim-hover text-baccarim-text-muted'}`}>
                  {debugMsg}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 border-t border-slate-50 pt-4">
                 <div className={`flex flex-col items-center transition-opacity ${isClickingRef.current ? 'opacity-100' : 'opacity-30'}`}>
                    <i className="fas fa-mouse-pointer text-[10px] text-baccarim-blue"></i>
                    <span className="text-[6px] font-bold mt-1 uppercase">Click</span>
                 </div>
                 <div className={`flex flex-col items-center transition-opacity ${isListening ? 'opacity-100' : 'opacity-30'}`}>
                    <i className="fas fa-microphone text-[10px] text-red-400"></i>
                    <span className="text-[6px] font-bold mt-1 uppercase">Voz</span>
                 </div>
                 <div className={`flex flex-col items-center transition-opacity ${isScrollingRef.current ? 'opacity-100' : 'opacity-30'}`}>
                    <i className="fas fa-arrows-up-down text-[10px] text-baccarim-blue"></i>
                    <span className="text-[6px] font-bold mt-1 uppercase">Scroll</span>
                 </div>
                 <div className="flex flex-col items-center opacity-30">
                    <i className="fas fa-exchange-alt text-[10px] text-baccarim-blue"></i>
                    <span className="text-[6px] font-bold mt-1 uppercase">Tabs</span>
                 </div>
              </div>
            </div>
          </>
        )}

        {isMinimized && (
          <div className="flex-1 flex items-center justify-center px-4 overflow-hidden">
             <p className="text-[9px] font-black text-baccarim-text-strong uppercase tracking-widest truncate">{debugMsg}</p>
          </div>
        )}
      </div>

      {/* Teclado Holográfico na Tela Principal (Dashboard) */}
      {isActive && activeTab === 'dashboard' && !hasCameraError && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[400] w-full max-w-4xl px-6 animate-in slide-in-from-bottom-20 duration-1000">
          <div className="bg-baccarim-hover backdrop-blur-3xl border border-baccarim-border-hover rounded-[3rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-4 px-6">
               <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-baccarim-blue rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-baccarim-text uppercase tracking-[0.3em]">Holographic Command Input</span>
               </div>
               <div className="text-[9px] text-baccarim-text-muted font-black uppercase tracking-widest">Dwell over keys to type</div>
            </div>

            <div className="space-y-2">
              {keyboardRows.map((row, rIdx) => (
                <div key={rIdx} className="flex justify-center gap-2">
                  {row.map(key => {
                    const isHovered = hoveredKey === key;
                    return (
                      <button
                        key={key}
                        data-air-key={key}
                        className={`
                          pointer-events-auto h-12 md:h-14 rounded-2xl text-[11px] font-black transition-all border relative overflow-hidden flex items-center justify-center shadow-xl
                          ${['SPACE', 'LIMPAR', 'FECHAR'].includes(key) ? 'px-8 flex-1' : 'w-12 md:w-14'}
                          ${isHovered ? 'bg-baccarim-blue text-baccarim-text border-baccarim-border/40 scale-110 z-10' : 'bg-black/40 text-baccarim-text/60 border-baccarim-border'}
                        `}
                      >
                        {isHovered && (
                          <div className="absolute bottom-0 left-0 h-1 bg-baccarim-card transition-all duration-75" style={{ width: `${dwellProgress}%` }}></div>
                        )}
                        <span className="relative z-10 pointer-events-none">{key === '←' ? <i className="fas fa-backspace"></i> : key}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AirControl;
