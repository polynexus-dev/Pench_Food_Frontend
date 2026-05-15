import React, { useState, useMemo, useRef, useEffect } from "react";
import { X, MapPin, MousePointer2, Trash2, CheckCircle2, ZoomIn, ZoomOut, Save, Navigation2 } from "lucide-react";
import { tenantApi } from "../api/tenantApi";

interface CreateZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateZoneModal: React.FC<CreateZoneModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Map State
  const [zoom, setZoom] = useState<number>(14);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 21.1458, 
    lng: 79.0882,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const mapRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!mapRef.current || !isOpen) return;
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
  }, [isOpen]);

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
    if (VIEWPORT_W === 0) return [];
    const baseTx = Math.floor(centerTxFloat);
    const baseTy = Math.floor(centerTyFloat);
    const maxTile = Math.pow(2, zoom);

    const tilesArr = [];
    for (let dx = -2; dx <= 2; dx++) {
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

  const handleMapClick = (e: React.MouseEvent) => {
    // ONLY add points if in drawing mode and NOT dragging
    if (!isDrawingMode || isDragging) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const getTileCount = (z: number) => Math.pow(2, z);
    const tx = centerTxFloat + (clickX - VIEWPORT_W / 2) / 256;
    const ty = centerTyFloat + (clickY - VIEWPORT_H / 2) / 256;

    const lng = (tx / getTileCount(zoom)) * 360 - 180;
    const M = Math.PI * (1 - (2 * ty) / getTileCount(zoom));
    const lat = (Math.atan(0.5 * (Math.exp(M) - Math.exp(-M))) * 180) / Math.PI;

    setPoints([...points, { lat, lng }]);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(false);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return; // Only if primary button is held

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    // Threshold to distinguish click from drag
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      setIsDragging(true);
    }

    if (isDragging) {
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
    }
  };

  const handleSubmit = async () => {
    if (!name || points.length < 3) return;

    setIsSubmitting(true);
    try {
      const coordinates = [...points.map(p => [p.lng, p.lat])];
      coordinates.push([points[0].lng, points[0].lat]);

      await tenantApi.createZone({
        name,
        description,
        boundary: {
          type: "Polygon",
          coordinates: [coordinates]
        }
      });
      onSuccess();
      onClose();
      setName("");
      setDescription("");
      setPoints([]);
      setIsDrawingMode(false);
    } catch (error) {
      console.error("Failed to create zone:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-silver/50 flex justify-between items-center bg-white/50">
          <div>
            <h2 className="text-2xl font-black text-charcoal flex items-center gap-2">
              <MapPin className="text-primary w-6 h-6" />
              Define New Operational Zone
            </h2>
            <p className="text-xs font-medium text-charcoal/40 mt-1">Switch to drawing mode to define the boundary points.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-silver/20 rounded-xl transition-all">
            <X className="w-6 h-6 text-charcoal/40" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Form */}
          <div className="w-full lg:w-[350px] p-8 border-r border-silver/50 flex flex-col gap-6 overflow-y-auto">
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest block mb-1.5">Zone Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nagpur West"
                    className="w-full px-4 py-3 bg-silver/10 border border-silver/40 rounded-xl text-sm font-bold focus:outline-none focus:border-primary/40 transition-all"
                  />
               </div>
               <div>
                  <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest block mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the coverage area..."
                    rows={3}
                    className="w-full px-4 py-3 bg-silver/10 border border-silver/40 rounded-xl text-sm font-bold focus:outline-none focus:border-primary/40 transition-all resize-none"
                  />
               </div>
            </div>

            <div className="mt-auto space-y-4">
               {/* Mode Toggler */}
               <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setIsDrawingMode(!isDrawingMode)}
                    className={`flex items-center justify-between px-6 py-4 rounded-2xl font-black transition-all border-2 ${
                      isDrawingMode 
                        ? 'bg-amber-50 border-primary text-primary shadow-lg shadow-primary/10' 
                        : 'bg-white border-silver/40 text-charcoal/60 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                       <MousePointer2 className={`w-5 h-5 ${isDrawingMode ? 'text-primary' : 'text-charcoal/30'}`} />
                       <span className="text-xs uppercase tracking-widest">Drawing Mode</span>
                    </div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isDrawingMode ? 'bg-primary' : 'bg-silver/40'}`}>
                       <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isDrawingMode ? 'left-6' : 'left-1'}`}></div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setIsDrawingMode(false)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black transition-all border-2 ${
                      !isDrawingMode 
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-lg shadow-indigo-100' 
                        : 'bg-white border-silver/40 text-charcoal/60 hover:border-indigo-300'
                    }`}
                  >
                    <Navigation2 className={`w-5 h-5 ${!isDrawingMode ? 'text-indigo-600' : 'text-charcoal/30'}`} />
                    <span className="text-xs uppercase tracking-widest">Panning Mode</span>
                  </button>
               </div>

               <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <p className="text-xs font-bold text-charcoal flex items-center justify-between">
                    <span>{points.length} points defined</span>
                    {points.length >= 3 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </p>
                  <div className="w-full bg-silver/20 h-1.5 rounded-full mt-2 overflow-hidden">
                     <div 
                        className="h-full bg-primary transition-all duration-300" 
                        style={{ width: `${Math.min(100, (points.length / 3) * 100)}%` }}
                     ></div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPoints([])}
                    disabled={points.length === 0}
                    className="flex items-center justify-center gap-2 px-4 py-3 border border-silver/50 rounded-2xl text-[10px] font-black text-charcoal/40 uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={!name || points.length < 3 || isSubmitting}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save Zone
                  </button>
               </div>
            </div>
          </div>

          {/* Right: Interactive Drawing Map */}
          <div 
            ref={mapRef}
            className="flex-1 relative bg-silver/5 overflow-hidden"
          >
             <div
                className={`absolute inset-0 bg-[#EAE8E3] ${isDrawingMode ? 'cursor-crosshair' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onClick={handleMapClick}
             >
                {/* Tile Layer */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div style={{ width: VIEWPORT_W, height: VIEWPORT_H, position: 'relative' }}>
                      {osmTiles.map(tile => (
                        <img 
                          key={tile.key} 
                          src={tile.url} 
                          alt="" 
                          className="absolute w-[256px] h-[256px] object-cover select-none"
                          style={{ left: tile.left, top: tile.top }}
                        />
                      ))}
                   </div>
                </div>

                {/* Drawing Layer */}
                <svg width={VIEWPORT_W} height={VIEWPORT_H} className="absolute inset-0 pointer-events-none">
                   {points.length > 0 && (
                      <g>
                         {points.length >= 3 && (
                            <polygon 
                               points={points.map(p => {
                                  const pt = getOsmSvgPixel(p.lat, p.lng);
                                  return `${pt.x},${pt.y}`;
                               }).join(' ')}
                               fill="#F59E0B"
                               fillOpacity="0.2"
                               stroke="#F59E0B"
                               strokeWidth="3"
                               strokeDasharray="5,5"
                            />
                         )}
                         <polyline 
                            points={points.map(p => {
                               const pt = getOsmSvgPixel(p.lat, p.lng);
                               return `${pt.x},${pt.y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="3"
                            strokeLinecap="round"
                         />
                         {points.map((p, idx) => {
                            const pt = getOsmSvgPixel(p.lat, p.lng);
                            return (
                               <g key={idx}>
                                  <circle cx={pt.x} cy={pt.y} r="6" fill="#F59E0B" stroke="white" strokeWidth="2" />
                               </g>
                            );
                         })}
                      </g>
                   )}
                </svg>
             </div>

             {/* Mode Indicator Overlay */}
             <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <div className={`px-6 py-2 rounded-full border shadow-xl backdrop-blur-md font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${
                   isDrawingMode ? 'bg-primary text-white border-primary' : 'bg-white/90 text-charcoal border-silver/50'
                }`}>
                   <div className={`w-2 h-2 rounded-full ${isDrawingMode ? 'bg-white animate-pulse' : 'bg-primary'}`}></div>
                   {isDrawingMode ? 'Drawing Mode Active' : 'Panning Mode Active'}
                </div>
             </div>

             {/* Map Controls */}
             <div className="absolute top-6 right-6 flex flex-col gap-2">
                <div className="flex flex-col bg-white/90 backdrop-blur-md border border-silver/60 rounded-xl shadow-lg overflow-hidden">
                   <button onClick={() => setZoom(z => Math.min(18, z + 1))} className="p-2.5 hover:bg-silver/20 transition-colors border-b border-silver/30">
                      <ZoomIn className="w-4 h-4 text-charcoal" />
                   </button>
                   <button onClick={() => setZoom(z => Math.max(10, z - 1))} className="p-2.5 hover:bg-silver/20 transition-colors">
                      <ZoomOut className="w-4 h-4 text-charcoal" />
                   </button>
                </div>
             </div>

             {/* Hint Overlay */}
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-charcoal/80 backdrop-blur-md px-6 py-2.5 rounded-full text-white/90 text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-3 border border-white/10 shadow-2xl">
                {isDrawingMode ? (
                  <>
                    <MousePointer2 className="w-3.5 h-3.5 text-primary" />
                    Click anywhere to add a boundary point
                  </>
                ) : (
                  <>
                    <Navigation2 className="w-3.5 h-3.5 text-indigo-400" />
                    Drag to move • Scroll to zoom
                  </>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateZoneModal;
