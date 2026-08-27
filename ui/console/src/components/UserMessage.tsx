export function UserMessage({ text }: { text: string }) {
  return (
    <div className="animate-fade-in-up flex justify-end gap-3">
      <div className="max-w-[80%] rounded-2xl bg-ua-red/10 px-4 py-3 text-sm leading-relaxed text-ua-black ring-1 ring-ua-red/20">
        {text}
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ua-steel text-xs font-bold text-white shadow-sm ring-1 ring-black/5">
        You
      </div>
    </div>
  );
}
