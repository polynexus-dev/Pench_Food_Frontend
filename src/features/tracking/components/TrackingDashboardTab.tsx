import React from "react";
import { useLiveTracking } from "../context/TrackingContext";
import {
  Activity,
  Wifi,
  WifiOff,
  MapPin,
  User,
  Clock,
  Terminal,
  Trash2,
  RefreshCcw,
  ChevronDown
} from "lucide-react";
import { driverApi } from "../../drivers/api/driverApi";
import type { Driver } from "../../drivers/components/types";

const TrackingDashboardTab: React.FC = () => {
  const {
    wsUrl,
    setWsUrl,
    isConnected,
    driversList,
    logs,
    setLogs,
    selectedDriverId,
    setSelectedDriverId,
    selectedDriver,
    protocol,
    zoom,
    setZoom,
    mapCenter,
    setMapCenter,
    isManualPan,
    setIsManualPan,
    handleProtocolChange,
    connectWebSocket,
    disconnectWebSocket,
    VIEWPORT_W,
    VIEWPORT_H,
    getOsmSvgPixel,
    osmTiles,
    driverUserId,
    setDriverUserId,
  } = useLiveTracking();

  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [mapContainerNode, setMapContainerNode] = React.useState<HTMLDivElement | null>(null);
  const [dbDrivers, setDbDrivers] = React.useState<Driver[]>([]);

  React.useEffect(() => {
    const fetchDbDrivers = async () => {
      try {
        const list = await driverApi.getDrivers();
        setDbDrivers(list);
      } catch (err) {
        console.error("Failed to load drivers for tracking select:", err);
      }
    };
    fetchDbDrivers();
  }, []);

  React.useEffect(() => {
    if (!mapContainerNode) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(18, z + 1));
      } else if (e.deltaY > 0) {
        setZoom((z) => Math.max(10, z - 1));
      }
    };

    mapContainerNode.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      mapContainerNode.removeEventListener("wheel", handleNativeWheel);
    };
  }, [mapContainerNode, setZoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsManualPan(true);
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    const getTileCount = (z: number) => Math.pow(2, z);
    const currentTx = ((mapCenter.lng + 180) / 360) * getTileCount(zoom);
    const latRad = (mapCenter.lat * Math.PI) / 180;
    const currentTy =
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      getTileCount(zoom);

    const newTx = currentTx - deltaX / 256;
    const newTy = currentTy - deltaY / 256;

    const newLng = (newTx / getTileCount(zoom)) * 360 - 180;
    const M = Math.PI * (1 - (2 * newTy) / getTileCount(zoom));
    const newLat =
      (Math.atan(0.5 * (Math.exp(M) - Math.exp(-M))) * 180) / Math.PI;

    setMapCenter({ lat: newLat, lng: newLng });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Control Station Connection Configuration Bar */}
      <div className="bg-gradient-to-r from-primary/5 via-sage/5 to-accent/5 p-6 rounded-3xl border border-primary/10 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          <div className="flex-1">
            <label className="block text-xs font-black uppercase tracking-widest text-charcoal/60 mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Target WebSocket URL Connection Endpoint
            </label>
            <div className="flex gap-2">
              <div className="flex bg-white rounded-xl border border-silver/80 overflow-hidden p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleProtocolChange("wss")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${protocol === "wss"
                      ? "bg-primary text-white shadow-sm"
                      : "text-charcoal/40 hover:text-charcoal"
                    }`}
                >
                  WSS://
                </button>
                <button
                  type="button"
                  onClick={() => handleProtocolChange("ws")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${protocol === "ws"
                      ? "bg-primary text-white shadow-sm"
                      : "text-charcoal/40 hover:text-charcoal"
                    }`}
                >
                  WS://
                </button>
              </div>
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                placeholder="wss://nagpur.pench.api.polynexus.in/ws/tracking/"
                className="flex-1 px-4 py-2.5 bg-white border border-silver/80 rounded-xl text-xs font-mono font-bold text-charcoal focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <div className="relative shrink-0 md:w-60">
                <select
                  value={driverUserId}
                  onChange={(e) => setDriverUserId(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-silver/80 rounded-xl text-xs font-bold text-charcoal focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- General Tracking --</option>
                  {dbDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.full_name} (ID: #{d.id})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-charcoal/40 italic">
                Connected endpoints map dynamic route authorization streams
                instantly. Edit host string directly if connecting to custom
                instances.
              </p>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 select-none">
                🔐 JWT Auth Token Attached
              </span>
            </div>
          </div>

          <div className="flex items-end gap-3 shrink-0 pt-2 lg:pt-0">
            {isConnected ? (
              <button
                onClick={disconnectWebSocket}
                className="flex items-center gap-2 px-6 py-3.5 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-md shadow-red-500/10 text-xs tracking-wider uppercase cursor-pointer"
              >
                <WifiOff className="w-4 h-4" />
                Disconnect Stream
              </button>
            ) : (
              <button
                onClick={connectWebSocket}
                className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 text-xs tracking-wider uppercase animate-pulse cursor-pointer"
              >
                <Wifi className="w-4 h-4" />
                Establish Listener
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Master Content Dashboard Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Span 2: Premium Visual Grid Radar Dashboard */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden flex flex-col h-[550px]">
          {/* Header Controls inside map view */}
          <div className="px-6 py-4 bg-silver/5 border-b border-silver/30 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="text-base">🗺️</span>
              <span className="text-xs font-black uppercase tracking-widest text-charcoal">
                OpenStreetMap Live Feed
              </span>
              {isManualPan && (
                <button
                  onClick={() => setIsManualPan(false)}
                  className="ml-2 flex items-center gap-1 text-[10px] font-black bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                  title="Snap back to automatically tracking fleet locations"
                >
                  <RefreshCcw className="w-2.5 h-2.5" /> Recenter Map
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-charcoal/50 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>{" "}
                Pilot Node
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-amber-500 inline-block"></span>{" "}
                Breadcrumbs Path
              </span>
            </div>
          </div>

          {/* Core Embedded OpenStreetMap Dynamic Mercator Tile Grid Plane */}
          <div
            ref={setMapContainerNode}
            className={`flex-1 bg-[#EAE8E3] relative overflow-hidden group ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 1. Map Tiles Background Container */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              <div
                style={{
                  width: VIEWPORT_W,
                  height: VIEWPORT_H,
                  position: "relative",
                }}
                className="shrink-0"
              >
                {osmTiles.map((tile) => (
                  <img
                    key={tile.key}
                    src={tile.url}
                    alt="map tile"
                    className="absolute w-[256px] h-[256px] object-cover transition-opacity duration-300 select-none"
                    style={{
                      left: `${tile.left}px`,
                      top: `${tile.top}px`,
                    }}
                    onError={(e) => {
                      e.currentTarget.style.opacity = "0.2";
                    }}
                  />
                ))}
              </div>
            </div>

            {/* 2. Overlaid SVGs rendering driver pointers & polylines natively */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
              <svg
                className="shrink-0 pointer-events-none"
                width={VIEWPORT_W}
                height={VIEWPORT_H}
                viewBox={`0 0 ${VIEWPORT_W} ${VIEWPORT_H}`}
                preserveAspectRatio="xMidYMid slice"
              >
                {/* Render polylines connected path */}
                {driversList.map((drv) => {
                  if (drv.trail.length < 2 && !drv.lat) return null;

                  const isSelected = drv.driver_id === selectedDriverId;
                  const pathPoints = drv.trail
                    .filter(([lng, lat]) => lat && lng)
                    .map(([lng, lat]) => {
                      const pt = getOsmSvgPixel(lat, lng);
                      return `${pt.x},${pt.y}`;
                    });

                  const currentPt = getOsmSvgPixel(drv.lat, drv.lng);
                  pathPoints.push(`${currentPt.x},${currentPt.y}`);

                  const pointsStr = pathPoints.join(" ");

                  return (
                    <g key={`trail-${drv.driver_id}`}>
                      <polyline
                        points={pointsStr}
                        fill="none"
                        stroke="#000000"
                        strokeWidth={isSelected ? "5" : "3"}
                        strokeOpacity="0.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points={pointsStr}
                        fill="none"
                        stroke={isSelected ? "#F59E0B" : "#10B981"}
                        strokeWidth={isSelected ? "3" : "2"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })}

                {/* Render Pilot interactive nodes */}
                {driversList.map((drv) => {
                  const pt = getOsmSvgPixel(drv.lat, drv.lng);
                  const isSelected = drv.driver_id === selectedDriverId;

                  return (
                    <g
                      key={`node-${drv.driver_id}`}
                      className="cursor-pointer transition-all duration-300 pointer-events-auto"
                      onClick={() => {
                        setSelectedDriverId(drv.driver_id);
                        setMapCenter({ lat: drv.lat, lng: drv.lng });
                        setIsManualPan(false);
                      }}
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? "32" : "22"}
                        fill={isSelected ? "#F59E0B" : "#059669"}
                        className="opacity-25 animate-ping"
                        style={{
                          transformOrigin: "center",
                          transformBox: "fill-box",
                        }}
                      />

                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? "16" : "12"}
                        fill={isSelected ? "#F59E0B" : "#059669"}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="drop-shadow-md"
                      />

                      <text
                        x={pt.x}
                        y={pt.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontSize: isSelected ? "18px" : "13px", userSelect: "none" }}
                      >
                        🏍️
                      </text>

                      <foreignObject
                        x={pt.x + 14}
                        y={pt.y - 12}
                        width="160"
                        height="30"
                        className="pointer-events-none"
                      >
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-charcoal/90 backdrop-blur-xs rounded-md text-white shadow-md border border-white/10">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-[10px] font-bold tracking-tight truncate font-sans">
                            {drv.driver_name || drv.driver_id}
                          </span>
                        </div>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Empty view screen fallback overlay */}
            {driversList.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/70 backdrop-blur-xs">
                <MapPin className="w-12 h-12 text-primary animate-bounce mb-3 opacity-60" />
                <p className="text-sm font-black text-charcoal">
                  Awaiting Active GPS Broadcast Stream
                </p>
                <p className="text-xs text-charcoal/50 max-w-sm mt-1 font-medium">
                  OpenStreetMap tiles are initialized correctly. Connect client
                  listener above or toggle simulation engine to view live
                  tracking overlays.
                </p>
              </div>
            )}

            {/* Interactive selection bottom-left details overlay card */}
            <div className="absolute bottom-3 left-3 pointer-events-none z-10">
              {selectedDriver && (
                <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-silver/60 w-64 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[8px] font-black px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider rounded">
                        Target Focused
                      </span>
                      <h4 className="text-xs font-black text-charcoal tracking-tight mt-1 truncate">
                        {selectedDriver.driver_name}
                      </h4>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedDriverId(null);
                        setIsManualPan(false);
                      }}
                      className="text-charcoal/30 hover:text-charcoal font-bold text-xs px-1 cursor-pointer"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-silver/10 p-2 rounded-lg font-mono">
                    <div>
                      <span className="text-charcoal/40 block text-[8px] font-sans font-bold uppercase">
                        Lat
                      </span>
                      {selectedDriver.lat.toFixed(5)}
                    </div>
                    <div>
                      <span className="text-charcoal/40 block text-[8px] font-sans font-bold uppercase">
                        Lng
                      </span>
                      {selectedDriver.lng.toFixed(5)}
                    </div>
                  </div>
                  <div className="mt-1.5 text-[9px] text-charcoal/50 flex items-center gap-1 font-medium">
                    <Clock className="w-2.5 h-2.5 text-primary shrink-0" />{" "}
                    Updated: {selectedDriver.last_updated.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-1 right-1 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-charcoal/70 pointer-events-auto border border-white/40 shadow-xs select-none">
              ©{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-primary font-medium"
              >
                OpenStreetMap
              </a>{" "}
              contributors
            </div>
          </div>
        </div>

        {/* Right Span 1: Connected Drivers Telemetry List */}
        <div className="bg-white rounded-3xl border border-silver/50 shadow-sm flex flex-col h-[550px]">
          <div className="p-6 border-b border-silver/30 flex items-center justify-between">
            <div>
              <h3 className="font-black text-charcoal tracking-tight text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Active Feeds
              </h3>
              <p className="text-[11px] text-charcoal/40 font-medium">
                Riders sending WS payload ticks
              </p>
            </div>
            <span className="px-2.5 py-1 bg-primary/10 text-primary font-black rounded-lg text-xs leading-none">
              {driversList.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {driversList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <MapPin className="w-8 h-8 text-charcoal/20 mb-2" />
                <p className="text-xs font-bold text-charcoal/40">
                  No Rider Tracking Entries
                </p>
                <p className="text-[10px] text-charcoal/30 mt-1">
                  Updates parse automatically upon broadcast reception.
                </p>
              </div>
            ) : (
              driversList.map((drv) => {
                const isSelected = drv.driver_id === selectedDriverId;
                return (
                  <div
                    key={drv.driver_id}
                    onClick={() => setSelectedDriverId(drv.driver_id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${isSelected
                        ? "bg-accent/10 border-accent shadow-md shadow-accent/5 scale-[1.01]"
                        : "bg-white border-silver/60 hover:border-primary/30 hover:bg-silver/5"
                      }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent"></div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-cream rounded-xl flex items-center justify-center font-black text-xs text-primary border border-primary/5">
                          {drv.driver_name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-charcoal group-hover:text-primary transition-colors leading-tight">
                            {drv.driver_name}
                          </h4>
                          <span className="text-[9px] font-mono text-charcoal/40 font-bold tracking-wider">
                            ID: #{drv.driver_id}
                          </span>
                        </div>
                      </div>

                      <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span>{" "}
                        Live
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-silver/30 text-[10px] font-mono">
                      <div>
                        <span className="text-charcoal/40 font-sans block text-[8px] uppercase font-bold">
                          Coordinates
                        </span>
                        {drv.lat.toFixed(4)}, {drv.lng.toFixed(4)}
                      </div>
                      <div className="text-right">
                        <span className="text-charcoal/40 font-sans block text-[8px] uppercase font-bold">
                          Trail Points
                        </span>
                        {drv.trail.length} nodes
                      </div>
                    </div>

                    <div className="mt-2 text-[9px] text-charcoal/40 flex items-center justify-between font-sans">
                      <span>
                        Last refresh: {drv.last_updated.toLocaleTimeString()}
                      </span>
                      <span className="text-primary font-bold group-hover:translate-x-1 transition-transform">
                        Focus Radar &rarr;
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Full width bottom Console Event Logs Telemetry Logger */}
      <div className="bg-[#1C1C1E] rounded-3xl border border-charcoal shadow-xl overflow-hidden flex flex-col h-72 font-mono">
        <div className="px-6 py-3.5 bg-[#2C2C2E] border-b border-charcoal/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-white tracking-wider">
              WebSocket Message Console Broadcast Logs
            </span>
            <span className="text-[10px] px-2 py-0.5 bg-black/30 text-white/50 rounded-md">
              {logs.length} packet payloads recorded
            </span>
          </div>

          <button
            onClick={() => setLogs([])}
            className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-white/40 hover:text-white transition-colors bg-white/5 px-2.5 py-1 rounded-lg cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Clear Console Buffer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs custom-scrollbar">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/20 italic font-sans text-xs">
              No packet events recorded yet. Connect to host stream to catch
              serialized frame arrays.
            </div>
          ) : (
            logs.map((log) => {
              let colorClass = "text-white/80";
              let badgeBg = "bg-white/10 text-white/60";

              if (log.type === "broadcast") {
                colorClass = "text-emerald-400";
                badgeBg =
                  "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
              } else if (log.type === "success") {
                colorClass = "text-cyan-400";
                badgeBg = "bg-cyan-500/20 text-cyan-300";
              } else if (log.type === "error") {
                colorClass = "text-rose-400";
                badgeBg = "bg-rose-500/20 text-rose-300";
              }

              return (
                <div
                  key={log.id}
                  className="leading-relaxed hover:bg-white/5 p-1.5 rounded transition-colors font-mono"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-white/30 text-[10px] shrink-0 pt-0.5 select-none">
                      [{log.timestamp.toLocaleTimeString()}]
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${badgeBg}`}
                    >
                      {log.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={colorClass}>{log.message}</span>
                      {log.payload && (
                        <details className="mt-1 group/details">
                          <summary className="text-[10px] text-white/40 hover:text-accent cursor-pointer select-none">
                            Inspect stringified payload frame &darr;
                          </summary>
                          <pre className="mt-1.5 p-2 bg-black/40 rounded-lg text-[10px] text-white/60 overflow-x-auto border border-white/5 custom-scrollbar">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingDashboardTab;
