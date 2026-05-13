import React from "react";
import { Link } from "react-router-dom";
import { useLiveTracking } from "../context/TrackingContext";
import { 
  ArrowLeft, 
  RefreshCcw, 
  Clock, 
  Navigation,
} from "lucide-react";

const TrackingFullscreenMapPage: React.FC = () => {
  const {
    driversList,
    selectedDriverId,
    selectedDriver,
    setSelectedDriverId,
    zoom,
    setZoom,
    mapCenter,
    setMapCenter,
    isManualPan,
    setIsManualPan,
    handlePan,
    VIEWPORT_W,
    VIEWPORT_H,
    getOsmSvgPixel,
    osmTiles,
  } = useLiveTracking();

  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle left click
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

    // Delta pixels mapped to delta tile coordinates
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

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setZoom((z) => Math.min(18, z + 1));
    } else if (e.deltaY > 0) {
      setZoom((z) => Math.max(10, z - 1));
    }
  };

  return (
    <div className="absolute inset-0 bg-[#EAE8E3] overflow-hidden flex flex-col z-50">
      {/* Top Floating Header */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <Link 
          to="/tracking" 
          className="flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-silver/60 text-charcoal font-black text-xs hover:bg-silver/10 transition-colors pointer-events-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {isManualPan && (
          <button
            onClick={() => setIsManualPan(false)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 text-xs hover:bg-primary/90 transition-colors pointer-events-auto animate-in fade-in"
          >
            <RefreshCcw className="w-4 h-4" /> Recenter Map
          </button>
        )}
      </div>

      {/* Main Map Container */}
      <div 
        className={`relative flex-1 w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* 1. Map Tiles Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div 
            style={{ width: VIEWPORT_W, height: VIEWPORT_H, position: 'relative' }} 
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

        {/* 2. SVG Overlays */}
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
                    strokeWidth={isSelected ? "6" : "4"}
                    strokeOpacity="0.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Glowing trail core overlay */}
                  <polyline
                    points={pointsStr}
                    fill="none"
                    stroke={isSelected ? "#F59E0B" : "#10B981"}
                    strokeWidth={isSelected ? "4" : "3"}
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
                    r={isSelected ? "32" : "20"}
                    fill={isSelected ? "#F59E0B" : "#059669"}
                    className="opacity-25 animate-ping"
                  />

                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? "14" : "10"}
                    fill={isSelected ? "#F59E0B" : "#059669"}
                    stroke="#ffffff"
                    strokeWidth="3"
                    className="drop-shadow-lg"
                  />

                  <circle cx={pt.x} cy={pt.y} r={isSelected ? "4" : "3"} fill="#ffffff" />

                  <foreignObject x={pt.x + 18} y={pt.y - 14} width="200" height="40" className="pointer-events-none">
                    <div className="flex items-center gap-2 px-3 py-1 bg-charcoal/90 backdrop-blur-md rounded-lg text-white shadow-xl border border-white/10 w-fit">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-bold tracking-tight truncate font-sans">
                        {drv.driver_name || drv.driver_id}
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Empty state overlay */}
        {driversList.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/40 backdrop-blur-sm z-10">
            <Navigation className="w-16 h-16 text-primary animate-bounce mb-4 opacity-60" />
            <p className="text-lg font-black text-charcoal">Awaiting Active GPS Broadcast Stream</p>
            <p className="text-sm text-charcoal/60 max-w-md mt-2 font-medium">
              Awaiting drivers to connect and broadcast location. Please check the connection status in the dashboard.
            </p>
          </div>
        )}



        {/* Active Drivers Info Bottom Left */}
        <div className="absolute bottom-6 left-6 pointer-events-none z-20">
          {driversList.length > 0 && (
            <div className="bg-white/95 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-silver/60 w-80 max-h-[60vh] overflow-y-auto pointer-events-auto animate-in slide-in-from-bottom-4 duration-300 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-silver/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-silver/60">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-sm font-black text-charcoal uppercase tracking-wider">
                  Active Drivers
                </h3>
                <span className="text-xs font-black bg-primary/10 text-primary px-2 py-1 rounded-lg">
                  {driversList.length} Online
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {driversList.map((driver) => {
                  const isSelected = driver.driver_id === selectedDriverId;
                  return (
                    <div 
                      key={driver.driver_id}
                      onClick={() => {
                        setSelectedDriverId(driver.driver_id);
                        setMapCenter({ lat: driver.lat, lng: driver.lng });
                        setIsManualPan(false);
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-amber-50 border-amber-200 shadow-md ring-2 ring-amber-400/20" 
                          : "bg-white border-silver/40 hover:border-primary/30 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                          {isSelected && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-widest rounded mb-1.5 inline-block">
                              Target Focused
                            </span>
                          )}
                          <h4 className="text-sm font-black text-charcoal tracking-tight truncate">
                            {driver.driver_name || driver.driver_id}
                          </h4>
                          <div className="text-[10px] font-mono text-charcoal/50 mt-0.5">ID: {driver.driver_id}</div>
                        </div>
                        {isSelected && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDriverId(null);
                              setIsManualPan(false);
                            }}
                            className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-amber-200/50 hover:bg-amber-200 text-amber-900 transition-colors font-bold text-sm"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                      <div className={`grid grid-cols-2 gap-2 text-[10px] p-2 rounded-xl font-mono ${isSelected ? 'bg-amber-100/50' : 'bg-silver/10'}`}>
                        <div>
                          <span className="text-charcoal/50 block text-[8px] font-sans font-black uppercase tracking-wider mb-0.5">Lat</span>
                          {driver.lat.toFixed(5)}
                        </div>
                        <div>
                          <span className="text-charcoal/50 block text-[8px] font-sans font-black uppercase tracking-wider mb-0.5">Lng</span>
                          {driver.lng.toFixed(5)}
                        </div>
                      </div>
                      <div className="mt-2 text-[9px] text-charcoal/50 flex items-center gap-1 font-medium">
                        <Clock className={`w-3 h-3 shrink-0 ${isSelected ? 'text-amber-500' : 'text-primary'}`} /> Updated:{" "}
                        {driver.last_updated.toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackingFullscreenMapPage;
