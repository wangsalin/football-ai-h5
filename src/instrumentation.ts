export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAppScheduler } = await import("@/services/app-scheduler");
    startAppScheduler();
  }
}
