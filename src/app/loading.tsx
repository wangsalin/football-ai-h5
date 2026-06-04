export default function Loading() {
  return (
    <div className="min-h-dvh bg-[#030806] text-[#eef7ef]">
      <main className="mx-auto min-h-dvh w-full max-w-[430px] bg-[#07110d] px-4 pb-28 pt-5">
        <div className="h-5 w-28 rounded-full bg-white/10" />
        <div className="mt-3 h-8 w-48 rounded-full bg-white/10" />
        <div className="mt-6 space-y-3">
          <div className="h-28 rounded-2xl bg-white/10" />
          <div className="h-44 rounded-2xl bg-white/10" />
          <div className="h-44 rounded-2xl bg-white/10" />
        </div>
      </main>
    </div>
  );
}
