type StatCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="rounded-xl bg-[#132d21] p-3">
      <p className="text-[11px] text-[#9db4a5]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[#eef7ef]">{value}</p>
      {hint ? <p className="mt-1 text-[11px] leading-4 text-[#9db4a5]">{hint}</p> : null}
    </div>
  );
}
