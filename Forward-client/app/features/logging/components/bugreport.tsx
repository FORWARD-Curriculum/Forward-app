import { useState } from "react";
import type { BugReport } from "../types";
import { useSelector, useStore } from "react-redux";
import type { RootState } from "@/store";
import { apiFetch } from "@/utils/utils";
import { toast } from "sonner";
import { Bug, X } from "lucide-react";
import { useLocation } from "react-router";

export default function BugReport() {
  const [reporting, setReporting] = useState(false);
  const store = useStore();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    setReporting(false);
    e.preventDefault();
    const { lesson, ...fmtState } = store.getState() as RootState;
    const formData = new FormData(e.target as HTMLFormElement);
    const report: BugReport = {
      description: formData.get("description") as string,
      steps_to_reproduce: formData.get("steps") as string,
      recent_window_locations: location,
      app_state: fmtState,
      device_info: navigator.userAgent,
      app_version: import.meta.env.VITE_VERSION || "0.0.0",
    };
    try {
      const response = await apiFetch("/bugreport", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ||
            "Something went wrong with the bug report, we're really sorry!",
        );
      }
      toast.success("Submitted bug report successfully! Thank you!");
    } catch (err: any) {
      toast.error("Failed to submit bug report: " + err.message);
    }
  };

  return (
    <div
      className={[
        "fixed right-3 bottom-3",
        "bg-foreground shadow-md",
        reporting
          ? "p-4 w-[360px] max-w-[90vw]"
          : "p-0 w-12 h-12",
        reporting ? "rounded-lg" : "rounded-full",
        "transition-none duration-300 ease-out",
        "z-49",
        "overflow-hidden",
      ].join(" ")}
      style={{
        maxHeight: reporting ? 520 : 48,
      }}
    >
      <button
        type="button"
        onClick={() => setReporting(true)}
        aria-label="Open bug report"
        className={[
          reporting ? "pointer-events-none opacity-0 absolute" : "opacity-100 scale-100",
          "transition-none",
          "w-full h-full",
          "grid place-items-center",
        ].join(" ")}
      >
        <Bug size={20} />
      </button>

      <div
        className={[
          reporting
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-1 pointer-events-none",
          "transition-none duration-300 ease-out",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-base font-semibold">Bug Report</h2>
          <button
            type="button"
            onClick={() => setReporting(false)}
            aria-label="Close bug report"
            className="inline-flex items-center justify-center rounded-md p-1 hover:bg-black/10 transition"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-black/80 mb-3">
          FORWARD is developed by students just like you. Your bug reports help us
          improve the app and fix issues. Thank you for contributing!
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          <label className="block">
            <span className="block text-sm font-medium mb-1">Description</span>
            <textarea
              name="description"
              rows={4}
              className="w-full rounded-md border border-black/15 p-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
            />
          </label>

          <label className="block">
            <span className="block text-sm font-medium mb-1">Steps to Reproduce</span>
            <textarea
              name="steps"
              rows={4}
              className="w-full rounded-md border border-black/15 p-2 text-sm outline-none focus:ring-2 focus:ring-black/20"
            />
          </label>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-black text-white px-3 py-2 text-sm hover:bg-black/90 transition"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
