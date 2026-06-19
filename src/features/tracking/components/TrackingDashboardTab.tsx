import React from "react";
import { useLiveTracking } from "../context/TrackingContext";
import {
  MapPin,
  Clock,
  RefreshCcw,
  Wifi,
  WifiOff
} from "lucide-react";

const TrackingDashboardTab: React.FC = () => {
  const {
    isConnected,
    driversList,
    selectedDriverId,
    setSelectedDriverId,
    selectedDriver,
    zoom,
    setZoom,
    mapCenter,
    setMapCenter,
    isManualPan,
    setIsManualPan,
    connectWebSocket,
    disconnectWebSocket,
    VIEWPORT_W,
    VIEWPORT_H,
    getOsmSvgPixel,
    osmTiles,
  } = useLiveTracking();

  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [mapContainerNode, setMapContainerNode] = React.useState<HTMLDivElement | null>(null);

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
      {/* Full Width OpenStreetMap Live Feed Panel */}
      <div className="w-full bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden flex flex-col h-[600px]">
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-[11px] text-charcoal/50 font-medium animate-in fade-in">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>{" "}
                Pilot Node
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-amber-500 inline-block"></span>{" "}
                Breadcrumbs Path
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-blue-500 inline-block"></span>{" "}
                Planned Route
              </span>
            </div>

            {isConnected ? (
              <button
                onClick={disconnectWebSocket}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-650 text-white font-bold rounded-lg transition-all shadow-xs text-[10px] tracking-wider uppercase cursor-pointer"
              >
                <WifiOff className="w-3.5 h-3.5" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={connectWebSocket}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg transition-all shadow-xs text-[10px] tracking-wider uppercase cursor-pointer animate-pulse"
              >
                <Wifi className="w-3.5 h-3.5" />
                Connect
              </button>
            )}
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
                  .filter(([lng, lat]: [number, number]) => lat && lng)
                  .map(([lng, lat]: [number, number]) => {
                    const pt = getOsmSvgPixel(lat, lng);
                    return `${pt.x},${pt.y}`;
                  });

                const currentPt = getOsmSvgPixel(drv.lat, drv.lng);
                pathPoints.push(`${currentPt.x},${currentPt.y}`);

                const pointsStr = pathPoints.join(" ");

                return (
                  <g key={`trail-${drv.driver_id}`}>
                    {/* Render planned route */}
                    {drv.planned_route && drv.planned_route.length >= 2 && (
                      <polyline
                        points={drv.planned_route
                          .filter(([lng, lat]: [number, number]) => lat && lng)
                          .map(([lng, lat]: [number, number]) => {
                            const pt = getOsmSvgPixel(lat, lng);
                            return `${pt.x},${pt.y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth={isSelected ? "3.5" : "2"}
                        strokeDasharray="4,4"
                        strokeOpacity="0.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                    {/* Shadow outline */}
                    <polyline
                      points={pointsStr}
                      fill="none"
                      stroke="#000000"
                      strokeWidth={isSelected ? "5" : "3"}
                      strokeOpacity="0.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Actual trail path */}
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

              {/* Render Stoppage History Nodes */}
              {driversList.map((drv) => {
                if (!drv.stoppage_history) return null;
                const isSelected = drv.driver_id === selectedDriverId;
                return drv.stoppage_history.map((stop: any, idx: number) => {
                  const pt = getOsmSvgPixel(stop.lat, stop.lng);
                  return (
                    <g
                      key={`stop-${drv.driver_id}-${idx}`}
                      className="transition-all duration-300 pointer-events-auto cursor-help"
                    >
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? "12" : "8"}
                        fill="#EF4444"
                        className="opacity-75 animate-pulse"
                      />
                      <text
                        x={pt.x}
                        y={pt.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontSize: isSelected ? "13px" : "10px", userSelect: "none" }}
                      >
                        🛑
                      </text>
                      <title>
                        {`Stoppage Details for ${drv.driver_name}:
Duration: ${stop.duration_minutes} mins
Unproductive: ${stop.unproductive_minutes} mins
Allowance: ${stop.allowance_minutes} mins
Near Customers: ${stop.near_customers}`}
                      </title>
                    </g>
                  );
                });
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
                OpenStreetMap tiles are initialized correctly. Simulation or WebSocket tracking broadcasts will display live tracking overlays.
              </p>
            </div>
          )}

          {/* Interactive selection bottom-left details overlay card */}
          <div className="absolute bottom-3 left-3 pointer-events-none z-10">
            {selectedDriver && (
              <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-silver/60 w-72 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
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
                <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-silver/10 p-2 rounded-lg font-mono mb-2">
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

                {/* New Telemetry Details */}
                {(selectedDriver.distance_km !== undefined || selectedDriver.actual_distance_km !== undefined) && (
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] border-t border-silver/30 pt-2 mb-2">
                    <div>
                      <span className="text-charcoal/40 block text-[8px] font-sans font-bold uppercase">
                        Planned Dist
                      </span>
                      <span className="font-bold font-mono">
                        {selectedDriver.distance_km !== undefined ? `${selectedDriver.distance_km} km` : "--"}
                      </span>
                    </div>
                    <div>
                      <span className="text-charcoal/40 block text-[8px] font-sans font-bold uppercase">
                        Actual Dist
                      </span>
                      <span className="font-bold font-mono text-emerald-600">
                        {selectedDriver.actual_distance_km !== undefined ? `${selectedDriver.actual_distance_km} km` : "--"}
                      </span>
                    </div>
                  </div>
                )}

                {(selectedDriver.actual_duration_minutes !== undefined || selectedDriver.stoppage_duration_minutes !== undefined) && (
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] border-t border-silver/30 pt-2 mb-2">
                    <div>
                      <span className="text-charcoal/40 block text-[8px] font-sans font-bold uppercase">
                        Actual Duration
                      </span>
                      <span className="font-bold font-mono">
                        {selectedDriver.actual_duration_minutes !== undefined ? `${selectedDriver.actual_duration_minutes} min` : "--"}
                      </span>
                    </div>
                    <div>
                      <span className="text-charcoal/40 block text-[8px] font-sans font-bold uppercase">
                        Stoppage Time
                      </span>
                      <span className="font-bold font-mono text-amber-600">
                        {selectedDriver.stoppage_duration_minutes !== undefined ? `${selectedDriver.stoppage_duration_minutes} min` : "--"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Stoppage Alerts */}
                {selectedDriver.stoppage_history && selectedDriver.stoppage_history.length > 0 && (
                  <div className="border-t border-silver/30 pt-2 mb-2">
                    <span className="text-[8px] font-black uppercase text-rose-600 block tracking-wider mb-1">
                      ⚠️ Live Stoppage Alert
                    </span>
                    {selectedDriver.stoppage_history.slice(0, 1).map((stop: any, i: number) => (
                      <div key={i} className="bg-rose-50 border border-rose-100 p-2 rounded-xl text-[9px] text-rose-900 leading-tight">
                        <div>Duration: <span className="font-bold">{stop.duration_minutes} min</span></div>
                        <div className="mt-0.5 text-rose-700/80">Unproductive: <span className="font-bold">{stop.unproductive_minutes} min</span> (near {stop.near_customers} cust)</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-1.5 text-[9px] text-charcoal/50 flex items-center gap-1 font-medium border-t border-silver/30 pt-1.5">
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
    </div>
  );
};

export default TrackingDashboardTab;
