"use client";

import { useState } from "react";
import { Heart, Play, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/share-dialog";
import { Video } from "@/db/schema";
import { cn } from "@/lib/utils";
import { useWalletDialog } from "@/providers/WalletDialogProvider";
import useLikeStatus from "@/queries/useLikeStatus";
import useLike from "@/mutations/useLike";
import GeometricAvatar from "./geometric-avatar";

interface VideoActionsProps {
  video: Video;
  isPlaying?: boolean;
  disabled?: boolean;
}

export function VideoActions({
  video,
  isPlaying = false,
  disabled = false,
}: VideoActionsProps) {
  const router = useRouter();
  const { account, connected } = useWallet();
  const { openWalletDialog } = useWalletDialog();
  const walletAddress = account?.address?.toString();
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Fetch like status
  const { data: likeStatus } = useLikeStatus({ videoId: video.id });

  // Toggle like mutation with optimistic updates
  const { mutate: toggleLike } = useLike();

  const handleCreatorClick = () => {
    if (video.account) {
      router.push(`/profile/${video.account}`);
    }
  };

  const handleLike = () => {
    if (!connected || !walletAddress) {
      openWalletDialog();
      return;
    }
    toggleLike({ videoId: video.id });
  };

  const isLiked = likeStatus?.isLiked ?? false;
  const likeCount = likeStatus?.likeCount ?? 0;

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?id=${video.fileId}`
      : "";

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 z-10",
          isPlaying || disabled ? "opacity-0" : "opacity-100"
        )}
      >
        <div className="bg-black/40 rounded-full p-4 backdrop-blur-sm">
          <Play className="w-8 h-8 text-primary fill-primary" />
        </div>
      </div>

      {/* Description overlay - above controls */}
      <div className="absolute bottom-32 left-2 right-16 px-4 z-10 pointer-events-none">
        {video.description && (
          <p className="text-white text-sm drop-shadow-lg line-clamp-3">
            {video.description}
          </p>
        )}
      </div>

      {/* Right sidebar - Like, Share, Creator */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-4 z-20">
        {/* Creator Avatar */}
        {video.account && (
          <Button
            size="icon"
            onClick={handleCreatorClick}
            className="w-12 h-12 rounded-full p-0 overflow-hidden transition-all hover:bg-transparent"
            asChild
          >
            <GeometricAvatar size={48} name={video.account} />
          </Button>
        )}

        {/* Like Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className={cn(
              "w-12 h-12 rounded-full backdrop-blur-sm transition-all",
              isLiked
                ? "bg-red-500 hover:bg-red-600 hover:text-white text-white"
                : "bg-black/30 hover:bg-black/50 text-white"
            )}
          >
            <Heart
              className={cn("w-6 h-6", isLiked ? "fill-current" : "")}
              strokeWidth={isLiked ? 0 : 2}
            />
          </Button>
          <span className="text-white text-xs drop-shadow-lg">{likeCount}</span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsShareOpen(true)}
            className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm hover:text-white text-white"
          >
            <Share2 className="w-6 h-6" />
          </Button>
          <span className="text-white text-xs drop-shadow-lg">Share</span>
        </div>
      </div>

      <ShareDialog
        open={isShareOpen}
        address={video.account}
        onOpenChange={setIsShareOpen}
        url={shareUrl}
      />
    </>
  );
}
