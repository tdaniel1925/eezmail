'use client';

interface VideoBackgroundProps {
  videoSrc: string;
  posterSrc?: string;
  overlayOpacity?: number;
  children?: React.ReactNode;
  className?: string;
}

export function VideoBackground({
  videoSrc,
  posterSrc,
  overlayOpacity = 0.8,
  children,
  className = '',
}: VideoBackgroundProps) {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={posterSrc}
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-950"
        style={{ opacity: overlayOpacity }}
      />

      {/* Gradient edges */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-slate-950/60 to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-slate-950/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}

