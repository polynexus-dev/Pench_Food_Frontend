import React, { useState, useMemo, useEffect, useRef } from "react";
import { Navigation, CheckCircle2, ZoomIn, ZoomOut, Search, User } from "lucide-react";
import type { Route } from "./types";

interface RouteTabProps {
  routes: Route[];
  isLoading: boolean;
}

const RouteTab: React.FC<RouteTabProps> = ({ routes, isLoading }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedRoute = useMemo(() => {
    return routes.find((r) => r.id === selectedRouteId) || null;
  }, [routes, selectedRouteId]);

  // Map State
  const [zoom, setZoom] = useState<number>(13);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 21.1458,
    lng: 79.0882,
  });
  const [isManualPan, setIsManualPan] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Sync map center with selected route
  useEffect(() => {
    if (selectedRoute && selectedRoute.stops.length > 0 && !isManualPan) {
      // Calculate center of stops
      const lats = selectedRoute.stops.map(s => s.latitude);
      const lngs = selectedRoute.stops.map(s => s.longitude);
      const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    } else if (!selectedRouteId && routes.length > 0 && !isManualPan) {
      // Default to first route center
      const firstRoute = routes[0];
      if (firstRoute && firstRoute.stops.length > 0) {
        const lats = firstRoute.stops.map(s => s.latitude);
        const lngs = firstRoute.stops.map(s => s.longitude);
        setMapCenter({ 
          lat: lats.reduce((a, b) => a + b, 0) / lats.length, 
          lng: lngs.reduce((a, b) => a + b, 0) / lngs.length 
        });
      }
    }
  }, [selectedRouteId, selectedRoute, isManualPan, routes]);

  const mapRef = useRef<HTMLDivElement>(null);
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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

  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  const VIEWPORT_W = dimensions.width;
  const VIEWPORT_H = dimensions.height;

  const centerTxFloat = useMemo(() => {
    return ((mapCenter.lng + 180) / 360) * Math.pow(2, zoom);
  }, [mapCenter.lng, zoom]);

  const centerTyFloat = useMemo(() => {
    const latRad = (mapCenter.lat * Math.PI) / 180;
    return (
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
    );
  }, [mapCenter.lat, zoom]);

  const getOsmSvgPixel = (targetLat: number, targetLng: number) => {
    const tx = ((targetLng + 180) / 360) * Math.pow(2, zoom);
    const latRad = (targetLat * Math.PI) / 180;
    const ty =
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom);

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
  }, [centerTxFloat, centerTyFloat, zoom, VIEWPORT_W, VIEWPORT_H]);

  // Handlers
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

    const newTx = currentTx - deltaX / 256;
    const newTy = currentTy - deltaY / 256;
    const newLng = (newTx / getTileCount(zoom)) * 360 - 180;
    const M = Math.PI * (1 - (2 * newTy) / getTileCount(zoom));
    const newLat = (Math.atan(0.5 * (Math.exp(M) - Math.exp(-M))) * 180) / Math.PI;

    setMapCenter({ lat: newLat, lng: newLng });
  };

  const handleMouseUp = () => setIsDragging(false);

  const filteredRoutes = routes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.driver_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] animate-in fade-in duration-500">
      {/* 1. Sidebar: Routes List */}
      <div className="w-full lg:w-[380px] flex flex-col gap-4">
        {/* Search Header */}
        <div className="bg-white p-4 rounded-3xl border border-silver/50 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
            <input
              type="text"
              placeholder="Search routes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-silver/10 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white rounded-3xl border border-silver/50 animate-pulse"></div>
            ))
          ) : filteredRoutes.map(route => (
            <div 
              key={route.id} 
              onClick={() => {
                setSelectedRouteId(route.id);
                setIsManualPan(false);
              }}
              className={`p-5 rounded-3xl border transition-all cursor-pointer group ${
                selectedRouteId === route.id 
                  ? 'bg-primary border-primary shadow-xl shadow-primary/20 text-white' 
                  : 'bg-white border-silver/50 shadow-sm hover:border-primary/30'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl ${selectedRouteId === route.id ? 'bg-white/20' : 'bg-primary/5'}`}>
                  <Navigation className={`w-5 h-5 ${selectedRouteId === route.id ? 'text-white' : 'text-primary'}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                  selectedRouteId === route.id ? 'bg-white/20 text-white' : 'bg-silver/10 text-charcoal/40'
                }`}>
                  {route.is_completed ? 'Completed' : 'Active'}
                </span>
              </div>
              <h4 className="text-sm font-black truncate">{route.name}</h4>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 opacity-60">
                   <User className="w-3 h-3" />
                   <span className="text-[10px] font-bold">{route.driver_name}</span>
                </div>
                <div className="w-1 h-1 bg-current opacity-20 rounded-full"></div>
                <span className="text-[10px] font-bold opacity-60">{route.stops.length} Stops</span>
              </div>
              
              {/* Bottle dispatch requirements */}
              {((route.dispatch_bottles_1L && route.dispatch_bottles_1L > 0) || 
                (route.dispatch_bottles_500ml && route.dispatch_bottles_500ml > 0)) && (
                <div className={`mt-3 pt-3 border-t flex flex-wrap items-center gap-2 ${
                  selectedRouteId === route.id ? 'border-white/10' : 'border-silver/40'
                }`}>
                  <span className={`text-[9px] font-black uppercase tracking-wider opacity-60 mr-1`}>
                    To Carry:
                  </span>
                  {route.dispatch_bottles_1L && route.dispatch_bottles_1L > 0 ? (
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-xl border transition-all ${
                      selectedRouteId === route.id 
                        ? 'bg-white/15 border-white/10 text-white' 
                        : 'bg-emerald-50 border-emerald-100/50 text-emerald-700 shadow-3xs'
                    }`}>
                      1L Bottle: {route.dispatch_bottles_1L}
                    </span>
                  ) : null}
                  {route.dispatch_bottles_500ml && route.dispatch_bottles_500ml > 0 ? (
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-xl border transition-all ${
                      selectedRouteId === route.id 
                        ? 'bg-white/15 border-white/10 text-white' 
                        : 'bg-blue-50 border-blue-100/50 text-blue-700 shadow-3xs'
                    }`}>
                      500ml Bottle: {route.dispatch_bottles_500ml}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          ))}

          {!isLoading && filteredRoutes.length === 0 && (
            <div className="p-8 text-center bg-white rounded-3xl border border-silver/50 shadow-sm">
               <Navigation className="w-10 h-10 text-charcoal/10 mx-auto mb-2" />
               <p className="text-xs font-bold text-charcoal/30">No routes found</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Area: Interactive OSM Map */}
      <div 
        ref={mapRef}
        className="flex-1 bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden relative group/map"
      >
        <div
          ref={setMapContainerNode}
          className={`absolute inset-0 bg-[#EAE8E3] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Tile Layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
             <div style={{ width: VIEWPORT_W, height: VIEWPORT_H, position: 'relative' }}>
                {osmTiles.map(tile => (
                  <img 
                    key={tile.key} 
                    src={tile.url} 
                    alt="" 
                    className="absolute w-[256px] h-[256px] object-cover transition-opacity duration-300 select-none"
                    style={{ left: tile.left, top: tile.top }}
                  />
                ))}
             </div>
          </div>

          {/* SVG Overlay for Routes & Markers */}
          <div className="absolute inset-0 pointer-events-none">
            <svg width={VIEWPORT_W} height={VIEWPORT_H} viewBox={`0 0 ${VIEWPORT_W} ${VIEWPORT_H}`} className="pointer-events-none">
              {/* Draw Selected Route Path */}
              {selectedRoute && selectedRoute.stops.length > 1 && (
                <polyline
                  points={selectedRoute.stops.map(s => {
                    const pt = getOsmSvgPixel(s.latitude, s.longitude);
                    return `${pt.x},${pt.y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8,8"
                  className="opacity-60"
                />
              )}

              {/* Draw All Stops */}
              {selectedRoute?.stops.map((stop) => {
                const pt = getOsmSvgPixel(stop.latitude, stop.longitude);
                const isDelivered = stop.order_status === "delivered";
                const markerColor = isDelivered ? "#10B981" : "#F59E0B";
                
                return (
                  <g key={stop.id} className="transition-all duration-300">
                    {/* Pulsing ring for current sequence */}
                    <circle cx={pt.x} cy={pt.y} r="12" fill={markerColor} className={`opacity-20 ${isDelivered ? "" : "animate-pulse"}`} />
                    
                    {/* Stop Pin */}
                    <circle cx={pt.x} cy={pt.y} r="8" fill="white" stroke={markerColor} strokeWidth="2" className="shadow-sm" />
                    
                    {/* Sequence Number */}
                    <text x={pt.x} y={pt.y + 3} textAnchor="middle" fontSize="8" fontWeight="900" fill={markerColor}>
                      {stop.sequence_number}
                    </text>
 
                    {/* Tooltip */}
                    <foreignObject x={pt.x + 12} y={pt.y - 12} width="140" height="24">
                       <div className={`text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg border w-fit whitespace-nowrap ${
                         isDelivered ? "bg-emerald-600 border-emerald-500" : "bg-charcoal border-white/10"
                       }`}>
                          {stop.customer_name} {isDelivered && "✓"}
                       </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className="flex flex-col bg-white/90 backdrop-blur-md border border-silver/60 rounded-xl shadow-lg overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.min(18, z + 1))}
              className="p-2.5 hover:bg-silver/20 transition-colors border-b border-silver/30"
            >
              <ZoomIn className="w-4 h-4 text-charcoal" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(10, z - 1))}
              className="p-2.5 hover:bg-silver/20 transition-colors"
            >
              <ZoomOut className="w-4 h-4 text-charcoal" />
            </button>
          </div>
          
          {isManualPan && (
             <button 
                onClick={() => setIsManualPan(false)}
                className="p-2.5 bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
                title="Recenter to active route"
             >
                <CheckCircle2 className="w-4 h-4" />
             </button>
          )}
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md border border-silver/60 p-3 rounded-2xl shadow-lg max-w-[200px]">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-0.5 bg-primary border-t-2 border-dashed border-primary"></div>
              <span className="text-[10px] font-black text-charcoal/60 uppercase">Delivery Path</span>
           </div>
           <p className="text-[9px] text-charcoal/40 font-medium leading-tight">
              Selecting a route highlights its delivery sequence and stop points on the map.
           </p>
        </div>
      </div>
    </div>
  );
};

export default RouteTab;
