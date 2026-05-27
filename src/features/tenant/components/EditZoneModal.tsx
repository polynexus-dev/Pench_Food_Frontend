import React, { useState, useMemo, useRef, useEffect } from "react";
import { X, MapPin, MousePointer2, Trash2, CheckCircle2, ZoomIn, ZoomOut, Save, Navigation2, Undo } from "lucide-react";
import { tenantApi } from "../api/tenantApi";
import type { Zone } from "./types";

interface EditZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  zone: Zone | null;
}

const EditZoneModal: React.FC<EditZoneModalProps> = ({ isOpen, onClose, onSuccess, zone }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Dragging vertex state
  const [draggedNodeIndex, setDraggedNodeIndex] = useState<number | null>(null);

  // Map State
  const [zoom, setZoom] = useState<number>(14);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 21.1458, 
    lng: 79.0882,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const mapRef = useRef<HTMLDivElement>(null);
  const hasDraggedRef = useRef(false);
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

  // Load existing zone data when modal opens or zone changes
  useEffect(() => {
    if (isOpen && zone) {
      setName(zone.name);
      setDescription(zone.description || "");
      setIsActive(zone.is_active);
      
      if (zone.boundary && zone.boundary.type === "Polygon" && zone.boundary.coordinates.length > 0) {
        const coords = zone.boundary.coordinates[0];
        let editPoints = coords.map(c => ({ lat: c[1], lng: c[0] }));
        // Slices off the final closing point if it duplicates the first point
        if (
          editPoints.length > 1 &&
          editPoints[0].lat === editPoints[editPoints.length - 1].lat &&
          editPoints[0].lng === editPoints[editPoints.length - 1].lng
        ) {
          editPoints = editPoints.slice(0, -1);
        }
        setPoints(editPoints);

        if (editPoints.length > 0) {
          const avgLat = editPoints.reduce((a, b) => a + b.lat, 0) / editPoints.length;
          const avgLng = editPoints.reduce((a, b) => a + b.lng, 0) / editPoints.length;
          setMapCenter({ lat: avgLat, lng: avgLng });
        }
      } else {
        setPoints([]);
      }
    }
  }, [isOpen, zone]);

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

  const clientToLatLng = (clientX: number, clientY: number) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return null;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const getTileCount = (z: number) => Math.pow(2, z);
    const tx = centerTxFloat + (x - VIEWPORT_W / 2) / 256;
    const ty = centerTyFloat + (y - VIEWPORT_H / 2) / 256;

    const lng = (tx / getTileCount(zoom)) * 360 - 180;
    const M = Math.PI * (1 - (2 * ty) / getTileCount(zoom));
    const lat = (Math.atan(0.5 * (Math.exp(M) - Math.exp(-M))) * 180) / Math.PI;

    return { lat, lng };
  };

  const midpoints = useMemo(() => {
    if (points.length < 3) return [];
    const mids = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      mids.push({
        idx1: i,
        idx2: (i + 1) % points.length,
        lat: (p1.lat + p2.lat) / 2,
        lng: (p1.lng + p2.lng) / 2,
      });
    }
    return mids;
  }, [points]);

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
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    if (!isDrawingMode || isDragging || draggedNodeIndex !== null) return;
    const latLng = clientToLatLng(e.clientX, e.clientY);
    if (latLng) {
      setPoints([...points, latLng]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(false);
    hasDraggedRef.current = false;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeIndex !== null) {
      hasDraggedRef.current = true;
      const latLng = clientToLatLng(e.clientX, e.clientY);
      if (latLng) {
        const newPoints = [...points];
        newPoints[draggedNodeIndex] = latLng;
        setPoints(newPoints);
      }
      return;
    }

    if (e.buttons !== 1) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      setIsDragging(true);
      hasDraggedRef.current = true;
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

  const handleMouseUp = () => {
    // Keep dragged status long enough for the click event to capture and discard it
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 50);
    setDraggedNodeIndex(null);
    setIsDragging(false);
  };

  const handleUndo = () => {
    if (points.length > 0) {
      setPoints(points.slice(0, -1));
    }
  };

  const handleSubmit = async () => {
    if (!zone || !name || points.length < 3) return;

    setIsSubmitting(true);
    try {
      const coordinates = [...points.map(p => [p.lng, p.lat])];
      coordinates.push([points[0].lng, points[0].lat]);

      await tenantApi.updateZone(zone.id, {
        name,
        description,
        is_active: isActive,
        boundary: {
          type: "Polygon",
          coordinates: [coordinates]
        }
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to update zone:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !zone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-silver/50 flex justify-between items-center bg-white/50">
          <div>
            <h2 className="text-2xl font-black text-charcoal flex items-center gap-2">
              <MapPin className="text-primary w-6 h-6" />
              Edit Operational Zone
            </h2>
            <p className="text-xs font-medium text-charcoal/40 mt-1">Modify boundary coordinates and settings for this zone.</p>
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
               <div className="flex items-center justify-between p-4 bg-silver/10 rounded-2xl border border-silver/30 mt-2">
                  <div>
                    <label className="text-[10px] font-black text-charcoal/40 uppercase tracking-widest block">Active Status</label>
                    <span className="text-[10px] text-charcoal/30 font-medium">Zone accepts new tasks</span>
                  </div>
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${isActive ? 'bg-primary' : 'bg-silver/40'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'left-6' : 'left-1'}`}></div>
                  </button>
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

               <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex justify-between items-center">
                  <div>
                     <p className="text-xs font-bold text-charcoal flex items-center gap-2">
                       <span>{points.length} points defined</span>
                       {points.length >= 3 && <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in duration-300" />}
                     </p>
                     <div className="w-32 bg-silver/20 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                           className="h-full bg-primary transition-all duration-300" 
                           style={{ width: `${Math.min(100, (points.length / 3) * 100)}%` }}
                        ></div>
                     </div>
                  </div>
                  {points.length > 0 && (
                     <button
                       onClick={handleUndo}
                       className="p-2 hover:bg-silver/20 rounded-xl text-charcoal/50 hover:text-charcoal transition-all"
                       title="Undo Last Point"
                     >
                       <Undo className="w-4 h-4" />
                     </button>
                  )}
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
                    Save
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
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
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
                <svg width={VIEWPORT_W} height={VIEWPORT_H} className="absolute inset-0" style={{ pointerEvents: 'none' }}>
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
                               style={{ pointerEvents: 'none' }}
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
                            style={{ pointerEvents: 'none' }}
                         />
                         
                         {/* Render Midpoints (Edge handles) for splitting/extending edges */}
                         {points.length >= 3 && midpoints.map((mid, idx) => {
                            const pt = getOsmSvgPixel(mid.lat, mid.lng);
                            return (
                               <circle 
                                  key={`mid-${idx}`}
                                  cx={pt.x} 
                                  cy={pt.y} 
                                  r="4.5" 
                                  fill="#F59E0B" 
                                  fillOpacity="0.5"
                                  stroke="white" 
                                  strokeWidth="1.5"
                                  className="cursor-pointer hover:fill-amber-600 hover:fill-opacity-90 hover:stroke-amber-100 transition-colors duration-150"
                                  style={{ pointerEvents: 'auto' }}
                                  onMouseDown={(e) => {
                                     e.stopPropagation();
                                     e.preventDefault();
                                     hasDraggedRef.current = true;
                                     
                                     // Insert the midpoint as a new vertex!
                                     const newPoints = [...points];
                                     const insertIndex = mid.idx1 + 1;
                                     if (mid.idx2 === 0 && mid.idx1 === points.length - 1) {
                                       newPoints.push({ lat: mid.lat, lng: mid.lng });
                                       setPoints(newPoints);
                                       setDraggedNodeIndex(newPoints.length - 1);
                                     } else {
                                       newPoints.splice(insertIndex, 0, { lat: mid.lat, lng: mid.lng });
                                       setPoints(newPoints);
                                       setDraggedNodeIndex(insertIndex);
                                     }
                                  }}
                               >
                                  <title>Drag to split edge and add node</title>
                               </circle>
                            );
                         })}

                         {/* Render Main Vertices */}
                         {points.map((p, idx) => {
                            const pt = getOsmSvgPixel(p.lat, p.lng);
                            return (
                               <circle 
                                  key={`vertex-${idx}`}
                                  cx={pt.x} 
                                  cy={pt.y} 
                                  r="6" 
                                  fill="#F59E0B" 
                                  stroke="white" 
                                  strokeWidth="2"
                                  className="cursor-move hover:fill-amber-600 hover:stroke-amber-100 transition-colors duration-150"
                                  style={{ pointerEvents: 'auto' }}
                                  onMouseDown={(e) => {
                                     e.stopPropagation();
                                     e.preventDefault();
                                     hasDraggedRef.current = true;
                                     setDraggedNodeIndex(idx);
                                  }}
                                  onDoubleClick={(e) => {
                                     e.stopPropagation();
                                     const newPoints = points.filter((_, i) => i !== idx);
                                     setPoints(newPoints);
                                  }}
                               >
                                  <title>Drag to move • Double-click to delete node</title>
                               </circle>
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
                    Click to add point • Drag vertices to move • Drag midpoints to split • Double-click to delete
                  </>
                ) : (
                  <>
                    <Navigation2 className="w-3.5 h-3.5 text-indigo-400" />
                    Drag to move map • Drag vertices to tweak • Double-click to delete • Switch to Drawing Mode to add points
                  </>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditZoneModal;
