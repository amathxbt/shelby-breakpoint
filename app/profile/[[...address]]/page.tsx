"use client";

import { useWallet, truncateAddress } from "@aptos-labs/wallet-adapter-react";
import { useRouter, useParams } from "next/navigation";
import { Upload, Copy, Check, Pencil, Video, LogOut } from "lucide-react";
import { VideoThumbnail } from "@/components/video-thumbnail";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "@/lib/time";
import { toast } from "sonner";
import useProfile from "@/queries/useProfile";
import useVideos from "@/queries/useVideos";
import useSaveProfile from "@/mutations/useSaveProfile";
import useSignOut from "@/mutations/useSignOut";
import Link from "next/link";
import { useRecaptcha } from "@/providers/RecaptchaProvider";
import Loader from "@/components/ui/loader";
import GeometricAvatar from "@/components/geometric-avatar";

export default function ProfilePage() {
  const { account, connected } = useWallet();
  const router = useRouter();
  const params = useParams<{ address?: string[] }>();
  const [copied, setCopied] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMarketingOptIn, setEditMarketingOptIn] = useState(false);
  const [editXHandle, setEditXHandle] = useState("");
  const { executeRecaptcha } = useRecaptcha();
  const { mutate: signOut } = useSignOut();

  // Get address from path params, or use connected wallet address
  // params.address is an array for catch-all routes: /profile/0x123 -> ['0x123']
  const urlAddress = params.address?.[0];
  const connectedAddress = account?.address?.toString();

  // Determine which profile to show
  const profileAddress = urlAddress || connectedAddress;
  const isOwnProfile =
    !urlAddress || (connectedAddress && urlAddress === connectedAddress);

  // Fetch profile data for the displayed profile
  const { data: profile, isLoading: isProfileLoading } = useProfile({
    walletAddress: profileAddress,
  });

  // Save profile mutation (only for own profile)
  const { mutate: saveProfile, isPending: isSavingProfile } = useSaveProfile({
    onSuccess: () => {
      setIsEditDialogOpen(false);
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const handleSaveProfile = useCallback(async () => {
    if (!connectedAddress) return;

    let recaptchaToken: string | undefined;

    // Get reCAPTCHA token if available
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha("save_profile");
      } catch (error) {
        console.error("reCAPTCHA error:", error);
        toast.error("Failed to verify you're not a bot. Please try again.");
        return;
      }
    }

    saveProfile({
      username: editUsername || null,
      bio: editBio || null,
      email: editEmail || null,
      x_handle: editXHandle || null,
      marketingOptIn: editMarketingOptIn,
      recaptchaToken,
    });
  }, [
    connectedAddress,
    editUsername,
    editBio,
    editEmail,
    editMarketingOptIn,
    editXHandle,
    executeRecaptcha,
    saveProfile,
  ]);

  const openEditDialog = () => {
    setEditUsername(profile?.username || "");
    setEditBio(profile?.bio || "");
    setEditEmail(profile?.email || "");
    setEditXHandle(profile?.x_handle || "");
    setEditMarketingOptIn(profile?.marketingOptIn ?? false);
    setIsEditDialogOpen(true);
  };

  const copyAddress = async () => {
    if (!profileAddress) return;
    try {
      await navigator.clipboard.writeText(profileAddress);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  // Fetch videos for the displayed profile
  const { data: videos = [], isLoading: isVideosLoading } = useVideos(
    { account: profileAddress },
    { enabled: !!profileAddress }
  );

  const isLoading = isProfileLoading || isVideosLoading;

  const handleUploadClick = () => {
    window.location.href = "/upload";
  };

  // Redirect to home if no profile address
  useEffect(() => {
    if (!profileAddress) {
      router.replace("/");
    }
  }, [profileAddress, router]);

  // Show nothing while redirecting
  if (!profileAddress) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-y-scroll bg-background justify-center">
      <div className="flex flex-col h-fit pb-20 md:pb-4 justify-center w-full md:max-w-2xl lg:max-w-4xl">
        {/* Profile Header */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row h-fit items-center sm:items-start gap-4 sm:gap-6 font-gt-planar">
          {/* Avatar */}
          <div className="shrink-0">
            <GeometricAvatar size={80} name={profileAddress || "anonymous"} />
          </div>

          {/* Profile Info */}
          <div className="flex flex-col items-center sm:items-start gap-2 flex-1">
            {/* Username / Address */}
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                {profile?.username || truncateAddress(profileAddress)}
              </h2>
              {isOwnProfile && connected && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openEditDialog}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="sr-only">Edit profile</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => signOut()}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="sr-only">Sign out</span>
                  </Button>
                </>
              )}
            </div>

            {/* Wallet Address (if username is set, show address separately) */}
            {profile?.username && (
              <button
                onClick={copyAddress}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group text-sm"
              >
                <span className="font-mono">
                  {truncateAddress(profileAddress)}
                </span>
                {copied ? (
                  <Check className="w-3 h-3 text-green-500" />
                ) : (
                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            )}

            {/* Copy address button if no username */}
            {!profile?.username && (
              <button
                onClick={copyAddress}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy address</span>
                  </>
                )}
              </button>
            )}

            {/* Bio */}
            <p className="text-muted-foreground text-sm text-center sm:text-left max-w-md">
              {profile?.bio ??
                "Sharing moments on the decentralized web. Videos stored permanently on-chain."}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-2 mt-2 text-center sm:text-left">
              <span className="text-foreground font-bold">{videos.length}</span>
              <span className="text-muted-foreground text-sm">videos</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          // Loading state
          <div className="flex items-center justify-center flex-1 min-h-[300px]">
            <div className="flex flex-col items-center gap-4">
              <Loader size="md" />
              <p className="text-muted-foreground">Loading videos...</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center flex-1 min-h-[300px] px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Video className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground text-lg font-semibold mb-2">
              No Videos Yet
            </h3>
            <p className="text-muted-foreground mb-4 max-w-sm text-sm">
              {isOwnProfile
                ? "Start creating and sharing your content!"
                : "This user hasn't uploaded any videos yet."}
            </p>
            {isOwnProfile && connected && (
              <Button onClick={handleUploadClick} size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </Button>
            )}
          </div>
        ) : (
          // Videos grid
          <div className="p-4 md:p-6 h-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="relative aspect-9/16 bg-card rounded-md overflow-hidden transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <Link href={`/?id=${video.fileId}`}>
                  <VideoThumbnail
                    src={video.url}
                    className="absolute inset-0"
                  />
                </Link>

                {/* Time ago */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-background/80 to-transparent pointer-events-none">
                  <p className="text-foreground/80 text-xs truncate">
                    {formatDistanceToNow(video.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            <p className="text-sm text-muted-foreground">
              Username and Bio will be visible to others.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Enter a username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to show your wallet address
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Tell us about yourself..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {editBio.length}/200 characters
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="x_handle">X (Twitter) handle</Label>
              <Input
                id="x_handle"
                type="text"
                placeholder="Your X (Twitter) handle"
                value={editXHandle}
                onChange={(e) => setEditXHandle(e.target.value)}
              />
            </div>
            <p className="text-md text-muted-foreground">
              Communication methods
            </p>
            <p className="text-sm text-muted-foreground">
              Update your communication methods to join the Shelby Breakpoint
              contest. Will be used to contact you if you win.
            </p>
            <p className="text-sm text-muted-foreground">
              Will not be shared with anyone else.
            </p>
            <div className="text-sm text-muted-foreground">
              <p>
                How to participate in the &quot;Lights. Camera. Serve.&quot;
                Contest
              </p>
              <ul className="list-disc pl-5">
                <li>Watch and engage with videos in the app</li>
                <li>Must live in an eligible country for shipping</li>
                <li>
                  See{" "}
                  <a
                    href="https://shelby.xyz/contest-rules.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Contest Rules
                  </a>{" "}
                  for full terms and eligibility
                </li>
              </ul>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>What you can win:</p>
              <ul className="list-disc pl-5">
                <li>
                  Shelby Merch Bundle: sweatshirt, t-shirt, mug, tote bag,
                  notebook, stickers
                </li>
                <li>DJI Osmo Pocket 3 Creator Combo + accessories</li>
              </ul>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={editEmail}
                onChange={(e) => {
                  const newEmail = e.target.value;
                  setEditEmail(newEmail);
                  // Auto-check marketing opt-in when user starts typing email
                  if (newEmail && !editMarketingOptIn) {
                    setEditMarketingOptIn(true);
                  }
                }}
              />
            </div>
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="marketing"
                checked={editMarketingOptIn}
                onCheckedChange={(checked) =>
                  setEditMarketingOptIn(checked === true)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="marketing"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  I AGREE TO RECEIVE UPDATES FROM SHELBY FOUNDATION AND
                  UNDERSTAND I CAN UNSUBSCRIBE AT ANY TIME, AND I HAVE READ AND
                  ACCEPT THE{" "}
                  <a
                    href="https://shelby.xyz/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    PRIVACY POLICY
                  </a>{" "}
                  AND{" "}
                  <a
                    href="https://shelby.xyz/contest-rules.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    CONTEST RULES
                  </a>
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={
                isSavingProfile ||
                (!!(editEmail || editXHandle) && !editMarketingOptIn)
              }
            >
              {isSavingProfile ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
