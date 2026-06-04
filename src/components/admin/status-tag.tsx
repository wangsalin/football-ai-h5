const toneMap = {
  green: "border-[#36d37e]/35 bg-[#36d37e]/10 text-[#b8ffd5]",
  amber: "border-[#f6c85f]/35 bg-[#f6c85f]/10 text-[#f6c85f]",
  red: "border-[#ff6675]/35 bg-[#ff6675]/10 text-[#ffc2c8]",
  gray: "border-white/10 bg-white/5 text-[#c7d7ca]",
};

type StatusTagProps = {
  children: string;
  tone?: keyof typeof toneMap;
};

export function StatusTag({ children, tone = "gray" }: StatusTagProps) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${toneMap[tone]}`}>
      {children}
    </span>
  );
}
