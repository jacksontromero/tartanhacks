"use client";

import { Button } from "~/components/ui/button";
import { useToast } from "~/hooks/use-toast";

export default function CopyInviteButton({ eventId }: { eventId: string }) {
  const { toast } = useToast();

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/event/${eventId}/invite`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      toast({
        title: "Copied!",
        description: "Invite link copied to clipboard",
      });
    });
  };

  return (
    <Button
      onClick={handleCopyInvite}
      className="bg-primary text-primary-foreground hover:bg-primary/90"
    >
      Copy Invite Link
    </Button>
  );
}
