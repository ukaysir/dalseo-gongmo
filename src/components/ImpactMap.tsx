"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import type { AddressCandidate, ImpactItem } from "@/lib/types";

const categoryColors: Record<ImpactItem["category"], string> = {
  traffic: "#b45309",
  construction: "#92400e",
  urban_plan: "#1d4ed8",
  council: "#6d28d9",
  public_notice: "#0f766e",
  event: "#be123c",
  safety: "#dc2626",
  parking: "#0369a1",
  heat: "#ea580c",
  facility: "#4d7c0f",
  welfare: "#7c3aed",
  environment: "#15803d",
};

type ImpactMapProps = {
  center: AddressCandidate;
  items: ImpactItem[];
  radiusM: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export default function ImpactMap({
  center,
  items,
  radiusM,
  selectedId,
  onSelect,
}: ImpactMapProps) {
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0];
  const userIcon = useMemo(() => createIcon("#111827", "내 위치"), []);
  const centerPoint: [number, number] = [center.lat, center.lng];

  return (
    <section className="border border-[#dfe4d6] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#dfe4d6] p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">지도 기반 영향범위</h2>
          <p className="mt-1 text-sm text-[#69746d]">
            내 위치, 검색 반경, 각 공공데이터 이슈의 예상 영향권을 함께 표시합니다.
          </p>
        </div>
        <div className="flex gap-2 text-xs text-[#59645d]">
          <span className="border border-[#d7ddcf] px-2 py-1">검색 {radiusM.toLocaleString()}m</span>
          <span className="border border-[#d7ddcf] px-2 py-1">표시 {items.length}건</span>
        </div>
      </div>

      <div className="h-[390px] w-full">
        <MapContainer
          center={centerPoint}
          zoom={14}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <MapViewport center={centerPoint} selectedItem={selectedItem} radiusM={radiusM} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={centerPoint}
            radius={radiusM}
            pathOptions={{
              color: "#111827",
              fillColor: "#111827",
              fillOpacity: 0.04,
              weight: 2,
              dashArray: "6 6",
            }}
          />
          <Marker position={centerPoint} icon={userIcon}>
            <Popup>
              <strong>{center.label}</strong>
              <br />
              {center.address}
            </Popup>
          </Marker>

          {items.map((item) => {
            const color = categoryColors[item.category] ?? "#2563eb";
            const isSelected = item.id === selectedItem?.id;

            return (
              <MarkerWithCircle
                key={item.id}
                item={item}
                color={color}
                isSelected={isSelected}
                onSelect={onSelect}
              />
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}

function MarkerWithCircle({
  item,
  color,
  isSelected,
  onSelect,
}: {
  item: ImpactItem;
  color: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <Circle
        center={[item.lat, item.lng]}
        radius={item.impact_radius_m ?? 350}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: isSelected ? 0.18 : 0.08,
          weight: isSelected ? 3 : 1,
        }}
      />
      <Marker
        position={[item.lat, item.lng]}
        icon={createIcon(color, item.category, isSelected)}
        eventHandlers={{ click: () => onSelect(item.id) }}
      >
        <Popup>
          <strong>{item.title}</strong>
          <br />
          {item.address}
          <br />
          영향권 {(item.impact_radius_m ?? 350).toLocaleString()}m
        </Popup>
      </Marker>
    </>
  );
}

function MapViewport({
  center,
  selectedItem,
  radiusM,
}: {
  center: [number, number];
  selectedItem?: ImpactItem;
  radiusM: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedItem) {
      const bounds = L.latLngBounds([
        center,
        [selectedItem.lat, selectedItem.lng],
      ]).pad(0.45);
      map.fitBounds(bounds, { animate: true, maxZoom: 15 });
      return;
    }

    map.setView(center, radiusM <= 500 ? 15 : 14, { animate: true });
  }, [center, map, radiusM, selectedItem]);

  return null;
}

function createIcon(color: string, label: string, selected = false) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${selected ? 22 : 18}px;
      height:${selected ? 22 : 18}px;
      border-radius:999px;
      background:${color};
      border:3px solid white;
      box-shadow:0 2px 10px rgba(0,0,0,.28);
    " aria-label="${label}"></div>`,
    iconSize: [selected ? 22 : 18, selected ? 22 : 18],
    iconAnchor: [selected ? 11 : 9, selected ? 11 : 9],
  });
}
