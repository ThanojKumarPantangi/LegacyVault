import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminStats, simulateInactivity } from "../../features/admin/adminSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import Spinner from "../../components/common/Spinner.jsx";
import { ShieldCheck, Users, FolderLock, BookOpen, AlertTriangle, Play, HelpCircle, CheckCircle2, Clock, Sparkles } from "lucide-react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { stats, loading, error } = useSelector((state) => state.admin);

  // Simulation form states
  const [email, setEmail] = useState("");
  const [inactivityDays, setInactivityDays] = useState(1);
  const [simLoading, setSimLoading] = useState(false);
  const [simMessage, setSimMessage] = useState("");
  const [simError, setSimError] = useState("");
  const [simulationStage, setSimulationStage] = useState("OWNER_INACTIVITY");

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

    const result = await dispatch(
      simulateInactivity({
        simulationStage,
        email,
        inactivityDays,
      })
    );

    setSimLoading(false);

    if (simulateInactivity.fulfilled.match(result)) {
      setSimMessage(
        result.payload.message || "Simulation stage executed successfully!"
      );
      dispatch(fetchAdminStats());
    } else {
      setSimError(result.payload || "Failed to execute simulation stage.");
    }
  };

  const statCards = stats
    ? [
        {
          name: "Registered Users",
          value: stats.usersCount,
          icon: Users,
          color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50",
        },
        {
          name: "Deposited Assets",
          value: stats.assetsCount,
          icon: FolderLock,
          color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/50",
        },
        {
          name: "Nominee Links",
          value: stats.nomineesCount,
          icon: HelpCircle,
          color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/50",
        },
        {
          name: "Inheritance Policies",
          value: stats.policiesCount,
          icon: BookOpen,
          color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50",
        },
        {
          name: "Pending Claims",
          value: stats.pendingRequestsCount,
          icon: AlertTriangle,
          color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50",
        },
        {
          name: "Verification Cases",
          value: stats.verificationCasesCount,
          icon: ShieldCheck,
          color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-900/50",
        },
      ]
    : [];

  const simulationOptions = [
    { value: "OWNER_INACTIVITY", label: "Stage 1: Owner Inactivity Exceeded" },
    { value: "OWNER_RESPONSE_TIMEOUT", label: "Stage 2: Owner Response Deadline Elapsed" },
    { value: "NOMINEE_RESPONSE_TIMEOUT", label: "Stage 3: Nominee Confirmation Elapsed" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Control Center"
        subtitle="Real-time security telemetry, user access oversight, verification claims, and workflow test simulation."
      />

      {loading && !stats ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-emerald-600 dark:text-emerald-500" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.name}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-200"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {card.name}
                    </p>
                    <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2 font-mono">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inactivity Simulation form */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs transition-colors duration-200">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Play className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Inheritance Workflow Simulator
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Test automated time-delay verification stages in a controlled environment.
                  </p>
                </div>
              </div>

              {simMessage && (
                <div className="p-3.5 mb-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{simMessage}</span>
                </div>
              )}

              {simError && (
                <div className="p-3.5 mb-5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{simError}</span>
                </div>
              )}

              <form onSubmit={handleSimulate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Simulation Stage */}
                  <div className="sm:col-span-3">
                    <Select
                      label="Workflow Simulation Stage"
                      id="simulationStage"
                      value={simulationStage}
                      onChange={(e) => setSimulationStage(e.target.value)}
                      options={simulationOptions}
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-2">
                    <Input
                      label={
                        simulationStage === "NOMINEE_RESPONSE_TIMEOUT"
                          ? "Nominee Target Email Address"
                          : "Asset Owner Email Address"
                      }
                      id="simEmail"
                      type="email"
                      placeholder={
                        simulationStage === "NOMINEE_RESPONSE_TIMEOUT"
                          ? "nominee@example.com"
                          : "owner@example.com"
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {/* Days */}
                  <div>
                    <Input
                      label={
                        simulationStage === "OWNER_INACTIVITY"
                          ? "Elapsed Inactivity (Days)"
                          : "Timeout Offset (Days)"
                      }
                      id="simDays"
                      type="number"
                      min="1"
                      placeholder="1"
                      value={inactivityDays}
                      onChange={(e) => setInactivityDays(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button
                    type="submit"
                    loading={simLoading}
                    variant="primary"
                    icon={Play}
                    className="w-full sm:w-auto"
                  >
                    Simulate Workflow Stage
                  </Button>
                </div>
              </form>
            </div>

            {/* Verification Rules Guide */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs transition-colors duration-200 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Stage Progression Mechanics
                </h3>

                <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800">
                    <strong className="text-slate-900 dark:text-slate-200 block mb-0.5">Stage 1: Owner Inactivity</strong>
                    Adjusts owner's <code className="text-xs font-mono text-blue-600 dark:text-blue-400">lastActiveAt</code> into the past, triggering initial verification warnings.
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800">
                    <strong className="text-slate-900 dark:text-slate-200 block mb-0.5">Stage 2: Owner Timeout</strong>
                    Expires <code className="text-xs font-mono text-amber-600 dark:text-amber-400">ownerResponseDeadline</code>, commencing nominee identity verification phase.
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850/50 border border-slate-150 dark:border-slate-800">
                    <strong className="text-slate-900 dark:text-slate-200 block mb-0.5">Stage 3: Nominee Timeout</strong>
                    Expires <code className="text-xs font-mono text-emerald-600 dark:text-emerald-400">nomineeResponseDeadline</code>, authorizing automated asset release.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
