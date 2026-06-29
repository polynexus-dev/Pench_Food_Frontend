import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { getCityWsUrl, DEFAULT_WS_PROTOCOL, cleanHost } from "../utils/constants";

export interface StoppageEvent {
  lat: number;
  lng: number;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  near_customers: number;
  allowance_minutes: number;
  unproductive_minutes: number;
}

export interface DriverLocationState {
  driver_id: string;
  driver_name: string;
  lat: number;
  lng: number;
  trail: [number, number][]; // Array of [lng, lat] pairs
  last_updated: Date;
  distance_km?: number;
  planned_route?: [number, number][];
  actual_distance_km?: number;
  actual_duration_minutes?: number;
  stoppage_duration_minutes?: number;
  stoppage_history?: StoppageEvent[];
}

export interface LogMessage {
  id: string;
  timestamp: Date;
  type: "info" | "broadcast" | "error" | "success";
  message: string;
  payload?: any;
}

interface TrackingState {
  wsUrl: string;
  isConnected: boolean;
  drivers: Record<string, DriverLocationState>;
  logs: LogMessage[];
  selectedDriverId: string | null;
  isSimulating: boolean;
  protocol: "wss" | "ws";
  driverUserId: string;
  zoom: number;
  mapCenter: { lat: number; lng: number };
  isManualPan: boolean;

  setWsUrl: (wsUrl: string) => void;
  setDriverUserId: (driverUserId: string) => void;
  setSelectedDriverId: (id: string | null) => void;
  setMapCenter: (center: { lat: number; lng: number } | ((prev: { lat: number; lng: number }) => { lat: number; lng: number })) => void;
  setZoom: (zoom: number | ((z: number) => number)) => void;
  setIsManualPan: (isManualPan: boolean | ((prev: boolean) => boolean)) => void;
  setLogs: (logs: LogMessage[]) => void;
  handleProtocolChange: (protocol: "wss" | "ws") => void;
  connectWebSocket: () => void;
  disconnectWebSocket: () => void;
  toggleSimulation: () => void;
  handlePan: (direction: "up" | "down" | "left" | "right") => void;
  addLog: (type: LogMessage["type"], message: string, payload?: any) => void;
}

let wsInstance: WebSocket | null = null;
let simulationInterval: any = null;

