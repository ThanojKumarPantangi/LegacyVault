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
  Activity,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const assets = useSelector((state) => state.assets.items);
  const nominees = useSelector((state) => state.nominees.items);
  const policies = useSelector((state) => state.policies.items);

  useEffect(() => {
    dispatch(fetchAssets());
    dispatch(fetchNominees());
    dispatch(fetchPolicies());
  }, [dispatch]);

  const stats = [
    {
      name: "Secure Assets",
      value: assets.length,
      icon: FolderLock,
      color: "from-blue-600 to-cyan-500",
      link: "/user/assets",
    },
    {
      name: "Nominees",
      value: nominees.length,
      icon: Users,
      color: "from-indigo-600 to-violet-500",
      link: "/user/nominees",
    },
    {
      name: "Active Policies",
      value: policies.length,
      icon: BookOpen,
      color: "from-emerald-600 to-teal-500",
      link: "/user/policies",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name}`}
        subtitle="Manage your secure digital vault, nominees, and continuity policies."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-10">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.link}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between hover:border-slate-700 transition-all duration-200"
            >
              <div>
                <p className="text-sm font-semibold text-slate-400">{stat.name}</p>
                <p className="text-3xl font-extrabold text-white mt-2">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg shadow-black/30`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Safety Alert and Policy Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Vault Security Active</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your digital inheritance policies are fully armed. In the event of prolonged account inactivity, your designated nominees will be notified to begin verification request workflows.
            </p>
            <div className="mt-6 flex items-center gap-3 text-sm text-slate-300">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>
                Last active pulse recorded:{" "}
                <strong className="text-slate-100">
                  {user?.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "Just now"}
                </strong>
              </span>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 mt-6 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              Keep your vault active by periodically logging in.
            </span>
            <Link
              to="/user/profile"
              className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1.5"
            >
              View Activity Profile <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Quick Launch Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Quick Setup</h3>
          <div className="flex flex-col gap-4">
            <Link
              to="/user/assets"
              className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl hover:bg-slate-950/80 border border-slate-850 hover:border-slate-700 transition-all duration-150"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-200">1. Deposit Assets</h4>
                <p className="text-xs text-slate-500 mt-1">Upload private data & docs</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/user/nominees"
              className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl hover:bg-slate-950/80 border border-slate-850 hover:border-slate-700 transition-all duration-150"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-200">2. Appoint Nominees</h4>
                <p className="text-xs text-slate-500 mt-1">Add trusted family/advisors</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/user/policies"
              className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl hover:bg-slate-950/80 border border-slate-850 hover:border-slate-700 transition-all duration-150"
            >
              <div>
                <h4 className="text-sm font-bold text-slate-200">3. Set Policy</h4>
                <p className="text-xs text-slate-500 mt-1">Configure inactivity rules</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
