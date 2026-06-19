import React, { createContext, useContext, useMemo, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useTrackingStore } from "../../../store/useTrackingStore";
import type { DriverLocationState, LogMessage } from "../../../store/useTrackingStore";
export type { DriverLocationState, LogMessage };
import { useAuthStore } from "../../../store/useAuthStore";

export interface TrackingContextType {
  wsUrl: string;
  setWsUrl: (wsUrl: string) => void;
  isConnected: boolean;
  driversList: DriverLocationState[];
  drivers: Record<string, DriverLocationState>;
  logs: LogMessage[];
  setLogs: (logs: LogMessage[]) => void;
  selectedDriverId: string | null;
  setSelectedDriverId: (id: string | null) => void;
  selectedDriver: DriverLocationState | null;
  isSimulating: boolean;
  protocol: "wss" | "ws";
  zoom: number;
  setZoom: (zoom: number | ((z: number) => number)) => void;
  mapCenter: { lat: number; lng: number };
  setMapCenter: (center: { lat: number; lng: number } | ((prev: { lat: number; lng: number }) => { lat: number; lng: number })) => void;
  isManualPan: boolean;
  setIsManualPan: (isManualPan: boolean | ((prev: boolean) => boolean)) => void;
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
  setDriverUserId: (driverUserId: string) => void;
}

const TrackingContext = createContext<TrackingContextType | null>(null);

export const TrackingProvider: React.FC = () => {
  const store = useTrackingStore();
  const tenant = useAuthStore((state) => state.tenant) || "nagpur";
  const accessToken = useAuthStore((state) => state.accessToken);

  // Sync with auth store changes if necessary
  useEffect(() => {
    store.setDriverUserId(store.driverUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant, accessToken]);



  // Web Mercator helpers for precise positioning over live OpenStreetMap tile feeds
  // Make these responsive or large enough
  const VIEWPORT_W = 1920;
  const VIEWPORT_H = 1080;

  const centerTxFloat = useMemo(() => {
    return ((store.mapCenter.lng + 180) / 360) * Math.pow(2, store.zoom);
  }, [store.mapCenter.lng, store.zoom]);

  const centerTyFloat = useMemo(() => {
    const latRad = (store.mapCenter.lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, store.zoom);
  }, [store.mapCenter.lat, store.zoom]);

  const getOsmSvgPixel = (targetLat: number, targetLng: number) => {
    const tx = ((targetLng + 180) / 360) * Math.pow(2, store.zoom);
    const latRad = (targetLat * Math.PI) / 180;
    const ty = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, store.zoom);

    const px = VIEWPORT_W / 2 + (tx - centerTxFloat) * 256;
    const py = VIEWPORT_H / 2 + (ty - centerTyFloat) * 256;
    return { x: px, y: py };
  };

  const osmTiles = useMemo(() => {
    const baseTx = Math.floor(centerTxFloat);
    const baseTy = Math.floor(centerTyFloat);
    const maxTile = Math.pow(2, store.zoom);

    const tilesArr = [];
    for (let dx = -4; dx <= 4; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        const tx = baseTx + dx;
        const ty = baseTy + dy;

        if (ty >= 0 && ty < maxTile) {
          const wrappedTx = ((tx % maxTile) + maxTile) % maxTile;
          const leftPx = VIEWPORT_W / 2 + (tx - centerTxFloat) * 256;
          const topPx = VIEWPORT_H / 2 + (ty - centerTyFloat) * 256;

          tilesArr.push({
            key: `${store.zoom}-${wrappedTx}-${ty}`,
            left: leftPx,
            top: topPx,
            url: `https://tile.openstreetmap.org/${store.zoom}/${wrappedTx}/${ty}.png`,
          });
        }
      }
    }
    return tilesArr;
  }, [centerTxFloat, centerTyFloat, store.zoom]);

  const driversList = useMemo(() => Object.values(store.drivers), [store.drivers]);
  const selectedDriver = store.selectedDriverId ? store.drivers[store.selectedDriverId] : null;

  const value: TrackingContextType = {
    wsUrl: store.wsUrl,
    setWsUrl: store.setWsUrl,
    isConnected: store.isConnected,
    driversList,
    drivers: store.drivers,
    logs: store.logs,
    setLogs: store.setLogs,
    selectedDriverId: store.selectedDriverId,
    setSelectedDriverId: store.setSelectedDriverId,
    selectedDriver,
    isSimulating: store.isSimulating,
    protocol: store.protocol,
    zoom: store.zoom,
    setZoom: store.setZoom,
    mapCenter: store.mapCenter,
    setMapCenter: store.setMapCenter,
    isManualPan: store.isManualPan,
    setIsManualPan: store.setIsManualPan,
    handleProtocolChange: store.handleProtocolChange,
    connectWebSocket: store.connectWebSocket,
    disconnectWebSocket: store.disconnectWebSocket,
    toggleSimulation: store.toggleSimulation,
    handlePan: store.handlePan,
    VIEWPORT_W,
    VIEWPORT_H,
    centerTxFloat,
    centerTyFloat,
    getOsmSvgPixel,
    osmTiles,
    driverUserId: store.driverUserId,
    setDriverUserId: store.setDriverUserId,
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