export const useTrackingStore = create<TrackingState>((set, get) => ({
  wsUrl: "",
  isConnected: false,
  drivers: {} as Record<string, DriverLocationState>,
  logs: [] as LogMessage[],
  selectedDriverId: null,
  isSimulating: false,
  protocol: DEFAULT_WS_PROTOCOL,
  driverUserId: "",
  zoom: 14,
  mapCenter: { lat: 21.1458, lng: 79.0882 },
  isManualPan: false,

  setWsUrl: (wsUrl) => set({ wsUrl }),
  setDriverUserId: (driverUserId) => {
    set({ driverUserId });
    const { protocol } = get();
    const tenant = useAuthStore.getState().tenant || "nagpur";
    const accessToken = useAuthStore.getState().accessToken;
    const host = `${protocol}://${tenant.replace(/_/g, "-")}.${cleanHost}`;
    if (driverUserId) {
      const trackingUrl = `${host}/ws/tracking/driver/${driverUserId}/${accessToken ? `?token=${accessToken}` : ""}`;
      set({ wsUrl: trackingUrl });
    } else {
      set({ wsUrl: getCityWsUrl(tenant, protocol) });
    }
  },
  setSelectedDriverId: (selectedDriverId) => set({ selectedDriverId }),
  setMapCenter: (mapCenter) => {
    if (typeof mapCenter === "function") {
      set((state) => ({ mapCenter: mapCenter(state.mapCenter) }));
    } else {
      set({ mapCenter });
    }
  },
  setZoom: (zoom) => {
    if (typeof zoom === "function") {
      set((state) => ({ zoom: zoom(state.zoom) }));
    } else {
      set({ zoom });
    }
  },
  setIsManualPan: (isManualPan) => {
    if (typeof isManualPan === "function") {
      set((state) => ({ isManualPan: isManualPan(state.isManualPan) }));
    } else {
      set({ isManualPan });
    }
  },
  setLogs: (logs) => set({ logs }),

  handleProtocolChange: (newProtocol) => {
    set({ protocol: newProtocol });
    const { driverUserId } = get();
    const tenant = useAuthStore.getState().tenant || "nagpur";
    const accessToken = useAuthStore.getState().accessToken;
    const host = `${newProtocol}://${tenant.replace(/_/g, "-")}.${cleanHost}`;
    if (driverUserId) {
      const trackingUrl = `${host}/ws/tracking/driver/${driverUserId}/${accessToken ? `?token=${accessToken}` : ""}`;
      set({ wsUrl: trackingUrl });
    } else {
      set({ wsUrl: getCityWsUrl(tenant, newProtocol) });
    }
  },

  addLog: (type, message, payload) => {
    const newLog: LogMessage = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      type,
      message,
      payload,
    };
    set((state) => ({
      logs: [newLog, ...state.logs].slice(0, 100)
    }));
  },

  connectWebSocket: () => {
    if (wsInstance) {
      wsInstance.close();
    }

    const { wsUrl, addLog } = get();
    const accessToken = useAuthStore.getState().accessToken;

    try {
      let finalEndpointUrl = wsUrl;
      if (!finalEndpointUrl) {
        const tenant = useAuthStore.getState().tenant || "nagpur";
        const protocol = get().protocol;
        finalEndpointUrl = getCityWsUrl(tenant, protocol);
        set({ wsUrl: finalEndpointUrl });
      }

      if (accessToken && !finalEndpointUrl.includes("token=")) {
        const char = finalEndpointUrl.includes("?") ? "&" : "?";
        finalEndpointUrl = `${finalEndpointUrl}${char}token=${accessToken}`;
      }

      addLog("info", `Attempting secure connection to target socket stream...`, {
        baseEndpoint: get().wsUrl || finalEndpointUrl,
        tokenAttached: !!accessToken
      });

      const socket = new WebSocket(finalEndpointUrl);

      socket.onopen = () => {
        set({ isConnected: true });
        addLog("success", "WebSocket connected successfully. Joining Monitoring Group as Admin.");
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "broadcast_location" || (data.driver_id && data.lat && data.lng)) {
            addLog("broadcast", `Location broadcast received: ${data.driver_name || data.driver_id}`, data);

            set((state) => {
              const updatedDrivers: Record<string, DriverLocationState> = {
                ...state.drivers,
                [data.driver_id]: {
                  driver_id: data.driver_id,
                  driver_name: data.driver_name || `Driver #${data.driver_id}`,
                  lat: parseFloat(data.lat),
                  lng: parseFloat(data.lng),
                  trail: Array.isArray(data.trail) ? data.trail : [],
                  last_updated: new Date(),
                  distance_km: data.distance_km,
                  planned_route: Array.isArray(data.planned_route) ? data.planned_route : [],
                  actual_distance_km: data.actual_distance_km,
                  actual_duration_minutes: data.actual_duration_minutes,
                  stoppage_duration_minutes: data.stoppage_duration_minutes,
                  stoppage_history: Array.isArray(data.stoppage_history) ? data.stoppage_history : [],
                }
              };
              
              const selectedDriverId = state.selectedDriverId || data.driver_id;
              let nextMapCenter = state.mapCenter;
              
              if (!state.isManualPan) {
                if (selectedDriverId && updatedDrivers[selectedDriverId]) {
                  nextMapCenter = {
                    lat: updatedDrivers[selectedDriverId].lat,
                    lng: updatedDrivers[selectedDriverId].lng
                  };
                } else {
                  const driversList = Object.values(updatedDrivers);
                  const avgLat = driversList.reduce((sum, d) => sum + d.lat, 0) / driversList.length;
                  const avgLng = driversList.reduce((sum, d) => sum + d.lng, 0) / driversList.length;
                  nextMapCenter = { lat: avgLat, lng: avgLng };
                }
              }

              return {
                drivers: updatedDrivers,
                selectedDriverId,
                mapCenter: nextMapCenter
              };
            });
          } else {
            addLog("info", "Received non-telemetry message", data);
          }
        } catch (err) {
          addLog("error", "Failed to parse incoming WebSocket message payload", event.data);
        }
      };

      socket.onerror = () => {
        set({ isConnected: false });
        addLog("error", "WebSocket connection error encountered. Verify host and network configurations.");
      };

      socket.onclose = () => {
        set({ isConnected: false });
        addLog("info", "WebSocket connection terminated.");
      };

      wsInstance = socket;
    } catch (err: any) {
      addLog("error", `Failed to instantiate WebSocket client: ${err.message}`);
    }
  },

  disconnectWebSocket: () => {
    if (wsInstance) {
      wsInstance.close();
      wsInstance = null;
    }
    set({ isConnected: false });
    get().addLog("info", "Disconnected manually by Administrator.");
  },

  toggleSimulation: () => {
    const { isSimulating, addLog } = get();

    if (isSimulating) {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
      set({ isSimulating: false });
      addLog("info", "Live location simulation stopped.");
    } else {
      set({ isSimulating: true });
      addLog("success", "Simulation mode initialized. Generating simulated tracking broadcasts...");

      const simulatedDriversList = [
        {
          id: "DRV-101",
          name: "Rajesh Kumar",
          baseLat: 21.1458,
          baseLng: 79.0882,
          deltaLat: 0.0004,
          deltaLng: 0.0003,
          trail: [[79.0800, 21.1400], [79.0840, 21.1430]] as [number, number][],
          planned_route: [[79.0800, 21.1400], [79.0882, 21.1458], [79.0920, 21.1500]] as [number, number][],
          distance_km: 1.35,
        },
        {
          id: "DRV-102",
          name: "Suresh Yadav",
          baseLat: 21.1300,
          baseLng: 79.0700,
          deltaLat: -0.0002,
          deltaLng: 0.0005,
          trail: [[79.0600, 21.1250], [79.0650, 21.1280]] as [number, number][],
          planned_route: [[79.0600, 21.1250], [79.0700, 21.1300], [79.0780, 21.1370]] as [number, number][],
          distance_km: 1.85,
        },
        {
          id: "DRV-103",
          name: "Amit Patel",
          baseLat: 21.1600,
          baseLng: 79.1000,
          deltaLat: 0.0003,
          deltaLng: -0.0004,
          trail: [[79.1100, 21.1650], [79.1050, 21.1620]] as [number, number][],
          planned_route: [[79.1100, 21.1650], [79.1000, 21.1600], [79.0900, 21.1520]] as [number, number][],
          distance_km: 2.15,
        },
      ];

      simulatedDriversList.forEach((drv) => {
        const currentLng = drv.baseLng;
        const currentLat = drv.baseLat;
        set((state) => ({
          drivers: {
            ...state.drivers,
            [drv.id]: {
              driver_id: drv.id,
              driver_name: drv.name,
              lat: currentLat,
              lng: currentLng,
              trail: [...drv.trail, [currentLng, currentLat]],
              last_updated: new Date(),
              distance_km: drv.distance_km,
              planned_route: drv.planned_route,
              actual_distance_km: drv.distance_km * 0.95,
              actual_duration_minutes: 15,
              stoppage_duration_minutes: 2,
              stoppage_history: [
                {
                  lat: currentLat - 0.0004,
                  lng: currentLng - 0.0004,
                  start_time: "2026-06-19T12:00:00+05:30",
                  end_time: "2026-06-19T12:02:00+05:30",
                  duration_minutes: 2.0,
                  near_customers: 1,
                  allowance_minutes: 2.0,
                  unproductive_minutes: 0.0
                }
              ]
            }
          }
        }));
      });

      simulationInterval = setInterval(() => {
        simulatedDriversList.forEach((drv) => {
          drv.baseLat += drv.deltaLat + (Math.random() - 0.5) * 0.0002;
          drv.baseLng += drv.deltaLng + (Math.random() - 0.5) * 0.0002;

          if (drv.baseLat > 21.18 || drv.baseLat < 21.10) drv.deltaLat *= -1;
          if (drv.baseLng > 79.13 || drv.baseLng < 79.04) drv.deltaLng *= -1;

          drv.trail.push([drv.baseLng, drv.baseLat]);
          if (drv.trail.length > 20) drv.trail.shift();

          const mockData = {
            type: "broadcast_location",
            driver_id: drv.id,
            driver_name: drv.name,
            lat: parseFloat(drv.baseLat.toFixed(5)),
            lng: parseFloat(drv.baseLng.toFixed(5)),
            trail: [...drv.trail],
            distance_km: drv.distance_km,
            planned_route: drv.planned_route,
            actual_distance_km: parseFloat((drv.distance_km * 0.9 + Math.random() * 0.1).toFixed(2)),
            actual_duration_minutes: Math.floor(10 + Math.random() * 15),
            stoppage_duration_minutes: Math.floor(1 + Math.random() * 5),
            stoppage_history: [
              {
                lat: drv.baseLat - 0.0002,
                lng: drv.baseLng - 0.0002,
                start_time: new Date(Date.now() - 600000).toISOString(),
                end_time: new Date(Date.now() - 300000).toISOString(),
                duration_minutes: 5.0,
                near_customers: Math.floor(Math.random() * 3),
                allowance_minutes: 2.0,
                unproductive_minutes: 3.0
              }
            ]
          };

          addLog("broadcast", `[SIM] Broadcast: ${drv.name}`, mockData);
          set((state) => ({
            drivers: {
              ...state.drivers,
              [drv.id]: {
                driver_id: drv.id,
                driver_name: drv.name,
                lat: mockData.lat,
                lng: mockData.lng,
                trail: mockData.trail as [number, number][],
                last_updated: new Date(),
                distance_km: mockData.distance_km,
                planned_route: mockData.planned_route,
                actual_distance_km: mockData.actual_distance_km,
                actual_duration_minutes: mockData.actual_duration_minutes,
                stoppage_duration_minutes: mockData.stoppage_duration_minutes,
                stoppage_history: mockData.stoppage_history
              }
            }
          }));
        });
      }, 4000);
    }
  },

  handlePan: (direction) => {
    set({ isManualPan: true });
    const { mapCenter, zoom } = get();
    const getTileCount = (z: number) => Math.pow(2, z);
    const currentTx = ((mapCenter.lng + 180) / 360) * getTileCount(zoom);
    const latRad = (mapCenter.lat * Math.PI) / 180;
    const currentTy = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * getTileCount(zoom);

    let newTx = currentTx;
    let newTy = currentTy;

    const step = 0.3;
    if (direction === "left") newTx -= step;
    if (direction === "right") newTx += step;
    if (direction === "up") newTy -= step;
    if (direction === "down") newTy += step;

    const newLng = (newTx / getTileCount(zoom)) * 360 - 180;
    const M = Math.PI * (1 - (2 * newTy) / getTileCount(zoom));
    const newLat = (Math.atan(0.5 * (Math.exp(M) - Math.exp(-M))) * 180) / Math.PI;

    set({ mapCenter: { lat: newLat, lng: newLng } });
  }
}));
