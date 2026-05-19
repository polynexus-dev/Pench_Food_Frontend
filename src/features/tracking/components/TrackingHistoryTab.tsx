import React, { useState, useEffect, useMemo, useRef } from "react";
import { trackingApi } from "../api/trackingApi";
import type { DriverRouteHistory, PositionHistoryPoint, LiveDriverTracking } from "../api/trackingApi";
import { CustomSelect } from "../../../components/common/CustomSelect";
import { CustomInput } from "../../../components/common/CustomInput";
import {
  Calendar,
  User,
  MapPin,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Zap,
  Gauge,
  Layers,
  ArrowRight,
  TrendingUp,
  Award,
  AlertCircle,
  RefreshCcw
} from "lucide-react";

const TrackingHistoryTab: React.FC = () => {
  const [drivers, setDrivers] = useState<LiveDriverTracking[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [history, setHistory] = useState<DriverRouteHistory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDriversLoading, setIsDriversLoading] = useState<boolean>(false);

  // Playback Control States
  const [playbackIndex, setPlaybackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1); // 1x, 2x, 5x, 10x
  const playbackTimerRef = useRef<any>(null);

  // Map Navigation States
  const [zoom, setZoom] = useState<number>(14);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 21.1458, lng: 79.0882 });
  const [isManualPan, setIsManualPan] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
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
  }, [mapContainerNode]);

  // Map Constants
  const VIEWPORT_W = 1200;
  const VIEWPORT_H = 500;

  // Load Drivers list
  useEffect(() => {
    const fetchDrivers = async () => {
      setIsDriversLoading(true);
      try {
        const data = await trackingApi.getLiveDrivers();
        setDrivers(data);
        if (data.length > 0) {
          setSelectedDriverId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load drivers for history selection", err);
      } finally {
        setIsDriversLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  const driverOptions = useMemo(() => {
    return drivers.map((d) => ({
      label: d.driver_name,
      value: d.id,
    }));
  }, [drivers]);

  // Fetch History when driver or date changes
  useEffect(() => {
    if (!selectedDriverId) return;
    
    const fetchHistory = async () => {
      setIsLoading(true);
      setIsPlaying(false);
      setPlaybackIndex(0);
      try {
        const data = await trackingApi.getDriverHistory(selectedDriverId, selectedDate);
        setHistory(data);
        
        // Auto center map to first point in the history route
        if (data.route && data.route.length > 0) {
          setMapCenter({ lat: data.route[0].lat, lng: data.route[0].lng });
          setIsManualPan(false);
        }
      } catch (err) {
        console.error("Failed to load tracking history", err);
        setHistory(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [selectedDriverId, selectedDate]);

  // Handle Playback Interval
  useEffect(() => {
    if (isPlaying && history && history.route.length > 0) {
      const intervalDuration = Math.max(100, 1000 / playbackSpeed);
      playbackTimerRef.current = setInterval(() => {
        setPlaybackIndex((prev) => {
          if (prev >= history.route.length - 1) {
            setIsPlaying(false);
            clearInterval(playbackTimerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, intervalDuration);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    }

    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, history]);

  // Sync map center with current playback point unless user manually panned
  useEffect(() => {
    if (history && history.route && history.route.length > 0 && !isManualPan) {
      const currentPoint = history.route[playbackIndex];
      if (currentPoint) {
        setMapCenter({ lat: currentPoint.lat, lng: currentPoint.lng });
      }
    }
  }, [playbackIndex, history, isManualPan]);

  // Web Mercator Calculations
  const centerTxFloat = useMemo(() => {
    return ((mapCenter.lng + 180) / 360) * Math.pow(2, zoom);
  }, [mapCenter.lng, zoom]);

  const centerTyFloat = useMemo(() => {
    const latRad = (mapCenter.lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom);
  }, [mapCenter.lat, zoom]);

  const getOsmSvgPixel = (targetLat: number, targetLng: number) => {
    const tx = ((targetLng + 180) / 360) * Math.pow(2, zoom);
    const latRad = (targetLat * Math.PI) / 180;
    const ty = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom);

    const px = VIEWPORT_W / 2 + (tx - centerTxFloat) * 256;
    const py = VIEWPORT_H / 2 + (ty - centerTyFloat) * 256;
    return { x: px, y: py };
  };

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
            key: `${zoom}-${wrappedTx}-${ty}`,
            left: leftPx,
            top: topPx,
            url: `https://tile.openstreetmap.org/${zoom}/${wrappedTx}/${ty}.png`,
          });
        }
      }
    }
    return tilesArr;
  }, [centerTxFloat, centerTyFloat, zoom]);

  // Dragging Handlers for Map
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
    const currentTy = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * getTileCount(zoom);

    const newTx = currentTx - (deltaX / 256);
    const newTy = currentTy - (deltaY / 256);

    const newLng = (newTx / getTileCount(zoom)) * 360 - 180;
    const M = Math.PI * (1 - (2 * newTy) / getTileCount(zoom));
    const newLat = (Math.atan(0.5 * (Math.exp(M) - Math.exp(-M))) * 180) / Math.PI;

    setMapCenter({ lat: newLat, lng: newLng });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Safe point calculations
  const routePoints = history?.route || [];
  const currentPlaybackPoint = routePoints[playbackIndex] || null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filtering Selector Control Bar */}
      <div className="bg-white p-5 rounded-[24px] border border-silver/50 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto">
          {/* Driver Selector */}
          <div className="w-full md:w-64">
            <CustomSelect
              label="Driver"
              icon={User}
              value={selectedDriverId}
              onChange={setSelectedDriverId}
              options={driverOptions}
              placeholder={isDriversLoading ? "Loading drivers..." : "Select driver"}
              buttonClassName="text-xs font-bold py-2"
            />
          </div>

          {/* Date Selector */}
          <div className="w-full md:w-56">
            <CustomInput
              label="Date"
              icon={Calendar}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              inputClassName="text-xs font-bold py-2"
            />
          </div>
        </div>

        <p className="text-[10px] text-charcoal/40 font-bold uppercase tracking-wider">
          Querying historic telemetry archives
        </p>
      </div>

      {isLoading ? (
        <div className="h-[600px] bg-white rounded-3xl border border-silver/50 shadow-sm flex items-center justify-center flex-col gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-charcoal/40">Fetching tracking history trail...</p>
        </div>
      ) : history && routePoints.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Map Viewer (Span 3) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden flex flex-col h-[500px]">
              {/* Map Header */}
              <div className="px-6 py-4 bg-silver/5 border-b border-silver/30 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <span className="text-base">🗺️</span>
                  <span className="text-xs font-black uppercase tracking-widest text-charcoal">
                    Historical Route Path ({routePoints.length} points)
                  </span>
                  {isManualPan && (
                    <button
                      onClick={() => setIsManualPan(false)}
                      className="ml-2 flex items-center gap-1 text-[10px] font-black bg-primary/10 text-primary hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      <RefreshCcw className="w-2.5 h-2.5" /> Recenter on Pilot
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-charcoal/50 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block border border-white shadow-xs"></span>
                    Starting Node
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block border border-white shadow-xs"></span>
                    Destination
                  </span>
                </div>
              </div>

              {/* Map Canvas */}
              <div
                ref={setMapContainerNode}
                className={`flex-1 bg-[#EAE8E3] relative overflow-hidden group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* 1. Map Tiles Background Container */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                  <div style={{ width: VIEWPORT_W, height: VIEWPORT_H, position: 'relative' }} className="shrink-0">
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
                      />
                    ))}
                  </div>
                </div>

                {/* 2. SVGs Overlays */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                  <svg
                    className="shrink-0"
                    width={VIEWPORT_W}
                    height={VIEWPORT_H}
                    viewBox={`0 0 ${VIEWPORT_W} ${VIEWPORT_H}`}
                  >
                    {/* Render route path */}
                    {(() => {
                      const pointsStr = routePoints
                        .map((pt) => {
                          const svgPt = getOsmSvgPixel(pt.lat, pt.lng);
                          return `${svgPt.x},${svgPt.y}`;
                        })
                        .join(" ");

                      return (
                        <g>
                          <polyline
                            points={pointsStr}
                            fill="none"
                            stroke="#000000"
                            strokeWidth="4"
                            strokeOpacity="0.3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <polyline
                            points={pointsStr}
                            fill="none"
                            stroke="#79A889"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                      );
                    })()}

                    {/* Start Marker */}
                    {(() => {
                      const firstPt = routePoints[0];
                      const svgPt = getOsmSvgPixel(firstPt.lat, firstPt.lng);
                      return (
                        <g>
                          <circle cx={svgPt.x} cy={svgPt.y} r="8" fill="#F59E0B" stroke="#ffffff" strokeWidth="2" className="drop-shadow-xs" />
                          <circle cx={svgPt.x} cy={svgPt.y} r="2.5" fill="#ffffff" />
                        </g>
                      );
                    })()}

                    {/* End Marker */}
                    {(() => {
                      const lastPt = routePoints[routePoints.length - 1];
                      const svgPt = getOsmSvgPixel(lastPt.lat, lastPt.lng);
                      return (
                        <g>
                          <circle cx={svgPt.x} cy={svgPt.y} r="8" fill="#EF4444" stroke="#ffffff" strokeWidth="2" className="drop-shadow-xs" />
                          <circle cx={svgPt.x} cy={svgPt.y} r="2.5" fill="#ffffff" />
                        </g>
                      );
                    })()}

                    {/* Animated Playback Node */}
                    {currentPlaybackPoint && (() => {
                      const svgPt = getOsmSvgPixel(currentPlaybackPoint.lat, currentPlaybackPoint.lng);
                      return (
                        <g>
                          <circle
                            cx={svgPt.x}
                            cy={svgPt.y}
                            r="20"
                            fill="#01522D"
                            className="opacity-20 animate-ping"
                            style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
                          />
                          <circle cx={svgPt.x} cy={svgPt.y} r="9" fill="#01522D" stroke="#ffffff" strokeWidth="2" className="drop-shadow-md" />
                          <circle cx={svgPt.x} cy={svgPt.y} r="3" fill="#ffffff" />
                        </g>
                      );
                    })()}
                  </svg>
                </div>

                <div className="absolute bottom-1 right-1 bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] text-charcoal/70 pointer-events-auto border border-white/40 shadow-xs">
                  © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline hover:text-primary font-medium">OpenStreetMap</a> contributors
                </div>
              </div>

              {/* Playback Controls Footer Toolbar */}
              <div className="p-4 bg-silver/5 border-t border-silver/30 flex flex-col md:flex-row gap-4 items-center justify-between select-none">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 bg-primary hover:bg-primary/95 text-white flex items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                  </button>
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setPlaybackIndex(0);
                    }}
                    className="p-2.5 hover:bg-silver/20 text-charcoal/50 hover:text-charcoal rounded-xl transition-colors cursor-pointer"
                    title="Reset to Start"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {/* Scrubber Range Slider */}
                <div className="flex-1 w-full flex items-center gap-3 px-4">
                  <span className="text-[10px] font-bold font-mono text-charcoal/40">
                    {currentPlaybackPoint ? new Date(currentPlaybackPoint.timestamp).toLocaleTimeString() : "00:00:00"}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={routePoints.length - 1}
                    value={playbackIndex}
                    onChange={(e) => {
                      setPlaybackIndex(parseInt(e.target.value));
                      setIsManualPan(false);
                    }}
                    className="w-full h-1.5 bg-silver/60 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-[10px] font-bold font-mono text-charcoal/40">
                    {routePoints.length > 0 ? new Date(routePoints[routePoints.length - 1].timestamp).toLocaleTimeString() : "00:00:00"}
                  </span>
                </div>

                {/* Speed Controls */}
                <div className="flex bg-white border border-silver/80 rounded-xl overflow-hidden p-1 shrink-0">
                  {[1, 2, 5, 10].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        playbackSpeed === speed
                          ? "bg-primary text-white shadow-xs"
                          : "text-charcoal/40 hover:text-charcoal"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Side Metrics Span (Span 1) */}
          <div className="space-y-6">
            {/* Summary Metrics */}
            <div className="bg-white p-6 rounded-[28px] border border-silver/50 shadow-sm space-y-5">
              <h3 className="text-xs font-black text-charcoal/30 uppercase tracking-[0.2em] flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary/40" />
                Route Diagnostics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-silver/5 border border-silver/40 rounded-2xl">
                  <p className="text-[9px] font-bold text-charcoal/40 uppercase">Total Distance</p>
                  <p className="text-lg font-black text-charcoal mt-1 tracking-tight">{history.total_distance_km} km</p>
                </div>
                <div className="p-4 bg-silver/5 border border-silver/40 rounded-2xl">
                  <p className="text-[9px] font-bold text-charcoal/40 uppercase">Active Time</p>
                  <p className="text-lg font-black text-charcoal mt-1 tracking-tight">{history.active_duration_minutes} mins</p>
                </div>
                <div className="p-4 bg-silver/5 border border-silver/40 rounded-2xl">
                  <p className="text-[9px] font-bold text-charcoal/40 uppercase">Average Speed</p>
                  <p className="text-lg font-black text-charcoal mt-1 tracking-tight">{history.average_speed_kmh} km/h</p>
                </div>
                <div className="p-4 bg-silver/5 border border-silver/40 rounded-2xl">
                  <p className="text-[9px] font-bold text-charcoal/40 uppercase">Stops Recorded</p>
                  <p className="text-lg font-black text-charcoal mt-1 tracking-tight">{history.stops_count} locations</p>
                </div>
              </div>
            </div>

            {/* Playback Focus Point Details */}
            {currentPlaybackPoint && (
              <div className="bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] p-6 rounded-[28px] border border-charcoal shadow-xl text-white space-y-4">
                <h3 className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  Playback Node Telemetry
                </h3>

                <div className="space-y-3 font-mono">
                  <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                    <span className="text-white/40 font-sans font-bold">Timestamp:</span>
                    <span className="font-bold text-accent">{new Date(currentPlaybackPoint.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                    <span className="text-white/40 font-sans font-bold">Speedometer:</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" />
                      {currentPlaybackPoint.speed || 0} km/h
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1 border-b border-white/5">
                    <span className="text-white/40 font-sans font-bold">Battery Level:</span>
                    <span className={`font-bold ${currentPlaybackPoint.battery_level && currentPlaybackPoint.battery_level < 20 ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`}>
                      {currentPlaybackPoint.battery_level || 100}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs py-1">
                    <span className="text-white/40 font-sans font-bold">Accuracy:</span>
                    <span className="font-bold text-white/70">±{currentPlaybackPoint.accuracy || 5}m</span>
                  </div>
                </div>

                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
                  <span className="text-[8px] font-sans font-bold text-white/30 uppercase tracking-widest block">Geocoded Location coordinates</span>
                  <p className="text-[10px] text-white/80 font-bold leading-relaxed flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                    {currentPlaybackPoint.lat.toFixed(5)}, {currentPlaybackPoint.lng.toFixed(5)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-[400px] bg-white rounded-3xl border border-silver/50 shadow-sm flex items-center justify-center flex-col gap-3 p-6 text-center select-none">
          <AlertCircle className="w-12 h-12 text-primary/40 mb-2 animate-bounce" />
          <h4 className="text-sm font-black text-charcoal">No Historical Logs Found</h4>
          <p className="text-xs text-charcoal/50 max-w-sm font-medium leading-relaxed">
            There are no recorded route traces for the selected driver on this date. Choose another partner or specify a different timestamp.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackingHistoryTab;
