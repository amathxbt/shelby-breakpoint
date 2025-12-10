"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import useProfile from "@/queries/useProfile";
import useSaveProfile from "@/mutations/useSaveProfile";
import useSignOut from "@/mutations/useSignOut";
import { useRecaptcha } from "@/providers/RecaptchaProvider";
import { LogOut } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { account, connected } = useWallet();
  const { executeRecaptcha } = useRecaptcha();
  const { mutate: signOut } = useSignOut();

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const { data: profile, isLoading: isProfileLoading } = useProfile({
    walletAddress: account?.address?.toString(),
  });

  // Reset form when profile loads or dialog opens
  useEffect(() => {
    if (open && profile) {
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setEmail(profile.email || "");
      setXHandle(profile.x_handle || "");
      setMarketingOptIn(profile.marketingOptIn ?? false);
    }
  }, [open, profile]);

  const { mutate: saveProfile, isPending: isSavingProfile } = useSaveProfile({
    onSuccess: () => {
      onOpenChange(false);
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const handleSaveProfile = useCallback(async () => {
    if (!account?.address) return;

    let recaptchaToken: string | undefined;

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
      username: username || null,
      bio: bio || null,
      email: email || null,
      x_handle: xHandle || null,
      marketingOptIn,
      recaptchaToken,
    });
  }, [
    account?.address,
    username,
    bio,
    email,
    xHandle,
    marketingOptIn,
    executeRecaptcha,
    saveProfile,
  ]);

  const handleSignOut = () => {
    signOut();
    onOpenChange(false);
  };

  if (!connected) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage your profile and account settings.
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/200 characters
            </p>
          </div>

          <div className="border-t pt-4 mt-2">
            <p className="text-md font-medium mb-2">
              Communication methods
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              Update your communication methods to join the Shelby Breakpoint
              contest. Will be used to contact you if you win.
            </p>
            
            <div className="text-sm text-muted-foreground mb-4 space-y-2">
              <p>What you can win:</p>
              <ul className="list-disc pl-5">
                <li>
                  Exclusive Shelby Merch Bundle: sweatshirt, t-shirt, mug, tote
                  bag, notebook, stickers
                </li>
                <li>Professional Creator Kit: Mics, camera, and other gear</li>
              </ul>
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="x_handle">X (Twitter) handle</Label>
              <Input
                id="x_handle"
                type="text"
                placeholder="Your X (Twitter) handle"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
              />
            </div>

            <div className="grid gap-2 mb-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  const newEmail = e.target.value;
                  setEmail(newEmail);
                  if (newEmail && !marketingOptIn) {
                    setMarketingOptIn(true);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Used for notifications and updates.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketing"
                checked={marketingOptIn}
                onCheckedChange={(checked) =>
                  setMarketingOptIn(checked === true)
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="marketing"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Receive marketing emails
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex w-full justify-between items-center">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

