import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAvailableInheritances } from "../../features/verification/verificationSlice.js";
import PageHeader from "../../components/common/PageHeader.jsx";
import { Gift, KeyRound, ArrowRight, ShieldCheck } from "lucide-react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { inheritances } = useSelector((state) => state.verification);

  useEffect(() => {
    dispatch(fetchAvailableInheritances());
  }, [dispatch]);

  // Calculate stats
  const availableCount = inheritances.length;
  // Released assets count (any asset status matches APPROVED or RELEASED)
  let releasedCount = 0;
  inheritances.forEach((inh) => {
    inh.assets.forEach((asset) => {
      if (asset.requestStatus === "APPROVED" || asset.requestStatus === "RELEASED") {
        releasedCount++;
      }
    });
  });

  const cards = [
    {
      name: "Available Inheritances",
      value: availableCount,
      icon: Gift,
      color: "from-indigo-600 to-violet-500",
      link: "/nominee/available",
      description: "Vaults triggered by owner inactivity.",
    },
    {
      name: "Released Assets",
      value: releasedCount,
      icon: KeyRound,
      color: "from-emerald-600 to-teal-500",
      link: "/nominee/released",
      description: "Assets approved for decryption & download.",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Hello, Nominee ${user?.name}`}
        subtitle="Access triggered inheritances, request file decryption, and view released assets."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.name}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-400">{card.name}</p>
                  <p className="text-3xl font-extrabold text-white mt-2">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-2">{card.description}</p>
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-r ${card.color} shadow-lg shadow-black/30`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="border-t border-slate-800 mt-6 pt-4">
                <Link
                  to={card.link}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
                >
                  Navigate Panel <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info notice */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-200">Secure Inheritance Authorization</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            LegacyVault enforces strict isolation. You will never receive access to an owner's entire vault. You only see assets explicitly assigned to your email address and approved for release by the platform administrator after verifying owner inactivity conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
