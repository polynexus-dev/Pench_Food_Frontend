import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  Radio,
  Navigation,
  Activity,
  Wifi,
  WifiOff,
  MapPin,
  User,
  Clock,
  Terminal,
  Trash2,
  Sparkles,
  Plus,
  Minus,
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface DriverLocationState {
  driver_id: string;
  driver_name: string;
  lat: number;
  lng: number;
  trail: [number, number][]; // Array of [lng, lat] pairs
  last_updated: Date;
}

interface LogMessage {
  id: string;
  timestamp: Date;
  type: "info" | "broadcast" | "error" | "success";
  message: string;
  payload?: any;
}

const LiveTrackingPage: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant) || "nagpur";
  const accessToken = useAuthStore((state) => state.accessToken);

  // Formulate default ws host
  const defaultHost = `${tenant}.pench.api.polynexus.in`;
  const defaultWssUrl = `wss://${defaultHost}/ws/tracking/`;
  const defaultWsUrl = `ws://${defaultHost}/ws/tracking/`;

  const [wsUrl, setWsUrl] = useState<string>(defaultWssUrl);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [drivers, setDrivers] = useState<Record<string, DriverLocationState>>({});
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [protocol, setProtocol] = useState<"wss" | "ws">("wss");

  // OpenStreetMap active projection states
  const [zoom, setZoom] = useState<number>(14);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 21.1458, lng: 79.0882 });
  const [isManualPan, setIsManualPan] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const simulationIntervalRef = useRef<any>(null);

  // Sync protocol buttons with URL string easily
  const handleProtocolChange = (newProtocol: "wss" | "ws") => {
    setProtocol(newProtocol);
    if (newProtocol === "wss") {
      setWsUrl(defaultWssUrl);
    } else {
      setWsUrl(defaultWsUrl);
    }
  };

  const addLog = (type: LogMessage["type"], message: string, payload?: any) => {
    const newLog: LogMessage = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      type,
      message,
      payload,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
  };

  // WebSocket Connection Handlers
  const connectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // Append JWT Access Token automatically to handshake query string for admin authentication
      let finalEndpointUrl = wsUrl;
      if (accessToken) {
        const char = finalEndpointUrl.includes("?") ? "&" : "?";
        finalEndpointUrl = `${finalEndpointUrl}${char}token=${accessToken}`;
      }

      addLog("info", `Attempting secure connection to target socket stream...`, { 
        baseEndpoint: wsUrl, 
        tokenAttached: !!accessToken 
      });
      const socket = new WebSocket(finalEndpointUrl);

      socket.onopen = () => {
        setIsConnected(true);
        addLog("success", "WebSocket connected successfully. Joining Monitoring Group as Admin.");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "broadcast_location" || (data.driver_id && data.lat && data.lng)) {
            // Log incoming telemetry stream
            addLog("broadcast", `Location broadcast received: ${data.driver_name || data.driver_id}`, data);

            setDrivers((prev) => ({
              ...prev,
              [data.driver_id]: {
                driver_id: data.driver_id,
                driver_name: data.driver_name || `Driver #${data.driver_id}`,
                lat: parseFloat(data.lat),
                lng: parseFloat(data.lng),
                trail: Array.isArray(data.trail) ? data.trail : [],
                last_updated: new Date(),
              },
            }));

            // Auto select if none selected
            setSelectedDriverId((prevId) => prevId || data.driver_id);
          } else {
            addLog("info", "Received non-telemetry message", data);
          }
        } catch (err) {
          addLog("error", "Failed to parse incoming WebSocket message payload", event.data);
        }
      };

      socket.onerror = () => {
        setIsConnected(false);
        addLog("error", "WebSocket connection error encountered. Verify host and network configurations.");
      };

      socket.onclose = () => {
        setIsConnected(false);
        addLog("info", "WebSocket connection terminated.");
      };

      wsRef.current = socket;
    } catch (err: any) {
      addLog("error", `Failed to instantiate WebSocket client: ${err.message}`);
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    addLog("info", "Disconnected manually by Administrator.");
  };

  // Auto clean up websocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  // Live Driver Simulation Generator to showcase rich features dynamically
  const toggleSimulation = () => {
    if (isSimulating) {
      clearInterval(simulationIntervalRef.current);
      setIsSimulating(false);
      addLog("info", "Live location simulation stopped.");
    } else {
      setIsSimulating(true);
      addLog("success", "Simulation mode initialized. Generating simulated tracking broadcasts...");

      // Prepopulate simulation state
      const simulatedDriversList = [
        {
          id: "DRV-101",
          name: "Rajesh Kumar",
          baseLat: 21.1458,
          baseLng: 79.0882,
          deltaLat: 0.0004,
          deltaLng: 0.0003,
          trail: [[79.0800, 21.1400], [79.0840, 21.1430]],
        },
        {
          id: "DRV-102",
          name: "Suresh Yadav",
          baseLat: 21.1300,
          baseLng: 79.0700,
          deltaLat: -0.0002,
          deltaLng: 0.0005,
          trail: [[79.0600, 21.1250], [79.0650, 21.1280]],
        },
        {
          id: "DRV-103",
          name: "Amit Patel",
          baseLat: 21.1600,
          baseLng: 79.1000,
          deltaLat: 0.0003,
          deltaLng: -0.0004,
          trail: [[79.1100, 21.1650], [79.1050, 21.1620]],
        },
      ];

      // Inject initial state immediately
      simulatedDriversList.forEach((drv) => {
        const currentLng = drv.baseLng;
        const currentLat = drv.baseLat;
        const payload = {
          type: "broadcast_location",
          driver_id: drv.id,
          driver_name: drv.name,
          lat: currentLat,
          lng: currentLng,
          trail: [...drv.trail, [currentLng, currentLat]],
        };

        setDrivers((prev) => ({
          ...prev,
          [drv.id]: {
            driver_id: drv.id,
            driver_name: drv.name,
            lat: currentLat,
            lng: currentLng,
            trail: payload.trail as [number, number][],
            last_updated: new Date(),
          },
        }));
      });

      // Periodic incremental step updater
      simulationIntervalRef.current = setInterval(() => {
        simulatedDriversList.forEach((drv) => {
          // calculate semi-random vector step
          drv.baseLat += drv.deltaLat + (Math.random() - 0.5) * 0.0002;
          drv.baseLng += drv.deltaLng + (Math.random() - 0.5) * 0.0002;

          // bounce bounds to stay near center
          if (drv.baseLat > 21.18 || drv.baseLat < 21.10) drv.deltaLat *= -1;
          if (drv.baseLng > 79.13 || drv.baseLng < 79.04) drv.deltaLng *= -1;

          // add to simulated trail
          drv.trail.push([drv.baseLng, drv.baseLat]);
          if (drv.trail.length > 20) drv.trail.shift(); // keep max 20 breadcrumbs

          const mockData = {
            type: "broadcast_location",
            driver_id: drv.id,
            driver_name: drv.name,
            lat: parseFloat(drv.baseLat.toFixed(5)),
            lng: parseFloat(drv.baseLng.toFixed(5)),
            trail: [...drv.trail],
          };

          // trigger local message parser
          addLog("broadcast", `[SIM] Broadcast: ${drv.name}`, mockData);
          setDrivers((prev) => ({
            ...prev,
            [drv.id]: {
              driver_id: drv.id,
              driver_name: drv.name,
              lat: mockData.lat,
              lng: mockData.lng,
              trail: mockData.trail as [number, number][],
              last_updated: new Date(),
            },
          }));
        });
      }, 4000);
    }
  };

  const driversList = Object.values(drivers);
  const selectedDriver = selectedDriverId ? drivers[selectedDriverId] : null;

  // Synchronize map center automatically with tracking updates unless user manually overrides panning
  useEffect(() => {
    if (driversList.length > 0 && !isManualPan) {
      if (selectedDriverId && drivers[selectedDriverId]) {
        setMapCenter({
          lat: drivers[selectedDriverId].lat,
          lng: drivers[selectedDriverId].lng,
        });
      } else {
        // Average coordinates of all fleet drivers
        const avgLat = driversList.reduce((sum, d) => sum + d.lat, 0) / driversList.length;
        const avgLng = driversList.reduce((sum, d) => sum + d.lng, 0) / driversList.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
      }
    }
  }, [drivers, selectedDriverId, isManualPan]);

  // Handle explicit pan navigation steps mapping smoothly
  const handlePan = (direction: "up" | "down" | "left" | "right") => {
    setIsManualPan(true);
    const getTileCount = (z: number) => Math.pow(2, z);
    const currentTx = ((mapCenter.lng + 180) / 360) * getTileCount(zoom);
    const latRad = (mapCenter.lat * Math.PI) / 180;
    const currentTy = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * getTileCount(zoom);

    let newTx = currentTx;
    let newTy = currentTy;

    const step = 0.3; // natural map tile movement speed offset
    if (direction === "left") newTx -= step;
    if (direction === "right") newTx += step;
    if (direction === "up") newTy -= step;
    if (direction === "down") newTy += step;

    const newLng = (newTx / getTileCount(zoom)) * 360 - 180;
    const M = Math.PI * (1 - (2 * newTy) / getTileCount(zoom));
    const newLat = (Math.atan(0.5 * (Math.exp(M) - Math.exp(-M))) * 180) / Math.PI;

    setMapCenter({ lat: newLat, lng: newLng });
  };

  // Web Mercator helpers for precise positioning over live OpenStreetMap tile feeds
  const VIEWPORT_W = 800;
  const VIEWPORT_H = 550;

  const centerTxFloat = useMemo(() => {
    return ((mapCenter.lng + 180) / 360) * Math.pow(2, zoom);
  }, [mapCenter.lng, zoom]);

  const centerTyFloat = useMemo(() => {
    const latRad = (mapCenter.lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom);
  }, [mapCenter.lat, zoom]);

  // Convert target GPS coordinates into custom absolute canvas pixels matching underlying street layout
  const getOsmSvgPixel = (targetLat: number, targetLng: number) => {
    const tx = ((targetLng + 180) / 360) * Math.pow(2, zoom);
    const latRad = (targetLat * Math.PI) / 180;
    const ty = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom);

    const px = VIEWPORT_W / 2 + (tx - centerTxFloat) * 256;
    const py = VIEWPORT_H / 2 + (ty - centerTyFloat) * 256;
    return { x: px, y: py };
  };

  // Compute live OSM tile array spanning the visible bounds seamlessly
  const osmTiles = useMemo(() => {
    const baseTx = Math.floor(centerTxFloat);
    const baseTy = Math.floor(centerTyFloat);
    const maxTile = Math.pow(2, zoom);

    const tilesArr = [];
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const tx = baseTx + dx;
        const ty = baseTy + dy;

        if (ty >= 0 && ty < maxTile) {
          const wrappedTx = ((tx % maxTile) + maxTile) % maxTile;
          const leftPx = VIEWPORT_W / 2 + (tx - centerTxFloat) * 256;
          const topPx = VIEWPORT_H / 2 + (ty - centerTyFloat) * 256;

          tilesArr.push({
            key: `${zoom}-${wrappedTx}-${ty}-${dx}`,
            left: leftPx,
            top: topPx,
            url: `https://tile.openstreetmap.org/${zoom}/${wrappedTx}/${ty}.png`,
          });
        }
      }
    }
    return tilesArr;
  }, [centerTxFloat, centerTyFloat, zoom]);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Top Banner and Navigation Bar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-accent/20 rounded-2xl text-accent border border-accent/30 shadow-inner">
              <Radio className="w-8 h-8 animate-pulse text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-charcoal tracking-tight flex items-center gap-3">
                Live Fleet Tracking
                <span className="text-xs font-black px-3 py-1 bg-primary/10 text-primary rounded-full tracking-widest uppercase flex items-center gap-1.5 border border-primary/20">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}></span>
                  {isConnected ? "Live Broadcast" : "Offline"}
                </span>
              </h1>
              <p className="text-charcoal/50 font-medium mt-1">
                Real-time WebSocket driver monitoring & breadcrumb GPS trails feed.
              </p>
            </div>
          </div>
        </div>

        {/* Global Connection Statistics Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSimulation}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all shadow-sm border ${
              isSimulating
                ? "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100"
                : "bg-white text-charcoal border-silver/50 hover:bg-silver/10"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isSimulating ? "text-amber-600 animate-spin" : "text-accent"}`} />
            {isSimulating ? "Stop Simulation" : "Simulate Live Broadcast"}
          </button>
        </div>
      </div>

      {/* Control Station Connection Configuration Bar */}
      <div className="bg-gradient-to-r from-primary/5 via-sage/5 to-accent/5 p-6 rounded-3xl border border-primary/10 mb-8 shadow-sm">
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    protocol === "wss" ? "bg-primary text-white shadow-sm" : "text-charcoal/40 hover:text-charcoal"
                  }`}
                >
                  WSS://
                </button>
                <button
                  type="button"
                  onClick={() => handleProtocolChange("ws")}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    protocol === "ws" ? "bg-primary text-white shadow-sm" : "text-charcoal/40 hover:text-charcoal"
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
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[11px] text-charcoal/40 italic">
                Connected endpoints map dynamic route authorization streams instantly. Edit host string directly if connecting to custom instances.
              </p>
              {accessToken && (
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 select-none">
                  🔐 JWT Auth Token Attached
                </span>
              )}
            </div>
          </div>

          <div className="flex items-end gap-3 shrink-0 pt-2 lg:pt-0">
            {isConnected ? (
              <button
                onClick={disconnectWebSocket}
                className="flex items-center gap-2 px-6 py-3.5 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-all shadow-md shadow-red-500/10 text-xs tracking-wider uppercase"
              >
                <WifiOff className="w-4 h-4" />
                Disconnect Stream
              </button>
            ) : (
              <button
                onClick={connectWebSocket}
                className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 text-xs tracking-wider uppercase animate-pulse"
              >
                <Wifi className="w-4 h-4" />
                Establish Listener
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Master Content Dashboard Area Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Left Span 2: Premium Visual Grid Radar Dashboard */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden flex flex-col h-[550px]">
          {/* Header Controls inside map view */}
          <div className="px-6 py-4 bg-silver/5 border-b border-silver/30 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="text-base">🗺️</span>
              <span className="text-xs font-black uppercase tracking-widest text-charcoal">OpenStreetMap Live Feed</span>
              {isManualPan && (
                <button
                  onClick={() => setIsManualPan(false)}
                  className="ml-2 flex items-center gap-1 text-[10px] font-black bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors"
                  title="Snap back to automatically tracking fleet locations"
                >
                  <RefreshCcw className="w-2.5 h-2.5" /> Recenter Map
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-charcoal/50 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary inline-block"></span> Pilot Node
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-amber-500 inline-block"></span> Breadcrumbs Path
              </span>
            </div>
          </div>

          {/* Core Embedded OpenStreetMap Dynamic Mercator Tile Grid Plane */}
          <div className="flex-1 bg-[#EAE8E3] relative overflow-hidden group">
            {/* 1. Map Tiles Background Container */}
            <div className="absolute inset-0 pointer-events-none">
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
                    // Fail gracefully if high zooms lack tile caches locally
                    e.currentTarget.style.opacity = "0.2";
                  }}
                />
              ))}
            </div>

            {/* 2. Overlaid SVGs rendering driver pointers & polylines natively */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
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

                // append real time state coordinate
                const currentPt = getOsmSvgPixel(drv.lat, drv.lng);
                pathPoints.push(`${currentPt.x},${currentPt.y}`);

                const pointsStr = pathPoints.join(" ");

                return (
                  <g key={`trail-${drv.driver_id}`}>
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
                    {/* Glowing trail core overlay */}
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
                    {/* Pulse ring */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? "28" : "18"}
                      fill={isSelected ? "#F59E0B" : "#059669"}
                      className="opacity-25 animate-ping"
                    />

                    {/* Outer marker pin circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? "11" : "8"}
                      fill={isSelected ? "#F59E0B" : "#059669"}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="drop-shadow-md"
                    />

                    {/* Dot anchor */}
                    <circle cx={pt.x} cy={pt.y} r={isSelected ? "3" : "2"} fill="#ffffff" />

                    {/* Beautiful text label tooltip */}
                    <foreignObject x={pt.x + 14} y={pt.y - 12} width="160" height="30" className="pointer-events-none">
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

            {/* Empty view screen fallback overlay */}
            {driversList.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/70 backdrop-blur-xs">
                <Navigation className="w-12 h-12 text-primary animate-bounce mb-3 opacity-60" />
                <p className="text-sm font-black text-charcoal">Awaiting Active GPS Broadcast Stream</p>
                <p className="text-xs text-charcoal/50 max-w-sm mt-1 font-medium">
                  OpenStreetMap tiles are initialized correctly. Connect client listener above or toggle simulation engine to view full tracking overlays directly.
                </p>
              </div>
            )}

            {/* 3. Embedded Native Controller HUD Overlay (Zoom +/- & Panning Controls) */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none select-none">
              {/* Zoom Panel */}
              <div className="bg-white rounded-xl shadow-lg border border-silver/60 flex flex-col overflow-hidden pointer-events-auto">
                <button
                  onClick={() => setZoom((z) => Math.min(18, z + 1))}
                  className="p-2 hover:bg-silver/20 text-charcoal transition-colors border-b border-silver/40 flex items-center justify-center font-black"
                  title="Zoom In"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="px-2 py-1 text-[10px] font-mono font-black text-center bg-silver/10 text-charcoal/60">
                  {zoom}z
                </div>
                <button
                  onClick={() => setZoom((z) => Math.max(10, z - 1))}
                  className="p-2 hover:bg-silver/20 text-charcoal transition-colors flex items-center justify-center font-black"
                  title="Zoom Out"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              {/* Directional Navigation Pad */}
              <div className="bg-white p-1.5 rounded-xl shadow-lg border border-silver/60 grid grid-cols-3 gap-1 pointer-events-auto w-20 h-20 items-center justify-center text-charcoal/70">
                <div></div>
                <button
                  onClick={() => handlePan("up")}
                  className="p-1 hover:bg-silver/20 rounded hover:text-primary transition-colors flex items-center justify-center"
                  title="Pan North"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <div></div>
                <button
                  onClick={() => handlePan("left")}
                  className="p-1 hover:bg-silver/20 rounded hover:text-primary transition-colors flex items-center justify-center"
                  title="Pan West"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <div className="w-2 h-2 rounded-full bg-silver/40 mx-auto"></div>
                <button
                  onClick={() => handlePan("right")}
                  className="p-1 hover:bg-silver/20 rounded hover:text-primary transition-colors flex items-center justify-center"
                  title="Pan East"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div></div>
                <button
                  onClick={() => handlePan("down")}
                  className="p-1 hover:bg-silver/20 rounded hover:text-primary transition-colors flex items-center justify-center"
                  title="Pan South"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

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
                      className="text-charcoal/30 hover:text-charcoal font-bold text-xs px-1"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-silver/10 p-2 rounded-lg font-mono">
                    <div>
                      <span className="text-charcoal/40 block text-[8px] font-sans font-bold uppercase">Lat</span>
                      {selectedDriver.lat.toFixed(5)}
                    </div>
                    <div>
                      <span className="text-charcoal/40 block text-[8px] font-sans font-bold uppercase">Lng</span>
                      {selectedDriver.lng.toFixed(5)}
                    </div>
                  </div>
                  <div className="mt-1.5 text-[9px] text-charcoal/50 flex items-center gap-1 font-medium">
                    <Clock className="w-2.5 h-2.5 text-primary shrink-0" /> Updated:{" "}
                    {selectedDriver.last_updated.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

            {/* Official OpenStreetMap Attribution Banner Footer */}
            <div className="absolute bottom-1 right-1 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-charcoal/70 pointer-events-auto border border-white/40 shadow-xs select-none">
              © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-primary font-medium">OpenStreetMap</a> contributors
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
              <p className="text-[11px] text-charcoal/40 font-medium">Drivers sending WS payload ticks</p>
            </div>
            <span className="px-2.5 py-1 bg-primary/10 text-primary font-black rounded-lg text-xs leading-none">
              {driversList.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {driversList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <MapPin className="w-8 h-8 text-charcoal/20 mb-2" />
                <p className="text-xs font-bold text-charcoal/40">No Driver Tracking Entries</p>
                <p className="text-[10px] text-charcoal/30 mt-1">Updates parse automatically upon broadcast reception.</p>
              </div>
            ) : (
              driversList.map((drv) => {
                const isSelected = drv.driver_id === selectedDriverId;
                return (
                  <div
                    key={drv.driver_id}
                    onClick={() => setSelectedDriverId(drv.driver_id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? "bg-accent/10 border-accent shadow-md shadow-accent/5 scale-[1.01]"
                        : "bg-white border-silver/60 hover:border-primary/30 hover:bg-silver/5"
                    }`}
                  >
                    {/* Active highlight side tag */}
                    {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent"></div>}

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
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></span> Live
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-silver/30 text-[10px] font-mono">
                      <div>
                        <span className="text-charcoal/40 font-sans block text-[8px] uppercase font-bold">Coordinates</span>
                        {drv.lat.toFixed(4)}, {drv.lng.toFixed(4)}
                      </div>
                      <div className="text-right">
                        <span className="text-charcoal/40 font-sans block text-[8px] uppercase font-bold">Trail Points</span>
                        {drv.trail.length} nodes
                      </div>
                    </div>

                    <div className="mt-2 text-[9px] text-charcoal/40 flex items-center justify-between font-sans">
                      <span>Last refresh: {drv.last_updated.toLocaleTimeString()}</span>
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
        {/* Terminal Header Tabs */}
        <div className="px-6 py-3.5 bg-[#2C2C2E] border-b border-charcoal/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-white tracking-wider">WebSocket Message Console Broadcast Logs</span>
            <span className="text-[10px] px-2 py-0.5 bg-black/30 text-white/50 rounded-md">
              {logs.length} packet payloads recorded
            </span>
          </div>

          <button
            onClick={() => setLogs([])}
            className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-white/40 hover:text-white transition-colors bg-white/5 px-2.5 py-1 rounded-lg"
          >
            <Trash2 className="w-3 h-3" /> Clear Console Buffer
          </button>
        </div>

        {/* Logs Output Lines container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs custom-scrollbar">
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/20 italic font-sans text-xs">
              No packet events recorded yet. Connect to host stream to catch serialized frame arrays.
            </div>
          ) : (
            logs.map((log) => {
              // Set appropriate syntax highlighting classes based on event nature
              let colorClass = "text-white/80";
              let badgeBg = "bg-white/10 text-white/60";

              if (log.type === "broadcast") {
                colorClass = "text-emerald-400";
                badgeBg = "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
              } else if (log.type === "success") {
                colorClass = "text-cyan-400";
                badgeBg = "bg-cyan-500/20 text-cyan-300";
              } else if (log.type === "error") {
                colorClass = "text-rose-400";
                badgeBg = "bg-rose-500/20 text-rose-300";
              }

              return (
                <div key={log.id} className="leading-relaxed hover:bg-white/5 p-1.5 rounded transition-colors font-mono">
                  <div className="flex items-start gap-3">
                    <span className="text-white/30 text-[10px] shrink-0 pt-0.5 select-none">
                      [{log.timestamp.toLocaleTimeString()}]
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${badgeBg}`}>
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

export default LiveTrackingPage;
