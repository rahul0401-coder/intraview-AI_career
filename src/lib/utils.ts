import { type ClassValue, clsx } from "clsx";
import { addHours, intervalToDuration, isAfter, isBefore, isWithinInterval } from "date-fns";
import { twMerge } from "tailwind-merge";
import { Doc } from "../../convex/_generated/dataModel";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Interview extends Doc<"interviews"> {
  status: "scheduled" | "in_progress" | "completed" | "active" | "succeeded" | "upcoming";
  startTime: number;
}

export const groupInterviews = (interviews: Interview[]) => {
  if (!interviews) return {};

  return interviews.reduce((acc: any, interview: Interview) => {
    const date = new Date(interview.startTime);
    const now = new Date();

    if (interview.status === "succeeded") {
      acc.succeeded = [...(acc.succeeded || []), interview];
    } else if (interview.status === "completed") {
      acc.failed = [...(acc.failed || []), interview];
    } else if (isBefore(date, now)) {
      acc.completed = [...(acc.completed || []), interview];
    } else if (isAfter(date, now)) {
      acc.upcoming = [...(acc.upcoming || []), interview];
    }

    return acc;
  }, {});
};

export const getCandidateInfo = (users: Doc<"users">[], candidateId: string) => {
  const candidate = users?.find((user) => user.clerkId === candidateId);
  return {
    name: candidate?.name || "Unknown Candidate",
    image: candidate?.image || "",
    initials:
      candidate?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("") || "UC",
  };
};

export const getInterviewerInfo = (users: Doc<"users">[], interviewerId: string) => {
  const interviewer = users?.find((user) => user.clerkId === interviewerId);
  return {
    name: interviewer?.name || "Unknown Interviewer",
    image: interviewer?.image,
    initials:
      interviewer?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("") || "UI",
  };
};

export const calculateRecordingDuration = (startTime: string, endTime: string) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const duration = intervalToDuration({ start, end });

  if (duration.hours && duration.hours > 0) {
    return `${duration.hours}:${String(duration.minutes).padStart(2, "0")}:${String(
      duration.seconds
    ).padStart(2, "0")}`;
  }

  if (duration.minutes && duration.minutes > 0) {
    return `${duration.minutes}:${String(duration.seconds).padStart(2, "0")}`;
  }

  return `${duration.seconds} seconds`;
};

export const getMeetingStatus = (interview: Interview) => {
  const now = new Date();
  const interviewStartTime = interview.startTime;
  const endTime = addHours(interviewStartTime, 1);

  if (
    interview.status === "completed" ||
    interview.status === "succeeded"
  )
    return "completed";
  if (isWithinInterval(now, { start: interviewStartTime, end: endTime })) return "live";
  if (isBefore(now, interviewStartTime)) return "upcoming";
  return "completed";
};
