import React, { useState, useEffect, useMemo, useRef } from "react";
import { MapPin, User, Activity, Globe, Plus, MoreVertical, Search, CheckCircle2, ZoomIn, ZoomOut } from "lucide-react";
import { tenantApi } from "../api/tenantApi";
import type { Zone } from "./types";
import CreateZoneModal from "./CreateZoneModal";

const ZoneTab: React.FC = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchZones = async () => {
    setIsLoading(true);
    try {
      const data = await tenantApi.getZones();
      setZones(data);
    } catch (error) {
      console.error("Failed to fetch operational zones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const selectedZone = useMemo(() => {
    return zones.find((z) => z.id === selectedZoneId) || null;
  }, [zones, selectedZoneId]);

  // Map State
  const [zoom, setZoom] = useState<number>(12);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 19.076, 
    lng: 72.8777,
  });
  const [isManualPan, setIsManualPan] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Sync map center with selected zone
  useEffect(() => {
    if (selectedZone && selectedZone.boundary && selectedZone.boundary.coordinates.length > 0 && !isManualPan) {
      const coords = selectedZone.boundary.coordinates[0];
      const lats = coords.map(c => c[1]);
      const lngs = coords.map(c => c[0]);
      const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    } else if (!selectedZoneId && zones.length > 0 && !isManualPan) {
      const firstWithBoundary = zones.find(z => z.boundary && z.boundary.coordinates.length > 0);
      if (firstWithBoundary) {
        const coords = firstWithBoundary.boundary!.coordinates[0];
        setMapCenter({ 
          lat: coords.map(c => c[1]).reduce((a, b) => a + b, 0) / coords.length, 
          lng: coords.map(c => c[0]).reduce((a, b) => a + b, 0) / coords.length 
        });
      }
    }
  }, [selectedZoneId, selectedZone, isManualPan, zones]);

  const mapRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

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
  }, [centerTxFloat, centerTyFloat, zoom, VIEWPORT_W, VIEWPORT_H]);

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
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) setZoom(z => Math.min(18, z + 1));
    else setZoom(z => Math.max(10, z - 1));
  };

  const filteredZones = zones.filter(z => 
    z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    z.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] animate-in fade-in duration-500">
      {/* 1. Sidebar: Zones List */}
      <div className="w-full lg:w-[380px] flex flex-col gap-4">
        {/* Search Header */}
        <div className="bg-white p-4 rounded-3xl border border-silver/50 shadow-sm flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
            <input
              type="text"
              placeholder="Search zones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-silver/10 border border-silver/30 rounded-xl text-xs font-bold focus:outline-none focus:border-primary/30 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="p-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
            title="Create New Zone"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {isLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-white rounded-3xl border border-silver/50 animate-pulse"></div>
            ))
          ) : filteredZones.map(zone => (
            <div 
              key={zone.id} 
              onClick={() => {
                setSelectedZoneId(zone.id);
                setIsManualPan(false);
              }}
              className={`p-5 rounded-3xl border transition-all cursor-pointer group ${
                selectedZoneId === zone.id 
                  ? 'bg-primary border-primary shadow-xl shadow-primary/20 text-white' 
                  : 'bg-white border-silver/50 shadow-sm hover:border-primary/30'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-xl ${selectedZoneId === zone.id ? 'bg-white/20' : 'bg-primary/5'}`}>
                  <Globe className={`w-5 h-5 ${selectedZoneId === zone.id ? 'text-white' : 'text-primary'}`} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                  selectedZoneId === zone.id ? 'bg-white/20 text-white' : (zone.is_active ? 'bg-sage/10 text-primary' : 'bg-red-50 text-red-500')
                }`}>
                  {zone.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h4 className="text-sm font-black truncate">{zone.name}</h4>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 opacity-60">
                   <User className="w-3 h-3" />
                   <span className="text-[10px] font-bold truncate max-w-[120px]">{zone.assigned_driver || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Main Area: Interactive OSM Map */}
      <div 
        ref={mapRef}
        className="flex-1 bg-white rounded-3xl border border-silver/50 shadow-sm overflow-hidden relative group/map"
      >
        <div
          className={`absolute inset-0 bg-[#EAE8E3] ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
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

          {/* SVG Overlay for Polygons */}
          <div className="absolute inset-0 pointer-events-none">
            <svg width={VIEWPORT_W} height={VIEWPORT_H} viewBox={`0 0 ${VIEWPORT_W} ${VIEWPORT_H}`} className="pointer-events-none">
              {zones.map((zone) => {
                if (!zone.boundary || zone.boundary.type !== 'Polygon') return null;
                const isSelected = zone.id === selectedZoneId;
                return (
                  <g key={zone.id}>
                    {zone.boundary.coordinates.map((ring, rIdx) => (
                      <polygon
                        key={`${zone.id}-ring-${rIdx}`}
                        points={ring.map(c => {
                          const pt = getOsmSvgPixel(c[1], c[0]);
                          return `${pt.x},${pt.y}`;
                        }).join(' ')}
                        fill={isSelected ? "#F59E0B" : "#10B981"}
                        fillOpacity={isSelected ? "0.3" : "0.1"}
                        stroke={isSelected ? "#F59E0B" : "#10B981"}
                        strokeWidth={isSelected ? "3" : "1.5"}
                        className="transition-all duration-300"
                        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                        onClick={() => {
                          setSelectedZoneId(zone.id);
                          setIsManualPan(false);
                        }}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className="flex flex-col bg-white/90 backdrop-blur-md border border-silver/60 rounded-xl shadow-lg overflow-hidden">
            <button onClick={() => setZoom((z) => Math.min(18, z + 1))} className="p-2.5 hover:bg-silver/20 transition-colors border-b border-silver/30">
              <ZoomIn className="w-4 h-4 text-charcoal" />
            </button>
            <button onClick={() => setZoom((z) => Math.max(10, z - 1))} className="p-2.5 hover:bg-silver/20 transition-colors">
              <ZoomOut className="w-4 h-4 text-charcoal" />
            </button>
          </div>
          
          {isManualPan && (
             <button 
                onClick={() => setIsManualPan(false)}
                className="p-2.5 bg-primary text-white rounded-xl shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center"
             >
                <CheckCircle2 className="w-4 h-4" />
             </button>
          )}
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md border border-silver/60 p-3 rounded-2xl shadow-lg max-w-[200px]">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-[#10B981] opacity-30 rounded-sm border border-[#10B981]"></div>
              <span className="text-[10px] font-black text-charcoal/60 uppercase">Operational Zone</span>
           </div>
           <p className="text-[9px] text-charcoal/40 font-medium leading-tight">
              Selecting a zone highlights its GeoJSON boundary and recenters the view.
           </p>
        </div>
      </div>

      <CreateZoneModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchZones();
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
};

export default ZoneTab;
