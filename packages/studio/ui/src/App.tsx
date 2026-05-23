import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  Search,
  RefreshCw,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Zap,
  Activity,
  Flame,
  X,
  Copy,
  Check,
} from "lucide-react";

interface CacheMetrics {
  hits: number;
  misses: number;
  swrHits: number;
  swrFailures: number;
  stampedeCoalesces: number;
  stampedePolls: number;
}

interface StatusResponse {
  connected: boolean;
  adapter: string;
  metricsEnabled: boolean;
  metrics?: CacheMetrics;
}

interface KeyDetail {
  key: string;
  exists: boolean;
  size: number;
  parsed?: {
    body: string;
    statusCode: number;
    headers: Record<string, string>;
    createdAt: number;
    isBase64?: boolean;
  };
  raw?: string;
}

const getApiUrl = (subpath: string) => {
  let base = window.location.pathname;
  if (!base.endsWith("/")) {
    base += "/";
  }
  if (base.endsWith("/index.html/")) {
    base = base.substring(0, base.length - 11) + "/";
  }
  return `${base}${subpath}`;
};

export default function App() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Fetch status & metrics
  const { data: status } = useQuery<StatusResponse>({
    queryKey: ["status"],
    queryFn: () => fetch(getApiUrl("api/status")).then((r) => r.json()),
  });

  // Fetch all keys
  const {
    data: keysData,
    isLoading: keysLoading,
    refetch: refetchKeys,
  } = useQuery<{ keys: string[] }>({
    queryKey: ["keys"],
    queryFn: () => fetch(getApiUrl("api/keys")).then((r) => r.json()),
  });

  // Fetch selected key details
  const { data: keyDetail, isLoading: detailLoading } = useQuery<KeyDetail>({
    queryKey: ["key-detail", selectedKey],
    queryFn: () =>
      fetch(
        getApiUrl(
          `api/keys/detail?key=${encodeURIComponent(selectedKey || "")}`,
        ),
      ).then((r) => r.json()),
    enabled: !!selectedKey,
  });

  // Purge key mutation
  const purgeMutation = useMutation({
    mutationFn: (key: string) =>
      fetch(getApiUrl("api/purge"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["keys"] });
      if (selectedKey) {
        queryClient.invalidateQueries({
          queryKey: ["key-detail", selectedKey],
        });
      }
    },
  });

  // Purge all keys mutation
  const purgeAllMutation = useMutation({
    mutationFn: () =>
      fetch(getApiUrl("api/purge-all"), {
        method: "POST",
      }),
    onSuccess: () => {
      setSelectedKey(null);
      queryClient.invalidateQueries({ queryKey: ["keys"] });
    },
  });

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const filteredKeys =
    keysData?.keys.filter((k) =>
      k.toLowerCase().includes(searchTerm.toLowerCase()),
    ) || [];

  const metrics = status?.metrics;
  const totalRequests = metrics
    ? metrics.hits + metrics.misses + metrics.swrHits
    : 0;
  const hitRate =
    metrics && totalRequests > 0
      ? Math.round(((metrics.hits + metrics.swrHits) / totalRequests) * 100)
      : 0;

  // Determine value type/display representation
  const getKeyType = (detail: KeyDetail) => {
    if (!detail.parsed) return "Counter/Raw";
    const contentType = detail.parsed.headers["content-type"] || "";
    if (contentType.includes("application/json")) return "JSON Response";
    if (contentType.includes("text/html")) return "HTML Page";
    if (detail.parsed.isBase64) return "Binary Buffer";
    return "HTTP Response";
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/30">
            <Layers className="h-6 w-6 text-sky-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">
              Cache Studio
            </h1>
            <p className="text-xs text-slate-400 flex items-center space-x-1">
              <span className="font-medium text-slate-300">
                @express-route-cache
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs">
            <Database className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-slate-400 font-medium">Adapter:</span>
            <span className="text-sky-300 capitalize font-semibold">
              {status?.adapter || "Loading..."}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status?.connected
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-red-500"
              }`}
            />
            <span className="text-xs font-semibold text-slate-300">
              {status?.connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-auto p-6 space-y-6">
        {/* Telemetry Metrics */}
        {status?.metricsEnabled && metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Hit Rate */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>HIT RATE</span>
                <Zap className="h-4 w-4 text-sky-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {hitRate}%
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                Of {totalRequests} total requests
              </div>
            </div>

            {/* Cache Hits */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>CACHE HITS</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {metrics.hits}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                Served fresh instantly
              </div>
            </div>

            {/* Cache Misses */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>CACHE MISSES</span>
                <AlertTriangle className="h-4 w-4 text-amber-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {metrics.misses}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                Routed to database/handler
              </div>
            </div>

            {/* SWR Hits */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>SWR HITS</span>
                <Activity className="h-4 w-4 text-purple-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {metrics.swrHits}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                Served stale + SWR revalidation
              </div>
            </div>

            {/* Coalesces */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>COALESCES</span>
                <Flame className="h-4 w-4 text-orange-400" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {metrics.stampedeCoalesces}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                Coalesced in-flight requests
              </div>
            </div>

            {/* Failures */}
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>SWR FAILURES</span>
                <X className="h-4 w-4 text-rose-500" />
              </div>
              <div className="mt-2 flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-white">
                  {metrics.swrFailures}
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500">
                Revalidation failures
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/20 border border-slate-800 flex items-center space-x-3 text-sm text-slate-400">
            <Info className="h-5 w-5 text-sky-400 shrink-0" />
            <span>
              Metrics collection is disabled. Set{" "}
              <code className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 font-mono text-xs">
                metrics: true
              </code>{" "}
              in your cache configuration to enable real-time telemetry and
              charts.
            </span>
          </div>
        )}

        {/* Content Section: Table & Panel */}
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Table Container */}
          <div className="flex-1 rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col min-h-[500px]">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-slate-800 gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search cache keys..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-950 border border-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => refetchKeys()}
                  className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg hover:bg-slate-900/80 transition"
                  title="Refresh keys"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${keysLoading ? "animate-spin" : ""}`}
                  />
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to clear the entire cache?",
                      )
                    ) {
                      purgeAllMutation.mutate();
                    }
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg flex items-center space-x-1.5 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Purge All</span>
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto max-h-[600px]">
              {keysLoading ? (
                <div className="flex items-center justify-center h-64 text-sm text-slate-500">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Loading cache keys...
                </div>
              ) : filteredKeys.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-sm text-slate-500 space-y-2">
                  <Database className="h-10 w-10 text-slate-700" />
                  <span>No cache keys found matching search.</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/20 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3">Key Pattern / Hash</th>
                      <th className="px-6 py-3 w-32 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredKeys.map((key) => (
                      <tr
                        key={key}
                        onClick={() => setSelectedKey(key)}
                        className={`border-b border-slate-800 hover:bg-slate-800/20 cursor-pointer transition ${
                          selectedKey === key
                            ? "bg-sky-500/5 border-l-2 border-l-sky-500"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm break-all font-medium text-slate-300">
                            {key}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Purge cache key: ${key}?`)) {
                                purgeMutation.mutate(key);
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                            title="Delete key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center bg-slate-900/10">
              <span>
                Showing {filteredKeys.length} of {keysData?.keys.length || 0}{" "}
                keys
              </span>
              {status?.adapter === "memcached" && (
                <span className="text-amber-500 flex items-center space-x-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Memcached does not support key listing</span>
                </span>
              )}
            </div>
          </div>

          {/* Key Detail Panel */}
          {selectedKey && (
            <div className="w-full lg:w-[480px] rounded-xl bg-slate-900/40 border border-slate-800 flex flex-col min-h-[500px] relative">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-sm font-semibold text-slate-300">
                  <FileText className="h-4 w-4 text-sky-400" />
                  <span>Key Details</span>
                </div>
                <button
                  onClick={() => setSelectedKey(null)}
                  className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {detailLoading ? (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-500">
                  <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                  Loading details...
                </div>
              ) : keyDetail && keyDetail.exists ? (
                <div className="flex-1 overflow-auto p-4 space-y-4 text-xs">
                  {/* Meta Details */}
                  <div className="space-y-2.5 p-3 rounded-lg bg-slate-950 border border-slate-850">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Full Key:</span>
                      <span className="font-mono text-slate-300 break-all select-all ml-4 text-right">
                        {keyDetail.key}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payload Type:</span>
                      <span className="font-semibold text-sky-400">
                        {getKeyType(keyDetail)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cache Size:</span>
                      <span className="font-medium text-slate-300">
                        {formatSize(keyDetail.size)}
                      </span>
                    </div>
                    {keyDetail.parsed && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">HTTP Status:</span>
                          <span
                            className={`font-semibold ${
                              keyDetail.parsed.statusCode < 300
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            {keyDetail.parsed.statusCode}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Cached Time:</span>
                          <span className="text-slate-300 flex items-center space-x-1">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span>
                              {new Date(
                                keyDetail.parsed.createdAt,
                              ).toLocaleString()}
                            </span>
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* HTTP Headers */}
                  {keyDetail.parsed && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400">
                          Response Headers
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(
                                keyDetail.parsed?.headers,
                                null,
                                2,
                              ),
                              "headers",
                            )
                          }
                          className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-slate-200"
                        >
                          {copiedSection === "headers" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 font-mono overflow-auto max-h-48 whitespace-pre text-slate-400">
                        {Object.entries(keyDetail.parsed.headers).map(
                          ([k, v]) => (
                            <div
                              key={k}
                              className="flex justify-between border-b border-slate-900 py-1 last:border-0"
                            >
                              <span className="text-sky-400">{k}:</span>
                              <span className="text-slate-300 text-right break-all ml-4">
                                {v}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cache Body */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-400">
                        Cached Response Body
                      </span>
                      <button
                        onClick={() => {
                          const bodyText = keyDetail.parsed
                            ? keyDetail.parsed.isBase64
                              ? atob(keyDetail.parsed.body)
                              : keyDetail.parsed.body
                            : keyDetail.raw || "";
                          handleCopy(bodyText, "body");
                        }}
                        className="p-1 hover:bg-slate-800 rounded transition text-slate-400 hover:text-slate-200"
                      >
                        {copiedSection === "body" ? (
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 font-mono overflow-auto max-h-96 text-slate-300">
                      {keyDetail.parsed ? (
                        keyDetail.parsed.headers["content-type"]?.includes(
                          "application/json",
                        ) ? (
                          <pre className="text-slate-300 whitespace-pre-wrap break-all">
                            {(() => {
                              try {
                                const bodyString = keyDetail.parsed.isBase64
                                  ? atob(keyDetail.parsed.body)
                                  : keyDetail.parsed.body;
                                return JSON.stringify(
                                  JSON.parse(bodyString),
                                  null,
                                  2,
                                );
                              } catch {
                                return keyDetail.parsed.isBase64
                                  ? atob(keyDetail.parsed.body)
                                  : keyDetail.parsed.body;
                              }
                            })()}
                          </pre>
                        ) : (
                          <pre className="text-slate-300 whitespace-pre-wrap break-all">
                            {keyDetail.parsed.isBase64
                              ? atob(keyDetail.parsed.body)
                              : keyDetail.parsed.body}
                          </pre>
                        )
                      ) : (
                        <pre className="text-slate-300 whitespace-pre-wrap break-all">
                          {keyDetail.raw}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-sm text-slate-500 space-y-2">
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                  <span>Key no longer exists or expired.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
