import { useEffect, useState } from 'react';

type SplashProps = {
  onFinish: () => void;
};

const images = [
  '/images/2i.avif',
  '/images/3i.avif',
  '/images/pic1.avif'
];

const Splash = ({ onFinish }: SplashProps) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (index < images.length - 1) {
        setIndex((prev) => prev + 1);
      } else {
        localStorage.setItem('hasSeenSplash', 'true');
        onFinish();
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [index, onFinish]);

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center overflow-hidden">
      <img
        src={images[index]}
        alt={`Splash ${index + 1}`}
        className="max-h-full max-w-full object-contain"
        style={{
          transition: 'opacity 0.5s ease',
          opacity: 1
        }}
      />
    </div>
  );
};

export default Splash;
