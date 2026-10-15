import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loadCurrentUser } from "../../features/auth/authSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import { User, Activity, Mail, Calendar, ShieldCheck, HeartPulse, CheckCircle2, Info } from "lucide-react";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const [pulseMessage, setPulseMessage] = useState("");

  const handleTriggerPulse = async () => {
    setPulseMessage("");
    // Trigger current user loading, which updates lastActiveAt in DB if > 1 minute
    const result = await dispatch(loadCurrentUser());
    if (loadCurrentUser.fulfilled.match(result)) {
      setPulseMessage("Pulse signal recorded! Inactivity countdown has been reset.");
      setTimeout(() => setPulseMessage(""), 4500);
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Account Profile"
        subtitle="Review your registered identity details, manage account credentials, and send a safety heartbeat signal."
      />

      <div className="max-w-2xl space-y-6">
        {/* User Identity Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs transition-colors duration-200">
          <div className="flex items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg shadow-xs">
                {getInitials(user?.name)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {user?.role} ACCOUNT
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Protected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Identity Information Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-6">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800/70">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 break-all">{user?.email}</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800/70">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member Since
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Pulse Heartbeat Monitor */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs space-y-5 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <HeartPulse className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Inactivity Pulse Monitor</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated dead-man's switch verification engine
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Armed
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Last Recorded Heartbeat:
              </span>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                {user?.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "N/A"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-slate-650 dark:text-slate-400 leading-relaxed bg-blue-50/50 dark:bg-blue-950/20 p-3.5 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p>
              Inactivity detection measures duration since your last verified active presence. Normal activity (signing in, modifying asset deposits, or manually transmitting a heartbeat signal) refreshes this timer and halts inheritance release workflows.
            </p>
          </div>

          {pulseMessage && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{pulseMessage}</span>
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={handleTriggerPulse}
              loading={loading}
              variant="primary"
              icon={Activity}
              className="w-full sm:w-auto"
            >
              Send Pulse Signal Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
