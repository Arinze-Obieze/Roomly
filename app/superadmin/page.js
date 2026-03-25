"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MdPeople,
  MdHomeWork,
  MdReportProblem,
  MdTrendingUp,
  MdReceiptLong,
  MdBugReport,
  MdChatBubbleOutline,
  MdSearch,
  MdMessage,
  MdGroup,
} from "react-icons/md";
import { toast } from "sonner";
import Link from "next/link";
import StatCard from "@/components/superadmin/dashboard/StatCard";
import TrendChart from "@/components/superadmin/dashboard/TrendChart";
import MatchQualityPanel from "@/components/superadmin/dashboard/MatchQualityPanel";

const RANGE_OPTIONS = [7, 30, 90];

const metricValue = (metric) => (metric?.ok ? metric.value : 0);

export default function SuperAdminDashboard() {
  const [range, setRange] = useState(30);
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [chartsLoading, setChartsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchMetrics = async () => {
      setMetricsLoading(true);
      try {
        const response = await fetch('/api/superadmin/metrics', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load dashboard metrics.');
        }

        if (!active) return;
        setMetrics(payload.metrics || null);

        const failed = Object.entries(payload.metrics || {})
          .filter(([, value]) => value?.ok === false)
          .map(([key]) => key);

        if (failed.length > 0) {
          toast.error(`Some metrics are unavailable: ${failed.join(', ')}`);
        }
      } catch (error) {
        if (!active) return;
        console.error('[superadmin] metrics fetch failed:', error);
        toast.error(error?.message || 'Failed to load dashboard metrics.');
      } finally {
        if (active) setMetricsLoading(false);
      }
    };

    fetchMetrics();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchCharts = async () => {
      setChartsLoading(true);
      try {
        const response = await fetch(`/api/superadmin/charts?range=${range}`, { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load chart data.');
        }

        if (!active) return;
        setCharts(payload.series || null);

        if (Array.isArray(payload.errors) && payload.errors.length > 0) {
          toast.error(`Some chart sources failed: ${payload.errors.join(' | ')}`);
        }
      } catch (error) {
        if (!active) return;
        console.error('[superadmin] charts fetch failed:', error);
        toast.error(error?.message || 'Failed to load chart data.');
      } finally {
        if (active) setChartsLoading(false);
      }
    };

    fetchCharts();
    return () => {
      active = false;
    };
  }, [range]);

  const cards = useMemo(
    () => [
      {
        title: 'Total Users',
        value: metricValue(metrics?.totalUsers),
        subtitle: `${metricValue(metrics?.newUsersThisWeek)} new this week`,
        icon: MdPeople,
        color: 'blue',
        href: '/superadmin/users',
      },
      {
        title: 'Active Properties',
        value: metricValue(metrics?.activeProperties),
        subtitle: `Out of ${metricValue(metrics?.totalProperties)} total`,
        icon: MdHomeWork,
        color: 'emerald',
        href: '/superadmin/properties?approvalStatus=approved',
      },
      {
        title: 'Pending Reports',
        value: metricValue(metrics?.pendingReports),
        subtitle: `${metricValue(metrics?.totalReports)} total reports`,
        icon: MdReportProblem,
        color: 'rose',
        href: '/superadmin/reports',
      },
      {
        title: 'Logs Today',
        value: metricValue(metrics?.errorLogsToday),
        subtitle: `${metricValue(metrics?.totalLogs)} total logs`,
        icon: MdBugReport,
        color: 'amber',
        href: '/superadmin/system-logs',
      },
      {
        title: 'Weekly Growth',
        value: `+${metricValue(metrics?.newUsersThisWeek)}`,
        subtitle: 'User signups in last 7 days',
        icon: MdTrendingUp,
        color: 'indigo',
        href: '/superadmin/users',
      },
      {
        title: 'System Logs',
        value: metricValue(metrics?.totalLogs),
        subtitle: 'View detailed service logs',
        icon: MdReceiptLong,
        color: 'blue',
        href: '/superadmin/system-logs',
      },
      {
        title: 'Support Tickets',
        value: metricValue(metrics?.openSupportTickets),
        subtitle: `${metricValue(metrics?.totalSupportTickets)} total tickets`,
        icon: MdChatBubbleOutline,
        color: 'orange',
        href: '/superadmin/support',
      },
      {
        title: 'Discovery Activity',
        value: metricValue(metrics?.discoveryEventsToday),
        subtitle: 'Events logged today',
        icon: MdSearch,
        color: 'rose',
      },
      {
        title: 'New Chats',
        value: metricValue(metrics?.conversationsToday),
        subtitle: 'Started today',
        icon: MdMessage,
        color: 'teal',
      },
      {
        title: 'New Buddy Groups',
        value: metricValue(metrics?.buddyGroupsToday),
        subtitle: 'Created today',
        icon: MdGroup,
        color: 'indigo',
      },
    ],
    [metrics]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-spaceGrotesk text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Key metrics, trends and platform health</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Window</span>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setRange(opt)}
                className={`px-3 py-1.5 text-sm rounded-md ${
                  range === opt ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                }`}
              >
                {opt}d
              </button>
            ))}
          </div>

          <Link
            href="/superadmin/system-logs"
            className="ml-2 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium"
          >
            <MdReceiptLong size={17} />
            System Logs
          </Link>
          <Link
            href="/superadmin/operations"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium"
          >
            Operations
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            icon={card.icon}
            color={card.color}
            loading={metricsLoading}
            href={card.href}
          />
        ))}
      </div>

      <MatchQualityPanel
        data={metrics?.matchQuality}
        loading={metricsLoading}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TrendChart
          title="User Signups"
          subtitle={`Daily signups over the last ${range} days`}
          data={charts?.users || []}
          lines={[{ key: 'count', label: 'Signups', color: '#2563eb' }]}
          loading={chartsLoading}
        />

        <TrendChart
          title="Properties Created"
          subtitle={`Daily listing creation over the last ${range} days`}
          data={charts?.properties || []}
          lines={[{ key: 'count', label: 'Properties', color: '#10b981' }]}
          loading={chartsLoading}
        />

        <TrendChart
          title="Reports Trend"
          subtitle={`Moderation inflow and outcomes over the last ${range} days`}
          data={charts?.reports || []}
          lines={[
            { key: 'total', label: 'Total', color: '#8b5cf6' },
            { key: 'pending', label: 'Pending', color: '#f59e0b' },
            { key: 'resolved', label: 'Resolved', color: '#10b981' },
            { key: 'dismissed', label: 'Dismissed', color: '#64748b' },
          ]}
          loading={chartsLoading}
        />

        <TrendChart
          title="System Error Logs"
          subtitle={`Daily error volume over the last ${range} days`}
          data={charts?.errorLogs || []}
          lines={[{ key: 'count', label: 'Errors', color: '#ef4444' }]}
          loading={chartsLoading}
        />
      </div>
    </div>
  );
}
