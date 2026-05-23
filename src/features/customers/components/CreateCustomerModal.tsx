import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Map,
  FileText,
  Loader2,
  ZoomIn,
  ZoomOut,
  Navigation,
} from "lucide-react";
import { customerApi } from "../api/customerApi";
import axiosInstance from "../../../api/axiosInstance";
import { CustomInput } from "../../../components/common/CustomInput";
import { companyApi } from "../../../api/companyApi";
import type { Company } from "../../../api/companyApi";

interface Zone {
  id: string;
  name: string;
  boundary?: {
    type: string;
    coordinates: any;
  };
}

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const getPolygonCenter = (coords: any): { lat: number; lng: number } => {
  try {
    if (!coords || !Array.isArray(coords) || coords.length === 0) return { lat: 21.1458, lng: 79.0882 };
    const pts = coords[0];
    if (!Array.isArray(pts) || pts.length === 0) return { lat: 21.1458, lng: 79.0882 };
    
    let sumLat = 0;
    let sumLng = 0;
    let count = 0;
    pts.forEach((p: any) => {
      if (Array.isArray(p) && p.length >= 2) {
        sumLng += parseFloat(p[0]);
        sumLat += parseFloat(p[1]);
        count++;
      }
    });
    if (count > 0) {
      return { lat: sumLat / count, lng: sumLng / count };
    }
  } catch (e) {
    // fallback
  }
  return { lat: 21.1458, lng: 79.0882 };
};

// Ray-casting helper to check if point (x=lng, y=lat) is in polygon
const isPointInPolygon = (lat: number, lng: number, polygonCoords: any): boolean => {
  if (!polygonCoords || !Array.isArray(polygonCoords)) return false;
  let coords = polygonCoords[0];
  if (!Array.isArray(coords)) return false;

  // Unwrap coords if they are doubly nested
  if (coords.length > 0 && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
    coords = coords[0];
  }

  if (coords.length < 3) return false;

  const x = lng;
  const y = lat;
  const num = coords.length;
  let j = num - 1;
  let inside = false;

  for (let i = 0; i < num; i++) {
    const p_i = coords[i];
    const p_j = coords[j];
    if (!Array.isArray(p_i) || !Array.isArray(p_j) || p_i.length < 2 || p_j.length < 2) {
      continue;
    }
    const xi = parseFloat(p_i[0]);
    const yi = parseFloat(p_i[1]);
    const xj = parseFloat(p_j[0]);
    const yj = parseFloat(p_j[1]);

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi);
    if (intersect) inside = !inside;
    j = i;
  }
  return inside;
};

// Check if point is in MultiPolygon
const isPointInMultiPolygon = (lat: number, lng: number, multiPolygonCoords: any): boolean => {
  if (!multiPolygonCoords || !Array.isArray(multiPolygonCoords)) return false;
  for (const polygon of multiPolygonCoords) {
    if (isPointInPolygon(lat, lng, polygon)) {
      return true;
    }
  }
  return false;
};

