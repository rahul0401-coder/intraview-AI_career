"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import useMeetingActions from "@/hooks/useMeetingActions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface MeetingModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    isJoinMeeting: boolean;
}

function MeetingModal({ isOpen, onClose, title, isJoinMeeting }: MeetingModalProps) {
    const [meetingUrl, setMeetingUrl] = useState("");
    const [buttonText, setButtonText] = useState("Join Meeting");
    const [isJoining, setIsJoining] = useState(false);
    const { createInstantMeeting, joinMeeting } = useMeetingActions();

    const handleStart = async () => {
        if (isJoinMeeting) {
            // Immediately update UI
            setIsJoining(true);
            setButtonText("Joining...");

            if (!meetingUrl.trim()) {
                toast.error("Please enter a valid meeting URL");
                setIsJoining(false);
                setButtonText("Join Meeting");
                return;
            }

            const meetingId = meetingUrl.split("/").pop();
            if (!meetingId) {
                toast.error("Invalid meeting URL. Please check and try again.");
                setIsJoining(false);
                setButtonText("Join Meeting");
                return;
            }

            try {
                await joinMeeting(meetingId);
                setMeetingUrl("");
                onClose();
            } catch (error) {
                console.error("Failed to join meeting:", error);
                setButtonText("Join Meeting");
            } finally {
                setIsJoining(false);
            }
        } else {
            await createInstantMeeting();
            setMeetingUrl("");
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    {isJoinMeeting && (
                        <Input
                            placeholder="Paste meeting link here..."
                            value={meetingUrl}
                            onChange={(e) => setMeetingUrl(e.target.value)}
                            disabled={isJoining}
                        />
                    )}

                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose} disabled={isJoining}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStart}
                            disabled={isJoining || (isJoinMeeting && !meetingUrl.trim())}
                            className="min-w-[120px] relative"
                        >
                            {isJoining && (
                                <Loader2 className="h-4 w-4 animate-spin absolute left-3" />
                            )}
                            <span>{isJoinMeeting ? buttonText : "Start Meeting"}</span>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default MeetingModal;
