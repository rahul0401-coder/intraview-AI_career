"use client";

import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MeetingModal from "@/components/MeetingModal";
import LoaderUI from "@/components/LoaderUI";
import QuickActions from "@/components/QuickActions";
import AdminDashboard from "@/components/AdminDashboard";

export default function Home() {
  const router = useRouter();
  const { isInterviewer, isAdmin, isCandidate, isLoading } = useUserRole();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"start" | "join">();

  const handleQuickAction = (title: string) => {
    switch (title) {
      case "New Call":
        setModalType("start");
        setShowModal(true);
        break;
      case "Join Interview":
        setModalType("join");
        setShowModal(true);
        break;
      case "Schedule":
        router.push("/schedule");
        break;
      case "Recordings":
        router.push("/recordings");
        break;
      case "Practice":
        router.push("/practice");
        break;
      case "AI Career":
        router.push("/ai-career/profile");
        break;
    }
  };

  if (isLoading) return <LoaderUI />;

  // Show admin dashboard directly for admin users
  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* WELCOME SECTION */}
      <div className="rounded-lg bg-card p-6 border shadow-sm">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
          Welcome back!
        </h1>
        <p className="text-muted-foreground mt-2">
          {isInterviewer
            ? "Manage your interviews and review candidates effectively"
            : "Access your upcoming interviews and preparations"}
        </p>
      </div>

      {/* Quick Actions for both roles */}
      <QuickActions onActionClick={handleQuickAction} />

      {/* Meeting Modal */}
      <MeetingModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalType === "join" ? "Join Meeting" : "Start Meeting"}
        isJoinMeeting={modalType === "join"}
      />
    </div>
  );
}
