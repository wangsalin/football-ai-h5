import { ShieldAlert } from "lucide-react";
import { disclaimer } from "@/lib/status";

export function Disclaimer() {
  return (
    <footer className="rounded-2xl border border-white/8 bg-[#0e1f17] p-4">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 shrink-0 text-[#f6c85f]" size={18} aria-hidden="true" />
        <p className="text-xs leading-5 text-[#9db4a5]">{disclaimer}</p>
      </div>
    </footer>
  );
}
