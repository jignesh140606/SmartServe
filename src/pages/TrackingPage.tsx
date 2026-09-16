import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  ArrowLeft,
  Paperclip,
  Star,
  RefreshCw,
} from 'lucide-react';
import { trackingService, type TrackingData } from '../services/trackingService';
import { SlaBadge } from '../components/ui/SlaBadge';

export const TrackingPage: React.FC = () => {
  const { type = 'ticket', id = '' } = useParams<{ type: string; id: string }>();
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await trackingService.getPublicTracking(type, id);
      setData(res);
    } catch (err: any) {
      console.error('Tracking fetch failed:', err);
      setError(
        err.response?.data?.message ||
          'Unable to find ticket or complaint with the provided ID. Please verify your tracking link.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTracking();
    }
  }, [type, id]);

  const steps = ['Open', 'In Progress', 'Resolved', 'Closed'];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'Open':
        return 0;
      case 'In Progress':
        return 1;
      case 'Resolved':
        return 2;
      case 'Closed':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = data ? getStepIndex(data.status) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
              S
            </div>
            <span className="text-base font-bold text-gray-900 tracking-tight">SmartServe</span>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-gray-600">
              Retrieving live status for {type} #{id.slice(-6)}...
            </p>
          </div>
        ) : error || !data ? (
          <div className="bg-white rounded-2xl p-10 border border-gray-200 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Record Not Found</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">{error}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={fetchTracking}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Status Check
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {/* Header section */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-xs text-blue-200 border border-white/15 uppercase tracking-wider">
                    {data.type} #{data._id.slice(-8)}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      data.priority === 'Critical'
                        ? 'bg-red-500/20 text-red-200 border border-red-400/30'
                        : data.priority === 'High'
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                        : 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                    }`}
                  >
                    {data.priority} Priority
                  </span>
                </div>

                <button
                  type="button"
                  onClick={fetchTracking}
                  className="inline-flex items-center gap-1.5 text-xs text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Live Sync
                </button>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
                {data.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-blue-200/90 pt-1">
                <span>Category: {data.category}</span>
                <span>•</span>
                <span>Requested by: {data.customerName}</span>
                <span>•</span>
                <span>Logged: {new Date(data.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="p-6 sm:p-8 bg-slate-50/50">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-6">
                Resolution Lifecycle
              </h2>

              <div className="relative">
                {/* Connecting line */}
                <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative z-10">
                  {steps.map((step, idx) => {
                    const isPassed = idx < currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div
                        key={step}
                        className={`flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2 p-2 rounded-lg ${
                          isCurrent ? 'bg-blue-50/80 sm:bg-transparent' : ''
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                            isPassed
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs'
                              : 'bg-white text-gray-400 border border-gray-300'
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        <div>
                          <p
                            className={`text-xs font-semibold ${
                              isCurrent
                                ? 'text-blue-600'
                                : isPassed
                                ? 'text-emerald-700'
                                : 'text-gray-400'
                            }`}
                          >
                            {step}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {idx === 0
                              ? 'Logged & Verified'
                              : idx === 1
                              ? 'Specialist Assigned'
                              : idx === 2
                              ? 'Fix Implemented'
                              : 'Case Closed'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Status & SLA Indicators */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <span className="text-xs text-gray-500 font-medium">Service SLA</span>
                  <div className="mt-2">
                    <SlaBadge deadline={data.slaDeadline} status={data.status} />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <span className="text-xs text-gray-500 font-medium">Assigned Specialist</span>
                  <div className="mt-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs font-semibold text-gray-800 truncate">
                      {data.assignedToName || 'Awaiting Assignment'}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white">
                  <span className="text-xs text-gray-500 font-medium">Attached Evidence</span>
                  <div className="mt-2 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-800">
                      {data.attachmentCount} File(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Request Summary & Details
                </h3>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                  {data.description}
                </div>
              </div>

              {/* CSAT Rating display if available */}
              {data.rating && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-900">
                      Customer Satisfaction Rating (CSAT)
                    </span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= data.rating!.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {data.rating.feedback && (
                    <p className="text-xs text-amber-800 italic">"{data.rating.feedback}"</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified by SmartServe Service Desk</span>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                  Customer Sign In
                </Link>
                <span>•</span>
                <span className="text-gray-400">
                  Last updated: {new Date(data.updatedAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
