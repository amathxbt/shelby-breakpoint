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

// Default sample videos - always included
export const defaultVideos: Video[] = [
  {
    id: -1,
    fileId: "sample-1",
    account: "",
    description: "Big Buck Bunny",
    email: "bigbuckbunny@example.com",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    createdAt: new Date(),
  },
  {
    id: -2,
    fileId: "sample-2",
    account: "",
    description: "Elephants Dream",
    email: "elephantsdream@example.com",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    createdAt: new Date(),
  },
  {
    id: -3,
    fileId: "sample-3",
    account: "",
    description: "For Bigger Blazes",
    email: "forbiggerblazes@example.com",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    createdAt: new Date(),
  },
];

interface VideoPlayerProps {
  video: Video;
  isActive?: boolean;
  authToken?: string;
}

export function VideoPlayer({
  video,
  isActive = true,
  authToken,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isActiveRef = useRef(isActive);
  const [isPlaying, setIsPlaying] = useState(isActive);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  // Setup video source
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !video) return;

    // Clean up previous blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    // If auth token is provided, fetch with authorization header and use blob URL
    if (authToken) {
      const abortController = new AbortController();

      fetch(video.url, {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: abortController.signal,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.status}`);
          }
          return response.blob();
        })
        .then((blob) => {
          const blobUrl = URL.createObjectURL(blob);
          blobUrlRef.current = blobUrl;
          videoElement.src = blobUrl;
          videoElement.load();
          if (isActiveRef.current) {
            videoElement.play().catch((error) => {
              console.log("Autoplay prevented:", error);
            });
          }
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Error loading video with auth:", error);
          }
        });

      return () => {
        abortController.abort();
      };
    }

    // No auth token - use direct URL
    videoElement.src = video.url;
    videoElement.load();
    if (isActiveRef.current) {
      videoElement.play().catch((error) => {
        console.log("Autoplay prevented:", error);
      });
    }
  }, [video, authToken]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

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
        className="relative w-full h-full md:rounded overflow-hidden"
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
          className="w-full h-full object-cover"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
        />

        <MediaControlBar className="px-4 pb-8 gap-4">
          <MediaTimeRange className="bg-transparent" />
          <MediaMuteButton className="bg-transparent px-2" />
        </MediaControlBar>
      </MediaController>

      {/* Video actions - description, like, share, creator */}
      <VideoActions video={video} isPlaying={isPlaying} />
    </div>
  );
}
