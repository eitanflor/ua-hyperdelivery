import { ASSISTANT_META } from "../lib/pipeline";
import { Avatar } from "./Avatar";

export function StreamingMessage({ text }: { text: string }) {
  return (
    <div className="animate-fade-in-up flex gap-3">
      <Avatar label={ASSISTANT_META.initial} gradient={ASSISTANT_META.gradient} />
      <div className="flex-1 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-md">
        {text ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-ua-black">
            {text}
            <span className="ml-0.5 inline-block h-4 w-1 animate-pulse-dot bg-ua-steel align-middle" />
          </p>
        ) : (
          <div className="flex items-center gap-2 py-1">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ua-steel [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ua-steel [animation-delay:160ms]" />
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-ua-steel [animation-delay:320ms]" />
          </div>
        )}
      </div>
    </div>
  );
}
