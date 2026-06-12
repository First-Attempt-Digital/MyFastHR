import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SplitText = ({
  text = '',
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete
}) => {
  const ref = useRef(null);
  const animationCompletedRef = useRef(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      const el = ref.current;
      const targets = el.querySelectorAll('.split-item');

      if (!targets.length) return;

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign =
        marginValue === 0
          ? ''
          : marginValue < 0
            ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      gsap.fromTo(
        targets,
        { ...from },
        {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          scrollTrigger: {
            trigger: el,
            start,
            once: true,
            fastScrollEnd: true,
            anticipatePin: 0.4
          },
          onComplete: () => {
            animationCompletedRef.current = true;
            onLetterAnimationComplete?.();
          },
          willChange: 'transform, opacity',
          force3D: true
        }
      );
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded
      ],
      scope: ref
    }
  );

  const renderContent = () => {
    if (splitType === 'words') {
      return text.split(' ').map((word, index, arr) => (
        <span
          key={index}
          className="split-item split-word inline-block will-change-[transform,opacity]"
        >
          {word}
          {index < arr.length - 1 && '\u00A0'}
        </span>
      ));
    }

    // Default 'chars'
    return text.split(' ').map((word, wordIndex, wordArr) => (
      <span key={wordIndex} className="inline-block" style={{ whiteSpace: 'nowrap' }}>
        {word.split('').map((char, charIndex) => (
          <span
            key={charIndex}
            className="split-item split-char inline-block will-change-[transform,opacity]"
          >
            {char}
          </span>
        ))}
        {wordIndex < wordArr.length - 1 && (
          <span className="inline-block will-change-[transform,opacity]">&nbsp;</span>
        )}
      </span>
    ));
  };

  const Tag = tag || 'p';
  const style = {
    textAlign,
    overflow: 'visible',
    display: 'inline-block',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity'
  };

  return (
    <Tag ref={ref} style={style} className={`split-parent ${className}`}>
      {renderContent()}
    </Tag>
  );
};

export default SplitText;