const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    latitude: "",
    longitude: "",
    zone: "",
    notes: "",
  });
  const [zones, setZones] = useState<Zone[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Company State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Map State & Refs
  const [zoom, setZoom] = useState<number>(13);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 21.1458,
    lng: 79.0882,
  });
  const [mapContainerNode, setMapContainerNode] = useState<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 448, height: 220 });

  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0 });

  // Map viewport dimensions observer
  useEffect(() => {
    if (!mapRef.current || !isOpen) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width || 448,
          height: entry.contentRect.height || 220,
        });
      }
    });
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, [isOpen]);

  // Map wheel scroll zooming
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

  // OSM projection math
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

    const px = dimensions.width / 2 + (tx - centerTxFloat) * 256;
    const py = dimensions.height / 2 + (ty - centerTyFloat) * 256;
    return { x: px, y: py };
  };

  const osmTiles = useMemo(() => {
    const baseTx = Math.floor(centerTxFloat);
    const baseTy = Math.floor(centerTyFloat);
    const maxTile = Math.pow(2, zoom);

    const tilesArr = [];
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const tx = baseTx + dx;
        const ty = baseTy + dy;

        if (ty >= 0 && ty < maxTile) {
          const wrappedTx = ((tx % maxTile) + maxTile) % maxTile;
          const leftPx = dimensions.width / 2 + (tx - centerTxFloat) * 256;
          const topPx = dimensions.height / 2 + (ty - centerTyFloat) * 256;

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
  }, [centerTxFloat, centerTyFloat, zoom, dimensions]);

  // Drag-to-pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    dragRef.current.isDragging = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return;
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragRef.current.isDragging = true;
    }

    if (dragRef.current.isDragging) {
      dragRef.current.startX = e.clientX;
      dragRef.current.startY = e.clientY;

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
    }
  };

  // Click-to-place-pin handler
  const handleMapClick = (e: React.MouseEvent) => {
    if (dragRef.current.isDragging) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const getTileCount = (z: number) => Math.pow(2, z);
    const tx = centerTxFloat + (clickX - dimensions.width / 2) / 256;
    const ty = centerTyFloat + (clickY - dimensions.height / 2) / 256;

    const lng = (tx / getTileCount(zoom)) * 360 - 180;
    const M = Math.PI * (1 - (2 * ty) / getTileCount(zoom));
    const lat = (Math.atan(0.5 * (Math.exp(M) - Math.exp(-M))) * 180) / Math.PI;

    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));
  };

  // Sync map center when valid coordinates are typed
  useEffect(() => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      setMapCenter({ lat, lng });
    }
  }, [formData.latitude, formData.longitude]);

  const showPin = !isNaN(parseFloat(formData.latitude)) && !isNaN(parseFloat(formData.longitude));
  const pinPt = showPin ? getOsmSvgPixel(parseFloat(formData.latitude), parseFloat(formData.longitude)) : null;

  // Auto-detect zone based on latitude/longitude inputs
  useEffect(() => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lng) || zones.length === 0) {
      setFormData((prev) => ({ ...prev, zone: "" }));
      return;
    }

    const matchingZone = zones.find((zone) => {
      if (!zone.boundary) return false;
      
      let boundary = zone.boundary;
      if (typeof boundary === "string") {
        try {
          boundary = JSON.parse(boundary);
        } catch (e) {
          return false;
        }
      }

      if (!boundary || !boundary.type || !boundary.coordinates) return false;
      const type = boundary.type;
      const coords = boundary.coordinates;

      if (type === "Polygon") {
        return isPointInPolygon(lat, lng, coords);
      } else if (type === "MultiPolygon") {
        return isPointInMultiPolygon(lat, lng, coords);
      }
      return false;
    });

    setFormData((prev) => ({ ...prev, zone: matchingZone ? matchingZone.id : "" }));
  }, [formData.latitude, formData.longitude, zones]);

  // Fetch zones when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchZonesAndCompanies = async () => {
        setIsLoadingZones(true);
        setIsLoadingCompanies(true);
        try {
          const [zonesRes, companiesRes] = await Promise.all([
            axiosInstance.get("/ems/zones/"),
            companyApi.getCompanies(),
          ]);

          const fetchedZones = Array.isArray(zonesRes.data) ? zonesRes.data : [];
          setZones(fetchedZones);

          const fetchedCompanies = Array.isArray(companiesRes) ? companiesRes : [];
          setCompanies(fetchedCompanies.filter((c) => c.is_active));

          // Set default map center to the first zone with a boundary
          const zoneWithBoundary = fetchedZones.find((z) => {
            if (!z.boundary) return false;
            let boundary = z.boundary;
            if (typeof boundary === "string") {
              try {
                boundary = JSON.parse(boundary);
              } catch {
                return false;
              }
            }
            return boundary && boundary.coordinates;
          });

          if (zoneWithBoundary) {
            let boundary = zoneWithBoundary.boundary;
            if (typeof boundary === "string") {
              boundary = JSON.parse(boundary);
            }
            if (boundary.type === "Polygon") {
              setMapCenter(getPolygonCenter(boundary.coordinates));
            } else if (boundary.type === "MultiPolygon" && boundary.coordinates.length > 0) {
              setMapCenter(getPolygonCenter(boundary.coordinates[0]));
            }
          }
        } catch (err) {
          console.error("Failed to fetch zones/companies for customer creation:", err);
        } finally {
          setIsLoadingZones(false);
          setIsLoadingCompanies(false);
        }
      };
      fetchZonesAndCompanies();
      // Reset form on open
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        address: "",
        latitude: "",
        longitude: "",
        zone: "",
        notes: "",
      });
      setError(null);
      setZoom(13);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Name and Email are required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        company: formData.company.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim(),
      };

      if (formData.latitude && formData.longitude) {
        payload.latitude = parseFloat(formData.latitude);
        payload.longitude = parseFloat(formData.longitude);
      }

      if (formData.zone) {
        payload.zone = formData.zone;
      }

      await customerApi.createCustomer(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to create customer:", err);
      // DRF returns object keys for validation errors (like email: ["customer with this email already exists"])
      const serverErr = err.response?.data;
      if (serverErr && typeof serverErr === "object") {
        const firstKey = Object.keys(serverErr)[0];
        const errorMsg = Array.isArray(serverErr[firstKey])
          ? serverErr[firstKey][0]
          : typeof serverErr[firstKey] === "string"
          ? serverErr[firstKey]
          : "Invalid value provided.";
        setError(`${firstKey.toUpperCase()}: ${errorMsg}`);
      } else {
        setError(serverErr?.detail || "Failed to add customer. Please check your inputs.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-primary to-sage text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-none">Add Customer</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/70 mt-1 font-bold">
                CRM Account Registry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                label="Customer Name"
                icon={User}
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g. Rahul Sharma"
                inputClassName="text-charcoal font-semibold"
              />

              <CustomInput
                label="Email Address"
                icon={Mail}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="e.g. rahul@example.com"
                inputClassName="text-charcoal font-semibold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                label="Phone Number"
                icon={Phone}
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. +91 9876543210"
                inputClassName="text-charcoal font-semibold"
              />

              <div className="space-y-1 w-full text-left">
                <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">
                  Company Name
                </label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors z-10" />
                  <select
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full pl-11 pr-4 py-3.5 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold text-sm text-charcoal appearance-none cursor-pointer"
                  >
                    <option value="">-- Private Partner / Individual --</option>
                    {isLoadingCompanies ? (
                      <option disabled>Loading companies...</option>
                    ) : companies.length === 0 ? (
                      <option disabled>No companies found</option>
                    ) : (
                      companies.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            <CustomInput
              label="Delivery Address"
              icon={MapPin}
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="e.g. Flat 304, Green Heights, Nagpur"
              inputClassName="text-charcoal font-semibold"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomInput
                label="Latitude (GPS)"
                icon={MapPin}
                type="number"
                name="latitude"
                value={formData.latitude}
                onChange={handleInputChange}
                placeholder="e.g. 21.1458"
                step="any"
                inputClassName="text-charcoal font-semibold"
              />

              <CustomInput
                label="Longitude (GPS)"
                icon={MapPin}
                type="number"
                name="longitude"
                value={formData.longitude}
                onChange={handleInputChange}
                placeholder="e.g. 79.0882"
                step="any"
                inputClassName="text-charcoal font-semibold"
              />
            </div>

            {/* Small Interactive Map */}
            <div className="space-y-1 w-full text-left">
              <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">
                Select Location on Map
              </label>
              <div 
                ref={mapRef}
                className="w-full h-[220px] bg-[#EAE8E3] border border-silver/50 rounded-2xl overflow-hidden relative shadow-inner group/modalmap"
              >
                {/* Map Tiles */}
                <div 
                  ref={setMapContainerNode}
                  className={`absolute inset-0 select-none ${dragRef.current.isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onClick={handleMapClick}
                >
                  <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
                    <div style={{ width: dimensions.width, height: dimensions.height, position: 'relative' }}>
                      {osmTiles.map((tile: any) => (
                        <img
                          key={tile.key}
                          src={tile.url}
                          alt=""
                          className="absolute w-[256px] h-[256px] object-cover transition-opacity duration-200 select-none"
                          style={{ left: `${tile.left}px`, top: `${tile.top}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* SVG Overlay: Zones Boundaries & Selected Pin */}
                  <svg 
                    width={dimensions.width} 
                    height={dimensions.height} 
                    className="absolute inset-0 pointer-events-none"
                  >
                    {/* Zone Polygons */}
                    {zones.map((zone) => {
                      if (!zone.boundary) return null;
                      
                      let boundary = zone.boundary;
                      if (typeof boundary === "string") {
                        try {
                          boundary = JSON.parse(boundary);
                        } catch (e) {
                          return null;
                        }
                      }
                      
                      if (!boundary || !boundary.type || !boundary.coordinates) return null;
                      const type = boundary.type;
                      const coords = boundary.coordinates;
                      
                      const isSelected = formData.zone === zone.id;

                      if (type === "Polygon") {
                        const pts = coords[0];
                        const pointsStr = pts
                          .map((p: any) => {
                            const pt = getOsmSvgPixel(parseFloat(p[1]), parseFloat(p[0]));
                            return `${pt.x},${pt.y}`;
                          })
                          .join(" ");

                        return (
                          <polygon
                            key={zone.id}
                            points={pointsStr}
                            fill={isSelected ? "#10B981" : "#3B82F6"}
                            fillOpacity={isSelected ? "0.2" : "0.06"}
                            stroke={isSelected ? "#10B981" : "#3B82F6"}
                            strokeWidth={isSelected ? "2" : "1.5"}
                            className="transition-all duration-300"
                          />
                        );
                      } else if (type === "MultiPolygon") {
                        return coords.map((polygonCoords: any, polyIdx: number) => {
                          const pts = polygonCoords[0];
                          const pointsStr = pts
                            .map((p: any) => {
                              const pt = getOsmSvgPixel(parseFloat(p[1]), parseFloat(p[0]));
                              return `${pt.x},${pt.y}`;
                            })
                            .join(" ");

                          return (
                            <polygon
                              key={`${zone.id}-${polyIdx}`}
                              points={pointsStr}
                              fill={isSelected ? "#10B981" : "#3B82F6"}
                              fillOpacity={isSelected ? "0.2" : "0.06"}
                              stroke={isSelected ? "#10B981" : "#3B82F6"}
                              strokeWidth={isSelected ? "2" : "1.5"}
                              className="transition-all duration-300"
                            />
                          );
                        });
                      }
                      return null;
                    })}

                    {/* Customer Location Pin */}
                    {showPin && pinPt && (
                      <g>
                        <circle
                          cx={pinPt.x}
                          cy={pinPt.y}
                          r="16"
                          fill="#EF4444"
                          className="opacity-20 animate-ping"
                          style={{ transformOrigin: "center", transformBox: "fill-box" }}
                        />
                        <circle
                          cx={pinPt.x}
                          cy={pinPt.y + 2}
                          r="6"
                          fill="black"
                          className="opacity-20"
                        />
                        <path
                          d={`M ${pinPt.x} ${pinPt.y} 
                             C ${pinPt.x - 6} ${pinPt.y - 12}, ${pinPt.x - 6} ${pinPt.y - 18}, ${pinPt.x} ${pinPt.y - 20}
                             C ${pinPt.x + 6} ${pinPt.y - 18}, ${pinPt.x + 6} ${pinPt.y - 12}, ${pinPt.x} ${pinPt.y}`}
                          fill="#EF4444"
                          stroke="white"
                          strokeWidth="1.5"
                          className="animate-bounce"
                          style={{ animationDuration: '2s' }}
                        />
                        <circle
                          cx={pinPt.x}
                          cy={pinPt.y - 14}
                          r="3"
                          fill="white"
                        />
                      </g>
                    )}
                  </svg>
                </div>

                {/* Map Controls */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-20">
                  <div className="flex flex-col bg-white/90 backdrop-blur-md border border-silver/60 rounded-xl shadow-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(18, z + 1))}
                      className="p-2 hover:bg-silver/20 transition-colors border-b border-silver/30"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-charcoal" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(10, z - 1))}
                      className="p-2 hover:bg-silver/20 transition-colors"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5 text-charcoal" />
                    </button>
                  </div>

                  {showPin && pinPt && (
                    <button
                      type="button"
                      onClick={() => {
                        const lat = parseFloat(formData.latitude);
                        const lng = parseFloat(formData.longitude);
                        if (!isNaN(lat) && !isNaN(lng)) {
                          setMapCenter({ lat, lng });
                        }
                      }}
                      className="p-2 bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md transition-all flex items-center justify-center"
                      title="Center on Pin"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Bottom Overlay Instructions */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-20">
                  <div className="bg-charcoal/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[8px] font-black text-white uppercase tracking-widest shadow-lg whitespace-nowrap">
                    Click to place Pin • Drag to pan • Scroll to zoom
                  </div>
                </div>
              </div>
            </div>

            {/* Zone Selection Dropdown */}
            <div className="space-y-1 w-full text-left">
              <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">
                Regional Delivery Zone
              </label>
              <div className="relative group">
                <Map className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors z-10" />
                <select
                  name="zone"
                  value={formData.zone}
                  onChange={handleInputChange}
                  className="w-full pl-11 pr-4 py-3 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold text-sm text-charcoal appearance-none cursor-pointer"
                >
                  <option value="">-- Let system auto-assign zone based on coordinates --</option>
                  {isLoadingZones ? (
                    <option disabled>Loading zones...</option>
                  ) : zones.length === 0 ? (
                    <option disabled>No zones found. Create one first.</option>
                  ) : (
                    zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Notes Textarea */}
            <div className="space-y-1 w-full text-left">
              <label className="text-xs font-black text-charcoal/40 uppercase tracking-wider ml-1">
                Internal CRM Notes
              </label>
              <div className="relative group">
                <FileText className="absolute left-4 top-4.5 w-4 h-4 text-charcoal/20 group-focus-within:text-primary transition-colors z-10" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter any special instructions or corporate billing details..."
                  rows={2}
                  className="w-full pl-11 pr-4 py-3.5 bg-silver/10 border border-silver/50 rounded-2xl focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none font-semibold text-sm text-charcoal"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-silver/20 text-charcoal font-bold rounded-2xl hover:bg-silver/30 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Customer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCustomerModal;
