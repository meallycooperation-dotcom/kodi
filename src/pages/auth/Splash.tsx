import { useState } from 'react';

type SplashProps = {
  onFinish: () => void;
};

const images = [
  '/images/yut%281%29.jpg',
  '/images/3i.avif',
  '/images/pic1.avif'
];

const Splash = ({ onFinish }: SplashProps) => {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    if (index < images.length - 1) {
      setIndex((prev) => prev + 1);
    } else {
      localStorage.setItem('hasSeenSplash', 'true');
      onFinish();
    }
  };

  return (
    <div className="relative h-screen w-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="h-full w-full">
        <img
          src={images[index]}
          alt={`Splash ${index + 1}`}
          className="h-full w-full object-cover"
          style={{
            transition: 'opacity 0.5s ease',
            opacity: 1
          }}
        />
      </div>
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <button
          type="button"
          onClick={handleNext}
          className="rounded-full bg-white/90 px-6 py-2 text-sm font-semibold uppercase tracking-wide text-black transition hover:bg-white"
        >
          {index < images.length - 1 ? 'Next' : 'Get started'}
        </button>
      </div>
    </div>
  );
};

export default Splash;
