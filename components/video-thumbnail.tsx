"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

interface VideoThumbnailProps {
  src: string;
  className?: string;
  onClick?: () => void;
}

export function VideoThumbnail({
  src,
  className,
  onClick,
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  };

  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        muted
        playsInline
        loop
        preload="metadata"
      />

      {/* Hover overlay */}
      <div
        className={`absolute inset-0 bg-background/40 transition-opacity flex items-center justify-center ${
          isHovering ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-6 h-6 text-foreground fill-foreground" />
        </div>
      </div>
    </div>
  );
}
