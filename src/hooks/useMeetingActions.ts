import { useRouter } from "next/navigation";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { toast } from "sonner";

const useMeetingActions = () => {
  const router = useRouter();
  const client = useStreamVideoClient();

  const createInstantMeeting = async () => {
    if (!client) return;

    try {
      const id = crypto.randomUUID();
      const call = client.call("default", id);

      await call.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
          custom: {
            description: "Instant Meeting",
          },
        },
      });

      router.push(`/meeting/${call.id}`);
      toast.success("Meeting Created Successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create meeting. Please try again.");
    }
  };

  const joinMeeting = async (callId: string) => {
    if (!client) {
      toast.error("Failed to join meeting. Please try again.");
      return;
    }

    try {
      // Verify if the meeting exists
      const call = client.call("default", callId);
      await call.get();

      toast.success("Joining meeting...");
      router.push(`/meeting/${callId}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to join meeting. The meeting may not exist or you don't have access.");
      throw error; // Propagate error to handle loading state in component
    }
  };

  return { createInstantMeeting, joinMeeting };
};

export default useMeetingActions;
