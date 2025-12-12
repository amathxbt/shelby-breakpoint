"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import Loader from "./ui/loader";
import useVideoBlob from "@/queries/useVideoBlob";
import { cn } from "@/lib/utils";

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
  const isHoveringRef = useRef(false);
  const blobUrlRef = useRef<string | null>(null);

  const { data: blobData, isLoading } = useVideoBlob({ url: src });

  useEffect(() => {
    isHoveringRef.current = isHovering;
  }, [isHovering]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    if (!blobData) {
      videoElement.removeAttribute("src");
      videoElement.load();
      return;
    }

    const url = URL.createObjectURL(blobData);
    blobUrlRef.current = url;
    videoElement.src = url;
    videoElement.load();

    if (isHoveringRef.current) {
      videoElement.play().catch(() => {
        // Ignore autoplay errors
      });
    }

    return () => URL.revokeObjectURL(url);
  }, [blobData]);

  const handleMouseEnter = async () => {
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
      className={cn("relative bg-black", className)}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover bg-accent/15"
        muted
        playsInline
        loop
        preload="metadata"
      />

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center ">
          <Loader size="lg" className="text-primary" />
        </div>
      )}

      <div
        className={cn(
          "absolute inset-0 bg-accent/50 transition-opacity flex items-center justify-center",
          isHovering && !isLoading ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="w-12 h-12 rounded-full bg-foreground/20 backdrop-blur-sm flex items-center justify-center">
          <Play className="w-6 h-6 text-foreground fill-foreground" />
        </div>
      </div>
    </div>
  );
}
