import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAssets } from "../../features/assets/assetSlice.js";
import { fetchNominees } from "../../features/nominees/nomineeSlice.js";
import { fetchPolicies } from "../../features/policies/policySlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import {
  FolderLock,
  Users,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Circle,
  Activity,
  Plus,
} from "lucide-react";
import Button from "../../components/common/Button.jsx";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const assets = useSelector((state) => state.assets.items) || [];
  const nominees = useSelector((state) => state.nominees.items) || [];
  const policies = useSelector((state) => state.policies.items) || [];

  useEffect(() => {
    dispatch(fetchAssets());
    dispatch(fetchNominees());
    dispatch(fetchPolicies());
  }, [dispatch]);

  const stats = [
    {
      name: "Confidential Assets",
      value: assets.length,
      icon: FolderLock,
      link: "/user/assets",
      label: "View all assets",
      colorClass: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-900/60",
    },
    {
      name: "Trusted Nominees",
      value: nominees.length,
      icon: Users,
      link: "/user/nominees",
      label: "Manage nominees",
      colorClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-900/60",
    },
    {
      name: "Active Policies",
      value: policies.length,
      icon: BookOpen,
      link: "/user/policies",
      label: "Review policies",
      colorClass: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/60",
    },
  ];

  const steps = [
    {
      title: "1. Deposit Confidential Assets",
      desc: "Store encrypted credentials, crypto wallets, and deeds",
      done: assets.length > 0,
      link: "/user/assets",
    },
    {
      title: "2. Appoint Trusted Nominees",
      desc: "Designate legal heirs, family members, or advisors",
      done: nominees.length > 0,
      link: "/user/nominees",
    },
    {
      title: "3. Establish Inheritance Policy",
      desc: "Configure inactivity delay triggers and release rules",
      done: policies.length > 0,
      link: "/user/policies",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name || "Vault Owner"}`}
        subtitle="Manage your encrypted digital assets, appointed nominees, and continuity policies."
        action={
          <Link to="/user/assets">
            <Button icon={Plus} size="md">
              New Asset
            </Button>
          </Link>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.link}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all duration-150 flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {stat.name}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 font-mono">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2.5 rounded-lg border ${stat.colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                <span>{stat.label}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Vault Status and Setup Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security Status Box */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Vault Inactivity Protocol Armed
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Continuous Inactivity Heartbeat Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Your confidential vault records are encrypted client-side using AES-256-GCM. In the event of prolonged account inactivity exceeding your policy threshold, designated nominees will be invited into our verified succession workflow.
            </p>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Last recorded active heartbeat:{" "}
                  <strong className="text-slate-900 dark:text-slate-100 font-mono">
                    {user?.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "Just now"}
                  </strong>
                </span>
              </div>
              <Link
                to="/user/profile"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 shrink-0"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Send Pulse Signal</span>
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Periodic sign-ins automatically refresh your active status.</span>
            <Link
              to="/user/profile"
              className="font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1"
            >
              Account security profile <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Guided Setup Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Succession Checklist
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                {steps.filter((s) => s.done).length} / 3 Completed
              </span>
            </div>

            <div className="space-y-3">
              {steps.map((step) => (
                <Link
                  key={step.title}
                  to={step.link}
                  className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-950/80 transition-all flex items-start gap-3 group"
                >
                  {step.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-xs font-semibold ${step.done ? "text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300"}`}>
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {step.desc}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform shrink-0 mt-0.5" />
                </Link>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-4 text-center">
            Complete all 3 steps to ensure seamless inheritance handover.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

