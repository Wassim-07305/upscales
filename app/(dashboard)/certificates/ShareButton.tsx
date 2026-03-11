"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Link2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function ShareButton({
  certificateNumber,
  formationTitle,
}: {
  certificateNumber: string;
  formationTitle?: string;
}) {
  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify/${certificateNumber}`
      : `/verify/${certificateNumber}`;

  const shareText = formationTitle
    ? `J'ai obtenu mon certificat "${formationTitle}" sur UPSCALE !`
    : `J'ai obtenu un certificat UPSCALE !`;

  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(verifyUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(verifyUrl);
    toast.success("Lien de verification copie !");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleLinkedIn}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="#0A66C2">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitter}>
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X (Twitter)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 className="mr-2 h-4 w-4" />
          Copier le lien
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
