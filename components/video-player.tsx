"use client";

import { useRef, useEffect, useState } from "react";
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaMuteButton,
} from "media-chrome/react";
import { Video } from "@/db/schema";
import { VideoActions } from "@/components/video-actions";
import Loader from "./ui/loader";
import useVideoBlob from "@/queries/useVideoBlob";

interface VideoPlayerProps {
  video: Video;
  isActive?: boolean;
}

export function VideoPlayer({ video, isActive = true }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isActiveRef = useRef(isActive);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  const { data: blobData, isLoading } = useVideoBlob({ url: video?.url });

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

    if (isActiveRef.current) {
      videoElement.play().catch((error) => {
        console.log("Autoplay prevented:", error);
      });
    }

    return () => URL.revokeObjectURL(url);
  }, [blobData]);

  // Handle play/pause based on isActive prop
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isActive) {
      videoElement.play().catch((error) => {
        console.log("Autoplay prevented:", error);
      });
    } else {
      videoElement.pause();
    }
  }, [isActive]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (!isPlaying) {
      videoElement.play().catch((error) => {
        console.log("Play prevented:", error);
      });
    } else {
      videoElement.pause();
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <MediaController
        className="relative w-full h-full md:rounded-md overflow-hidden"
        suppressHydrationWarning
        autohide="-1"
      >
        <video
          ref={videoRef}
          key={video.id}
          slot="media"
          preload="auto"
          muted
          loop
          playsInline
          webkit-playsinline="true"
          x-webkit-airplay="allow"
          crossOrigin=""
          className="w-full h-full object-cover bg-accent/15"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />

        {isLoading && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <Loader size="xl" className="text-primary" />
          </div>
        )}

        <MediaControlBar className="relative z-20 px-4 pb-8 gap-4">
          <MediaTimeRange className="bg-transparent" />
          <MediaMuteButton className="bg-transparent px-2" />
        </MediaControlBar>
      </MediaController>

      {/* Video actions - description, like, share, creator */}
      <VideoActions video={video} isPlaying={isPlaying} disabled={isLoading} />
    </div>
  );
}
