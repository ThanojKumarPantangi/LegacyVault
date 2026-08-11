import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminStats, simulateInactivity } from "../../features/admin/adminSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { ShieldCheck, Users, FolderLock, BookOpen, AlertTriangle, Play, HelpCircle } from "lucide-react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.admin);

  // Simulation form states
  const [email, setEmail] = useState("");
  const [inactivityDays, setInactivityDays] = useState(1);
  const [simLoading, setSimLoading] = useState(false);
  const [simMessage, setSimMessage] = useState("");
  const [simError, setSimError] = useState("");

  useEffect(() => {
    dispatch(fetchAdminStats());
  }, [dispatch]);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setSimMessage("");
    setSimError("");

    if (!email) {
      setSimError("User email is required");
      return;
    }

    setSimLoading(true);
    const result = await dispatch(simulateInactivity({ email, inactivityDays }));
    setSimLoading(false);

    if (simulateInactivity.fulfilled.match(result)) {
      setSimMessage(result.payload.message || "Inactivity simulation completed successfully!");
      dispatch(fetchAdminStats());
    } else {
      setSimError(result.payload || "Failed to simulate inactivity.");
    }
  };

  const statCards = stats
    ? [
        { name: "Total Users", value: stats.usersCount, icon: Users, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
        { name: "Deposited Assets", value: stats.assetsCount, icon: FolderLock, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
        { name: "Nominee Links", value: stats.nomineesCount, icon: HelpCircle, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
        { name: "Inheritance Policies", value: stats.policiesCount, icon: BookOpen, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
        { name: "Pending Claims", value: stats.pendingRequestsCount, icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
        { name: "Verification Cases", value: stats.verificationCasesCount, icon: ShieldCheck, color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Admin Control Center"
        subtitle="Manage platform users, review verification requests, monitor security logs, and test inactivity triggers."
      />

      {loading && !stats ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-emerald-500" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.name}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-400">{card.name}</p>
                    <p className="text-3xl font-extrabold text-white mt-2">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl border ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Inactivity Simulation form */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Inactivity Trigger Simulator</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Safe testing workspace. Set back an owner's pulse to trigger verification workflows instantly.
                  </p>
                </div>
              </div>

              {simMessage && (
                <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-lg">
                  {simMessage}
                </div>
              )}

              {simError && (
                <div className="p-3 mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg">
                  {simError}
                </div>
              )}

              <form onSubmit={handleSimulate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2">
                  <Input
                    label="Asset Owner Email Address"
                    id="simEmail"
                    type="email"
                    placeholder="user@test.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    label="Days of Inactivity"
                    id="simDays"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={inactivityDays}
                    onChange={(e) => setInactivityDays(e.target.value)}
                    required
                  />
                </div>
                <div className="sm:col-span-3 flex justify-end mt-2">
                  <Button type="submit" loading={simLoading} variant="outline" className="w-full sm:w-auto">
                    Simulate Inactivity Pulse
                  </Button>
                </div>
              </form>
            </div>

            {/* Admin notes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-slate-100 mb-3">Verification Rules</h3>
              <ul className="text-xs text-slate-400 space-y-2.5 list-disc pl-4 leading-relaxed">
                <li>Simulating inactivity updates the User's `lastActiveAt` to the past.</li>
                <li>Executing simulation runs the cron checker immediately.</li>
                <li>If the owner inactivity matches their policy limits, a verification case starts.</li>
                <li>Associated nominees receive simulated email alerts containing claim instructions.</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
