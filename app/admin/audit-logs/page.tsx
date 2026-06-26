'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import * as auditService from '@/lib/audit';

// shadcn/ui imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

// lucide-react icons
import {
  Search, Filter, Clock, User, FileText, Calendar,
  ChevronLeft, ChevronRight, BarChart3, Activity,
  Users, Settings, Terminal, Database, ArrowRight
} from 'lucide-react';

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const { toast } = useToast();

  // Action type styling mapping (Tailwind CSS classes)
  const actionStyles: Record<string, { bg: string; text: string; border: string }> = {
    'User Approved': { bg: 'bg-blue-50/60 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/30' },
    'User Rejected': { bg: 'bg-rose-50/60 dark:bg-rose-950/20', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-900/30' },
    'Login': { bg: 'bg-sky-50/60 dark:bg-sky-950/20', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-100 dark:border-sky-900/30' },
    'Logout': { bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700/30' },
    'Sales Created': { bg: 'bg-emerald-50/60 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
    'Sales Updated': { bg: 'bg-teal-50/60 dark:bg-teal-950/20', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-100 dark:border-teal-900/30' },
    'Expenses Created': { bg: 'bg-amber-50/60 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/30' },
    'Expense Updated': { bg: 'bg-orange-50/60 dark:bg-orange-950/20', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-900/30' },
    'Inventory Issued': { bg: 'bg-indigo-50/60 dark:bg-indigo-950/20', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-900/30' },
    'Inventory Updated': { bg: 'bg-violet-50/60 dark:bg-violet-950/20', text: 'text-violet-700 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-900/30' },
    'Password Changed': { bg: 'bg-purple-50/60 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900/30' },
    'Permission Updated': { bg: 'bg-fuchsia-50/60 dark:bg-fuchsia-950/20', text: 'text-fuchsia-700 dark:text-fuchsia-400', border: 'border-fuchsia-100 dark:border-fuchsia-900/30' },
    default: { bg: 'bg-slate-50 dark:bg-slate-900/40', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200/60 dark:border-slate-800' }
  };

  const formatTimestamp = (dateString: string): string => {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  };

  const getActionBadgeStyle = (action: string) => {
    return actionStyles[action] || actionStyles.default;
  };

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
        ...(searchQuery && { search: searchQuery }),
        ...(actionFilter && actionFilter !== 'All' && { action: actionFilter }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo })
      });

      const response = await fetch(`/api/audit-logs?${queryParams.toString()}`);
      if (!response.ok) throw new Error(`Failed to fetch audit logs: ${response.status}`);

      const result = await response.json();
      const data = result.data || result;
      setAuditLogs(data.logs || []);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Security Sync Failure',
        description: 'Failed to synchronize system audit trails. Please reload.',
        variant: 'destructive'
      });
      setAuditLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, actionFilter, dateFrom, dateTo, toast]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // ── FIX 2 & 3: Pagination handlers (were missing entirely) ──────────────────
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    if (currentPage * pageSize < totalCount) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  // ────────────────────────────────────────────────────────────────────────────

  const today = new Date().toISOString().split('T')[0];
  const todaysActions = auditLogs.filter(log =>
    new Date(log.created_at).toISOString().split('T')[0] === today
  ).length;
  const uniqueActors = new Set(auditLogs.map(log => log.actor_id)).size;
  const uniqueActions = new Set(auditLogs.map(log => log.action)).size;

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAuditLogs();
  };

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);
  const rangeText = totalCount === 0 ? '0-0' : `${startIndex}-${endIndex}`;

  if (loading && auditLogs.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="h-10 w-10 text-primary border-t-primary animate-spin" />
          <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">Parsing Registry Trails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-50 selection:bg-primary/20">

      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[35%] h-[35%] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[130px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-10 space-y-8 z-10">

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60 pb-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
              System Audit Logs
            </h1>
            <p className="text-sm font-medium text-muted-foreground">
              Immutable telemetry registry for real-time compliance and critical platform events.
            </p>
          </div>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border-slate-200/60 dark:border-slate-800/50 shadow-sm transition-all hover:-translate-y-0.5">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Registers</p>
                <p className="text-3xl font-bold tracking-tight">{totalCount}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                <BarChart3 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border-slate-200/60 dark:border-slate-800/50 shadow-sm transition-all hover:-translate-y-0.5">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Ingress</p>
                <p className="text-3xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{todaysActions}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                <Activity className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border-slate-200/60 dark:border-slate-800/50 shadow-sm transition-all hover:-translate-y-0.5">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unique Actors</p>
                <p className="text-3xl font-bold tracking-tight">{uniqueActors}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
                <Users className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border-slate-200/60 dark:border-slate-800/50 shadow-sm transition-all hover:-translate-y-0.5">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unique Methods</p>
                <p className="text-3xl font-bold tracking-tight">{uniqueActions}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
                <Settings className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Interactive Filters Card */}
        <Card className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border-slate-200/60 dark:border-slate-800/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 tracking-tight">
              <Filter className="w-4 h-4 text-primary" /> Control Toolbar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFilterSubmit} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 items-end">

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Lookup Scope</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Search context or actor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Action Specifier</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20">
                    <SelectValue placeholder="All Matrix Actions" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="All">All Scope Logs</SelectItem>
                    <SelectItem value="sales.create">Sales Created</SelectItem>
                    <SelectItem value="sales.update">Sales Updated</SelectItem>
                    <SelectItem value="inventory.create">Inventory Created</SelectItem>
                    <SelectItem value="inventory.update">Inventory Updated</SelectItem>
                    <SelectItem value="expenses.create">Expenses Created</SelectItem>
                    <SelectItem value="expenses.update">Expenses Updated</SelectItem>
                    <SelectItem value="user.approve">User Approved</SelectItem>
                    <SelectItem value="user.reject">User Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Temporal Boundary From</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-primary/20 text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Temporal Boundary To</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-11 bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-primary/20 text-slate-700 dark:text-slate-300"
                />
              </div>

              <Button type="submit" className="h-11 rounded-xl w-full font-semibold shadow-md shadow-primary/10 transition-all hover:brightness-110">
                <Filter className="mr-2 h-4 w-4" /> Sync Filters
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Audit Log Entries Table Container */}
        <Card className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border-slate-200/60 dark:border-slate-800/50 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Telemetry Matrix</CardTitle>
              <CardDescription className="text-xs mt-0.5">Live execution pipeline logs.</CardDescription>
            </div>
            <div className="text-xs font-bold text-muted-foreground bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-200/30 dark:border-slate-700/30">
              Showing {rangeText} of {totalCount} Records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50/70 dark:bg-slate-950/30 border-b border-slate-200/60 dark:border-slate-800/60">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Timestamp</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Actor Auth Hash</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Action Routine</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Schema</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Entity Identifier</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground text-clip">Payload Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {auditLogs.length === 0 ? (
                  // ── FIX 1: was </div> — corrected to </tr> ──────────────────
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                        <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <Database className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Zero Query Matches</p>
                          <p className="text-xs text-muted-foreground">No platform records mirror the requested active parameters. Shift filter constraints.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                  // ────────────────────────────────────────────────────────────
                ) : (
                  auditLogs.map((log) => {
                    const badge = getActionBadgeStyle(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                            {formatTimestamp(log.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                              {log.actor_id ? `${log.actor_id.substring(0, 8)}...` : 'SYSTEM_KERNEL'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className={cn("rounded-md px-2.5 py-0.5 text-[11px] font-bold border shadow-none tracking-wide", badge.bg, badge.text, badge.border)}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400 font-medium text-xs">
                          {log.target_table ? (
                            <span className="flex items-center gap-1.5">
                              <Terminal className="w-3 h-3 text-slate-400" />
                              {log.target_table}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-500 font-mono text-xs">
                          {log.target_id || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <details className="cursor-pointer group/details inline-block text-left">
                            <summary className="list-none flex items-center justify-end gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline outline-none select-none">
                              Inspect <ArrowRight className="w-3 h-3 group-hover/details:translate-x-0.5 transition-transform" />
                            </summary>
                            <div className="fixed md:absolute right-6 mt-2 z-50 min-w-[280px] sm:min-w-[380px] max-w-lg bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl text-left animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
                              <div className="flex items-center justify-between mb-2 border-b dark:border-slate-800 pb-1.5">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Context Payload</span>
                              </div>
                              <pre className="text-[11px] font-mono leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg overflow-auto max-h-56 border border-slate-200/60 dark:border-slate-800">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </details>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Interactive Shadcn Pagination Core */}
          {totalCount > pageSize && (
            <div className="flex items-center justify-between p-5 border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/10">
              <span className="text-xs font-semibold text-muted-foreground">
                Showing entries <span className="text-slate-900 dark:text-slate-200">{rangeText}</span> out of <span className="text-slate-900 dark:text-slate-200">{totalCount}</span>
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="text-xs font-bold bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 min-w-[70px] text-center shadow-sm">
                  Page {currentPage}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={currentPage * pageSize >= totalCount}
                  className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-primary/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}