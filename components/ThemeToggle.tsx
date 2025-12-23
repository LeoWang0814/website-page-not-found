
import React, { useState, useEffect, useRef, useMemo } from 'react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: (status: boolean) => void;
  size?: number | string;
  ball?: 'cut-in' | 'gradient';
  halo?: 'flex' | 'linear';
  delay?: number | string;
  finish?: 'now' | 'delay';
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  isDark: ballStatus, 
  onToggle, 
  size = 48,
  ball = 'cut-in',
  halo = 'flex',
  delay = 2000,
  finish = 'now'
}) => {
  // Use String() to avoid narrowing issues and ensure consistent parsing of size prop.
  // This fixes the 'Property slice does not exist on type never' error by ensuring s is treated as a string.
  const parsedSize = useMemo(() => {
    const s = String(size);
    if (s.endsWith('px')) return s;
    return `${s}px`;
  }, [size]);

  // Ported State from Vue
  const [hoverStatus, setHoverStatus] = useState(false);
  const [shakeStatus, setShakeStatus] = useState(false);
  const [rotateStatus, setRotateStatus] = useState(false);
  const [meteorFallStatus, setMeteorFallStatus] = useState(false);
  
  const [twinkleData, setTwinkleData] = useState([
    { twinkleId: 1, twinkleInterval: null as any, twinkleShowStatus: false, twinkleTime: 1100 },
    { twinkleId: 3, twinkleInterval: null as any, twinkleShowStatus: false, twinkleTime: 1300 }
  ]);

  // Ported Refs for matching setTimeout/setInterval logic
  const dayHoverAnimationDelayId = useRef<any>(null);
  const shakeIntervalId = useRef<any>(null);
  const nightHoverAnimationStatus = useRef(false);
  const nightHoverAnimationDelayId = useRef<any>(null);
  const rotateIntervalId = useRef<any>(null);
  const meteorFallIntervalId = useRef<any>(null);

  // Exact function mapping from SunMoon.vue
  const dayHoverAnimation = () => {
    if (!ballStatus && !dayHoverAnimationDelayId.current && !shakeStatus) {
      dayHoverAnimationDelayId.current = setTimeout(() => {
        if (hoverStatus && !ballStatus) {
          setShakeStatus(true);
          shakeIntervalId.current = setInterval(() => {
            if (!hoverStatus || ballStatus) {
              setShakeStatus(false);
              clearInterval(shakeIntervalId.current);
            }
          }, 4000);
        }
      }, Number(delay));
    }
  };

  const dayHoverAnimationReset = () => {
    clearTimeout(dayHoverAnimationDelayId.current);
    dayHoverAnimationDelayId.current = null;
  };

  const nightHoverAnimation = () => {
    if (!nightHoverAnimationStatus.current && !nightHoverAnimationDelayId.current && ballStatus) {
      nightHoverAnimationDelayId.current = setTimeout(() => {
        if (hoverStatus && ballStatus) {
          nightHoverAnimationStatus.current = true;
          setRotateStatus(true);
          setMeteorFallStatus(true);
          setTwinkleData(prev => prev.map(t => ({ ...t, twinkleShowStatus: true })));
          
          // Replicate interval setup
          if (!rotateIntervalId.current) {
            rotateIntervalId.current = setInterval(() => {
              if (!hoverStatus || !ballStatus) {
                setRotateStatus(false);
                clearInterval(rotateIntervalId.current);
                rotateIntervalId.current = null;
              }
            }, 12000);
          }
          if (!meteorFallIntervalId.current) {
            meteorFallIntervalId.current = setInterval(() => {
              if (!hoverStatus || !ballStatus) {
                setMeteorFallStatus(false);
                clearInterval(meteorFallIntervalId.current);
                meteorFallIntervalId.current = null;
              }
            }, 6000);
          }
        } else {
          nightHoverAnimationReset();
        }
      }, Number(delay));
    }
  };

  const nightHoverAnimationReset = () => {
    clearTimeout(nightHoverAnimationDelayId.current);
    nightHoverAnimationDelayId.current = null;
    nightHoverAnimationStatus.current = false;
    if (finish === 'now') {
      setRotateStatus(false);
    }
  };

  const ballTrans = () => {
    const nextStatus = !ballStatus;
    onToggle(nextStatus);
    if (!nextStatus) { // going to day
      dayHoverAnimation();
      nightHoverAnimationReset();
    } else { // going to night
      nightHoverAnimation();
      dayHoverAnimationReset();
    }
  };

  const handleOver = () => {
    setHoverStatus(true);
    dayHoverAnimation();
    nightHoverAnimation();
  };

  const handleLeave = () => {
    setHoverStatus(false);
    nightHoverAnimationReset();
    dayHoverAnimationReset();
  };

  // Twinkle logic sync
  useEffect(() => {
    const timers: any[] = [];
    twinkleData.forEach((twink, idx) => {
      if (twink.twinkleShowStatus) {
        const interval = setInterval(() => {
          setTwinkleData(prev => prev.map((s, i) => 
            i === idx ? { ...s, twinkleId: (s.twinkleId + 3) % 11 } : s
          ));
        }, twink.twinkleTime);
        timers.push(interval);
      }
    });
    return () => timers.forEach(clearInterval);
  }, [twinkleData]);

  // Ported assets lists
  const cloudNearList = [
    { size: 1.2, top: "15%", right: "-13%" },
    { size: 1.3, top: "39%", right: "-5%" },
    { size: 1.0, top: "66%", right: "5%" },
    { size: 1.5, top: "80%", right: "26%" },
    { size: 1.2, top: "75%", right: "38%" },
    { size: 1.3, top: "83%", right: "55%" },
    { size: 1.3, top: "89%", right: "68%" },
  ];
  const cloudFarList = [
    { size: 1.2, top: "2%", right: "-5%" },
    { size: 1.4, top: "25%", right: "5%" },
    { size: 1.0, top: "37%", right: "10%" },
    { size: 1.5, top: "58%", right: "30%" },
    { size: 1.2, top: "55%", right: "38%" },
    { size: 1.3, top: "70%", right: "57%" },
    { size: 1.1, top: "77%", right: "66%" },
  ];
  const starList = [
    { id: 0, size: 1.5, top: '13%', left: '20%' },
    { id: 1, size: 0.5, top: '28%', left: '10%' },
    { id: 2, size: 0.7, top: '43%', left: '22%' },
    { id: 3, size: 0.3, top: '68%', left: '15%' },
    { id: 4, size: 0.2, top: '75%', left: '11%' },
    { id: 5, size: 0.4, top: '78%', left: '22%' },
    { id: 6, size: 1.3, top: '21%', left: '53%' },
    { id: 7, size: 0.4, top: '20%', left: '42%' },
    { id: 8, size: 0.4, top: '48%', left: '37%' },
    { id: 9, size: 0.6, top: '53%', left: '52%' },
    { id: 10, size: 0.8, top: '73%', left: '46%' },
  ];
  const craterList = [
    { id: 1, size: 0.18, top: '15%', left: '38%' },
    { id: 2, size: 0.32, top: '46%', left: '13%' },
    { id: 3, size: 0.22, top: '61%', left: '61%' },
  ];

  const ifTwinkle = (id: number) => {
    return twinkleData.some(t => t.twinkleShowStatus && id === t.twinkleId);
  };

  return (
    <div 
      className="button-box" 
      onClick={ballTrans} 
      onMouseOver={handleOver} 
      onMouseLeave={handleLeave}
      style={{
        '--box-height': parsedSize,
        '--box-width': `calc(${parsedSize} * 2.5)`,
        '--ball-size': `calc(${parsedSize} * 0.85)`,
        '--ball-margin': `calc(${parsedSize} * 0.1)`,
        '--near-cloud-size': `calc(${parsedSize} * 0.85)`,
        '--far-cloud-size': `calc(${parsedSize} * 0.85)`,
        '--star-size': `calc((${parsedSize} * 0.85) / 15)`,
      } as React.CSSProperties}
    >
      <style>{`
        .button-box {
          --move-duration: 1.2s;
          --opacity-duration: calc(var(--move-duration) / 1.8);
          --sky-duration: var(--move-duration);
          --near-cloud-duration: calc(var(--move-duration) * 1.2);
          --far-cloud-duration: calc(var(--move-duration) * 1.3);
          --twinkle-duration: 1s;
          height: var(--box-height);
          width: var(--box-width);
          clip-path: inset(0 round var(--box-height));
          font-size: calc(var(--box-height) / 10);
          display: flex;
          align-items: center;
          border-radius: calc(var(--box-height) / 2);
          overflow: hidden;
          cursor: pointer;
          z-index: 100;
          position: relative;
        }
        .sky { position: absolute; height: 100%; width: 100%; overflow: hidden; }
        .inner-shadow { position: absolute; height: 100%; width: 100%; border-radius: inherit; box-shadow: inset 0 0 0.5em rgba(0, 0, 0, 0.6); z-index: 4; }
        .day { height: 100%; width: 100%; background-color: rgb(70, 133, 196); transition: background-color var(--sky-duration); }
        .night { height: 100%; width: 100%; background-color: rgb(23, 30, 51); transition: background-color var(--sky-duration); }
        
        .star-cloud-box { position: absolute; height: 100%; width: 100%; overflow: hidden; }
        .star-box { position: absolute; height: 100%; width: 100%; transition: transform var(--move-duration) cubic-bezier(0.26, 0.97, 0.2, 1.08); }
        .star-move { transform: translateY(-100%); }
        .star { position: absolute; display: flex; justify-content: center; align-items: center; transition: var(--twinkle-duration); }
        .twinkle { transform: scale(0); }
        .meteor { position: absolute; width: 0.2%; height: 50%; background: linear-gradient(0deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1)); border-radius: 50%; transform: translate(calc(var(--box-height) * 1.75), calc(var(--box-height) * -0.35)) rotate(255deg); }
        .meteor-fall { animation: meteor-fall 6s linear infinite; }

        .cloud-box { position: absolute; height: 100%; width: 100%; }
        .cloud-near, .cloud-far { position: absolute; height: 100%; width: 100%; transition: transform var(--near-cloud-duration) cubic-bezier(0.49, 1.57, 0.04, 0.83); z-index: 2; }
        .cloud-far { transition-duration: var(--far-cloud-duration); transition-timing-function: cubic-bezier(0.49, 1.57, 0.28, 0.81); z-index: 1; }
        .cloud-far-move { transform: translateY(100%); }
        .cloud { position: absolute; border-radius: 50%; background-color: white; }
        .cloud-far .cloud { background-color: rgb(168, 197, 227); }
        .cloud-near-shake { animation: cloud-near-shake 4s linear infinite; }
        .cloud-far-shake { animation: cloud-far-shake 4s linear infinite; }

        .halo-box { position: absolute; display: flex; align-items: center; height: 100%; width: 100%; border-radius: inherit; overflow: hidden; }
        .halo-middle, .halo-inner, .halo-outer { position: absolute; border-radius: 50%; background-color: rgba(255, 255, 255, 0.08); z-index: 3; transition: all var(--move-duration) cubic-bezier(0.26, 0.97, 0.2, 1.08); }
        
        .halo-flex .halo-inner { height: calc(var(--box-height) * 1.47); width: calc(var(--box-height) * 1.47); }
        .halo-flex .halo-middle { height: calc(var(--box-height) * 1.77); width: calc(var(--box-height) * 1.77); }
        .halo-flex .halo-outer { height: calc(var(--box-height) * 2.07); width: calc(var(--box-height) * 2.07); }
        .halo-flex .halo-left { transform: translateX(calc(-1 * var(--ball-margin))); }
        .halo-flex .halo-right { transform: translateX(calc(var(--box-width) - 100% + var(--ball-margin))); }

        .ball-box { position: absolute; height: var(--ball-size); width: var(--ball-size); border-radius: 50%; }
        .ball-gradient, .ball-cut-in { position: absolute; height: 100%; width: 100%; border-radius: 50%; box-shadow: 0.3em 0.3em 0.5em rgba(0, 0, 0, 0.6); transition: transform var(--move-duration) cubic-bezier(0.26, 0.97, 0.2, 1.08); z-index: 5; }
        .to-left { transform: translateX(var(--ball-margin)); }
        .to-right { transform: translateX(calc(var(--box-width) - var(--ball-size) - var(--ball-margin))); }
        .sun { position: absolute; height: 100%; width: 100%; border-radius: 50%; background-color: rgb(243, 198, 43); box-shadow: inset 0.3em 0.3em 0.3em rgba(255, 255, 255, 0.8), inset -0.3em -0.3em 1em rgba(0, 0, 0, 0.4); z-index: 1; transition: opacity var(--opacity-duration); }
        .moon { position: absolute; height: 100%; width: 100%; border-radius: 50%; z-index: 1; transition: opacity var(--opacity-duration); }
        .ballHide { opacity: 0; }
        .moon-body { position: absolute; height: 100%; width: 100%; border-radius: 50%; background-color: rgb(195, 201, 211); }
        .moon-rotate { animation: moon-rotate 12s linear infinite; }
        .moon-shadow { position: absolute; height: 100%; width: 100%; border-radius: 50%; box-shadow: inset 0.3em 0.3em 0.3em rgba(255, 255, 255, 0.8), inset -0.3em -0.3em 1em rgba(0, 0, 0, 0.4); z-index: 2; }
        .moon-crater { position: absolute; border-radius: 50%; background-color: rgb(145, 151, 165); }
        .moon-crater::before { content: ''; position: absolute; border-radius: 50%; height: calc(100% - var(--ball-size) * 0.02); width: calc(100% - var(--ball-size) * 0.02); top: calc(var(--ball-size) * 0.01); left: calc(var(--ball-size) * 0.01); background-color: rgb(156, 159, 179); }
        
        .ball-cut-in { overflow: hidden; }
        .ball-cut-in .moon { transform: translateX(100%); transition: transform var(--opacity-duration); }
        .ball-cut-in .moon-cut-in { transform: translateX(0%); }

        @keyframes moon-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes meteor-fall {
            0% { transform: translate(calc(var(--box-height) * 1.75), calc(var(--box-height) * -0.35)) rotate(255deg); }
            20% { transform: translate(calc(var(--box-height) * 1.75), calc(var(--box-height) * -0.35)) rotate(255deg); }
            40% { transform: translate(calc(var(--box-height) * -0.625), calc(var(--box-height) * 0.3)) rotate(255deg); }
            100% { transform: translate(calc(var(--box-height) * -0.625), calc(var(--box-height) * 0.3)) rotate(255deg); }
        }
        @keyframes cloud-near-shake {
            0%, 50%, 100% { transform: translateY(0); }
            15%, 35% { transform: translateY(2.8%); }
            21%, 29% { transform: translateY(3.6%); }
            25% { transform: translateY(4%); }
            65%, 85% { transform: translateY(-2.8%); }
            71%, 79% { transform: translateY(-3.6%); }
            75% { transform: translateY(-4%); }
        }
        @keyframes cloud-far-shake {
            0%, 50%, 100% { transform: translateY(0); }
            18%, 32% { transform: translateY(1.7%); }
            25% { transform: translateY(2%); }
            68%, 82% { transform: translateY(-1.7%); }
            75% { transform: translateY(-2%); }
        }
      `}</style>

      <div className="sky">
        <div className="inner-shadow"></div>
        <div className={ballStatus ? 'night' : 'day'}></div>
      </div>

      <div className="star-cloud-box">
        <div className={`star-box ${!ballStatus ? 'star-move' : ''}`}>
          {starList.map(star => (
            <div 
              key={star.id} 
              className={`star ${ifTwinkle(star.id) ? 'twinkle' : ''}`}
              style={{ 
                height: `calc(var(--star-size) * ${star.size})`, 
                width: `calc(var(--star-size) * ${star.size})`, 
                top: star.top, 
                left: star.left 
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 100 100">
                <path d="M50,0 C62.5,37.5 62.5,37.5 100,50 C62.5,62.5 62.5,62.5 50,100 C37.5,62.5 37.5,62.5 0,50 C37.5,37.5 37.5,37.5 50,0" fill="white" />
              </svg>
            </div>
          ))}
          <div className={`meteor ${meteorFallStatus ? 'meteor-fall' : ''}`}></div>
        </div>
        <div className="cloud-box">
          <div className={`cloud-near ${ballStatus ? 'cloud-far-move' : ''}`}>
            {cloudNearList.map((cloud, idx) => (
              <div 
                key={idx} 
                className={`cloud ${shakeStatus ? 'cloud-near-shake' : ''}`}
                style={{
                  height: `calc(var(--near-cloud-size) / ${cloud.size})`,
                  width: `calc(var(--near-cloud-size) / ${cloud.size})`,
                  top: cloud.top,
                  right: cloud.right,
                }}
              />
            ))}
          </div>
          <div className={`cloud-far ${ballStatus ? 'cloud-far-move' : ''}`}>
            {cloudFarList.map((cloud, idx) => (
              <div 
                key={idx} 
                className={`cloud ${shakeStatus ? 'cloud-far-shake' : ''}`}
                style={{
                  height: `calc(var(--far-cloud-size) / ${cloud.size})`,
                  width: `calc(var(--far-cloud-size) / ${cloud.size})`,
                  top: cloud.top,
                  right: cloud.right,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="halo-box">
        {halo === 'linear' ? (
          <div className="halo-linear">
            <div className={`halo-middle ${!ballStatus ? 'halo-left' : 'halo-right'}`}></div>
          </div>
        ) : (
          <div className="halo-flex">
            <div className={`halo-inner ${!ballStatus ? 'halo-left' : 'halo-right'}`}></div>
            <div className={`halo-middle ${!ballStatus ? 'halo-left' : 'halo-right'}`}></div>
            <div className={`halo-outer ${!ballStatus ? 'halo-left' : 'halo-right'}`}></div>
          </div>
        )}
      </div>

      <div className="ball-box">
        {ball === 'gradient' ? (
          <div className={`ball-gradient ${!ballStatus ? 'to-left' : 'to-right'}`}>
            <div className={`sun ${ballStatus ? 'ballHide' : ''}`}></div>
            <div className={`moon ${!ballStatus ? 'ballHide' : ''}`}>
              <div className={`moon-body ${rotateStatus ? 'moon-rotate' : ''}`}>
                {craterList.map(crater => (
                  <div 
                    key={crater.id} 
                    className="moon-crater"
                    style={{
                      height: `calc(var(--ball-size) * ${crater.size})`, 
                      width: `calc(var(--ball-size) * ${crater.size})`,
                      top: crater.top, 
                      left: crater.left, 
                    }}
                  />
                ))}
              </div>
              <div className="moon-shadow"></div>
            </div>
          </div>
        ) : (
          <div className={`ball-cut-in ${!ballStatus ? 'to-left' : 'to-right'}`}>
            <div className="sun"></div>
            <div className={`moon ${ballStatus ? 'moon-cut-in' : ''}`}>
              <div className={`moon-body ${rotateStatus ? 'moon-rotate' : ''}`}>
                {craterList.map(crater => (
                  <div 
                    key={crater.id} 
                    className="moon-crater"
                    style={{
                      height: `calc(var(--ball-size) * ${crater.size})`, 
                      width: `calc(var(--ball-size) * ${crater.size})`,
                      top: crater.top, 
                      left: crater.left, 
                    }}
                  />
                ))}
              </div>
              <div className="moon-shadow"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeToggle;
