import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { getCityWsUrl, DEFAULT_WS_PROTOCOL, cleanHost } from "../../../utils/constants";

export interface DriverLocationState {
  driver_id: string;
  driver_name: string;
  lat: number;
  lng: number;
  trail: [number, number][]; // Array of [lng, lat] pairs
  last_updated: Date;
}

export interface LogMessage {
  id: string;
  timestamp: Date;
  type: "info" | "broadcast" | "error" | "success";
  message: string;
  payload?: any;
}

export interface TrackingContextType {
  wsUrl: string;
  setWsUrl: React.Dispatch<React.SetStateAction<string>>;
  isConnected: boolean;
  driversList: DriverLocationState[];
  drivers: Record<string, DriverLocationState>;
  logs: LogMessage[];
  setLogs: React.Dispatch<React.SetStateAction<LogMessage[]>>;
  selectedDriverId: string | null;
  setSelectedDriverId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedDriver: DriverLocationState | null;
  isSimulating: boolean;
  protocol: "wss" | "ws";
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  mapCenter: { lat: number; lng: number };
  setMapCenter: React.Dispatch<React.SetStateAction<{ lat: number; lng: number }>>;
  isManualPan: boolean;
  setIsManualPan: React.Dispatch<React.SetStateAction<boolean>>;
  handleProtocolChange: (newProtocol: "wss" | "ws") => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  toggleSimulation: () => void;
  handlePan: (direction: "up" | "down" | "left" | "right") => void;
  VIEWPORT_W: number;
  VIEWPORT_H: number;
  centerTxFloat: number;
  centerTyFloat: number;
  getOsmSvgPixel: (targetLat: number, targetLng: number) => { x: number; y: number };
  osmTiles: { key: string; left: number; top: number; url: string }[];
  driverUserId: string;
  setDriverUserId: React.Dispatch<React.SetStateAction<string>>;
}

const TrackingContext = createContext<TrackingContextType | null>(null);

export const TrackingProvider: React.FC = () => {
  const tenant = useAuthStore((state) => state.tenant) || "nagpur";
  const accessToken = useAuthStore((state) => state.accessToken);

  const [wsUrl, setWsUrl] = useState<string>(getCityWsUrl(tenant, DEFAULT_WS_PROTOCOL));
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [drivers, setDrivers] = useState<Record<string, DriverLocationState>>({});
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [protocol, setProtocol] = useState<"wss" | "ws">(DEFAULT_WS_PROTOCOL);
  const [driverUserId, setDriverUserId] = useState<string>("");

  // OpenStreetMap active projection states
  const [zoom, setZoom] = useState<number>(14);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 21.1458, lng: 79.0882 });
  const [isManualPan, setIsManualPan] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const simulationIntervalRef = useRef<any>(null);

  // Auto update wsUrl based on driverUserId, protocol, tenant, and accessToken
  useEffect(() => {
    const host = `${protocol}://${tenant.replace(/_/g, "-")}.${cleanHost}`;
    if (driverUserId) {
      const trackingUrl = `${host}/ws/tracking/driver/${driverUserId}/${accessToken ? `?token=${accessToken}` : ""}`;
      setWsUrl(trackingUrl);
    } else {
      setWsUrl(getCityWsUrl(tenant, protocol));
    }
  }, [driverUserId, protocol, tenant, accessToken]);

  // Sync protocol buttons with URL string easily
  const handleProtocolChange = (newProtocol: "wss" | "ws") => {
    setProtocol(newProtocol);
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
      if (accessToken && !finalEndpointUrl.includes("token=")) {
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
  }, [drivers, selectedDriverId, isManualPan, driversList.length]);

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
  // Make these responsive or large enough
  const VIEWPORT_W = 1920;
  const VIEWPORT_H = 1080;

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
    // Adjusted grid size to cover 1920x1080 (9x7 = 63 tiles) optimally
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
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

  const value: TrackingContextType = {
    wsUrl, setWsUrl,
    isConnected,
    driversList, drivers,
    logs, setLogs,
    selectedDriverId, setSelectedDriverId, selectedDriver,
    isSimulating,
    protocol,
    zoom, setZoom,
    mapCenter, setMapCenter,
    isManualPan, setIsManualPan,
    handleProtocolChange,
    connectWebSocket, disconnectWebSocket,
    toggleSimulation,
    handlePan,
    VIEWPORT_W, VIEWPORT_H,
    centerTxFloat, centerTyFloat,
    getOsmSvgPixel,
    osmTiles,
    driverUserId,
    setDriverUserId
  };

  return (
    <TrackingContext.Provider value={value}>
      <Outlet />
    </TrackingContext.Provider>
  );
};

export const useLiveTracking = () => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error("useLiveTracking must be used within a TrackingProvider");
  }
  return context;
};
