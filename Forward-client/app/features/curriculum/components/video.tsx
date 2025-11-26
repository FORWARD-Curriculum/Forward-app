import type {
  Video as VideoType,
  VideoResponse,
} from "@/features/curriculum/types";
import { useResponse } from "@/features/curriculum/hooks";
import { useRef } from "react";
import MarkdownTTS from "@/components/ui/markdown-tts";

export default function Video({ video }: { video: VideoType }) {
  const [response, setResponse] = useResponse<VideoResponse, VideoType>({
    activity: video,
    initialFields: {
      partial_response: true,
      watched_percentage: 0,
    },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(0);
  const highestTimeWatchedRef = useRef(0);

  const handleLoadedMetadata = () => {
    if (videoRef.current && response.watched_percentage > 0) {
      const duration = videoRef.current.duration;
      const startTime = (response.watched_percentage / 100) * duration;

      if (isFinite(startTime)) {
        videoRef.current.currentTime = startTime >=100 ? 0 : startTime;
        lastTimeRef.current = startTime;
        highestTimeWatchedRef.current = startTime;
      }
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoElement = e.currentTarget;
    const currentTime = videoElement.currentTime;

    if (!video.scrubbable) {
      const timeDiff = Math.abs(currentTime - lastTimeRef.current);
      const isInvalidScrub =
        timeDiff > 1 && currentTime > highestTimeWatchedRef.current;

      if (isInvalidScrub) {
        videoElement.currentTime = highestTimeWatchedRef.current;
        return;
      }
    }

    // --- If we've reached this point, the time update is valid ---
    if (currentTime > highestTimeWatchedRef.current) {
      highestTimeWatchedRef.current = currentTime;
    }

    lastTimeRef.current = currentTime;

    const watchedPercentage = (currentTime / videoElement.duration) * 100;
    if (watchedPercentage - response.watched_percentage > 5) {
      setResponse((prev) => ({
        
        ...prev,
        watched_percentage: Math.floor(watchedPercentage),
      }));
    }
  };

  return (
    <div>
      <div className="flex w-full flex-col items-center gap-4 p-4">
        <video
          ref={videoRef}
          className="w-auto rounded-lg shadow-lg max-h-160"
          src={video.video}
          controls
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            setResponse((prev) => ({
              ...prev,
              watched_percentage: 100,
              partial_response: false,
            }));
          }}
        >
          Your browser does not support the video tag.
        </video>
        
        {video.transcript && (
          <details className="w-auto max-w-4xl bg-foreground rounded-lg p-4 shadow">
            <summary className="cursor-pointer font-medium text-secondary-foreground hover:text-accent transition-colors">
              Transcript
            </summary>
            <MarkdownTTS
              className="mt-4 whitespace-pre-wrap text-secondary-foreground leading-relaxed"
              controlsClassName="flex flex-col mt-2 lg:mt-0 lg:flex-row-reverse justify-between"
              controlsOrientation="horizontal"
            >
              {video.transcript}
            </MarkdownTTS>
          </details>
        )}
      </div>
    </div>
  );
}