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
  const [simulationStage, setSimulationStage] = useState(
    "OWNER_INACTIVITY"
  );

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
        result.payload.message ||
          "Simulation completed successfully!"
      );

      dispatch(fetchAdminStats());
    } else {
      setSimError(
        result.payload ||
          "Failed to run simulation."
      );
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
                  <h3 className="text-lg font-bold text-slate-100">
                    Inheritance Workflow Simulator
                  </h3>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Safely simulate individual stages of the inheritance
                    verification workflow.
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

              <form
                onSubmit={handleSimulate}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"
              >
                {/* Simulation Stage */}
                <div>
                  <label
                    htmlFor="simulationStage"
                    className="block text-xs font-semibold text-slate-400 mb-1.5"
                  >
                    Simulation Stage
                  </label>

                  <select
                    id="simulationStage"
                    value={simulationStage}
                    onChange={(e) => setSimulationStage(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OWNER_INACTIVITY">
                      Initial Owner Inactivity
                    </option>

                    <option value="OWNER_RESPONSE_TIMEOUT">
                      Owner Response Timeout
                    </option>

                    <option value="NOMINEE_RESPONSE_TIMEOUT">
                      Nominee Response Timeout
                    </option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <Input
                    label={
                      simulationStage === "NOMINEE_RESPONSE_TIMEOUT"
                        ? "Asset Owner Email Address"
                        : "Asset Owner Email Address"
                    }
                    id="simEmail"
                    type="email"
                    placeholder="owner@test.com"
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
                        ? "Days of Inactivity"
                        : "Timeout Days"
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

                {/* Submit */}
                <div className="sm:col-span-3 flex justify-end mt-2">
                  <Button
                    type="submit"
                    loading={simLoading}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Simulate Workflow Stage
                  </Button>
                </div>
              </form>
            </div>

            {/* Admin notes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-base font-bold text-slate-100 mb-3">
                Verification Rules
              </h3>

              <ul className="text-xs text-slate-400 space-y-2.5 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Initial Owner Inactivity:</strong> moves the
                  owner's <code>lastActiveAt</code> into the past and
                  runs the inactivity processor.
                </li>

                <li>
                  <strong>Owner Response Timeout:</strong> moves the
                  active VerificationCase's{" "}
                  <code>ownerResponseDeadline</code> into the past,
                  causing the nominee confirmation stage to begin.
                </li>

                <li>
                  <strong>Nominee Response Timeout:</strong> moves the
                  active VerificationCase's{" "}
                  <code>nomineeResponseDeadline</code> into the past,
                  causing automatic asset release processing.
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
