import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { loadCurrentUser } from "../../features/auth/authSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import { User, Activity, Mail, Calendar, ShieldAlert } from "lucide-react";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const [pulseMessage, setPulseMessage] = useState("");

  const handleTriggerPulse = async () => {
    setPulseMessage("");
    // Trigger current user loading, which updates lastActiveAt in DB if > 1 minute
    const result = await dispatch(loadCurrentUser());
    if (loadCurrentUser.fulfilled.match(result)) {
      setPulseMessage("Pulse signal recorded! lastActiveAt updated.");
      setTimeout(() => setPulseMessage(""), 4000);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Activity Profile"
        subtitle="Manage your identity settings and verify your account safety pulse signal."
      />

      <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6">
        {/* User Identity */}
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <div className="p-4 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">{user?.name}</h3>
            <span className="inline-block text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full mt-1 uppercase tracking-wider">
              {user?.role} Account
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email Address
            </p>
            <p className="text-sm font-bold text-slate-200">{user?.email}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Registered Date
            </p>
            <p className="text-sm font-bold text-slate-200">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>

        {/* Pulse Heartbeat */}
        <div className="p-6 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg animate-pulse">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">Inactivity pulse signal</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Last recorded activity status:{" "}
                <span className="text-slate-300 font-bold">
                  {user?.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "N/A"}
                </span>
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Inactivity detection works by calculating the time since your last recorded active heartbeat. Logging in, updating assets, or manually sending a pulse signal resets this clock.
          </p>

          {pulseMessage && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg">
              {pulseMessage}
            </div>
          )}

          <Button onClick={handleTriggerPulse} loading={loading} variant="primary">
            Send Pulse Signal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
