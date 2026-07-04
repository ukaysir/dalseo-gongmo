"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useEffect, useMemo } from "react";
import type { AddressCandidate, ImpactItem } from "@/lib/types";

const categoryColors: Record<ImpactItem["category"], string> = {
  traffic: "#9a5a12",
  construction: "#7c4b1f",
  urban_plan: "#315fd1",
  council: "#7650b5",
  public_notice: "#236452",
  event: "#b13b61",
  safety: "#bf2638",
  parking: "#1d73a6",
  heat: "#c2601b",
  facility: "#587735",
  welfare: "#6b58c9",
  environment: "#287a59",
};

const fallbackCenter: [number, number] = [35.82982, 128.53273];
const radiusOptions = [500, 1000, 2000];

type ImpactMapProps = {
  center: AddressCandidate;
  items: ImpactItem[];
  radiusM: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRadiusChange: (radiusM: number) => void;
  onPickLocation?: (lat: number, lng: number) => void;
};

export default function ImpactMap({
  center,
  items,
  radiusM,
  selectedId,
  onSelect,
  onRadiusChange,
  onPickLocation,
}: ImpactMapProps) {
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0];
  const userIcon = useMemo(() => createIcon("#172554", "기준 위치"), []);
  const centerPoint: [number, number] = isUsableCoordinate(center.lat, center.lng)
    ? [center.lat, center.lng]
    : fallbackCenter;

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-dalseo-border p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">지도 기반 영향 범위</h2>
          <p className="mt-1 text-sm leading-6 text-dalseo-muted">지도를 눌러 기준 위치를 변경할 수 있습니다.</p>
        </div>
        <div className="flex gap-2 text-xs font-semibold text-dalseo-muted">
          <span className="rounded-dalseo bg-dalseo-soft px-2.5 py-1">
            검색 {radiusM.toLocaleString()}m
          </span>
          <span className="rounded-dalseo bg-dalseo-soft px-2.5 py-1">
            표시 {items.length}건
          </span>
        </div>
      </div>

      <div className="relative h-[560px] w-full xl:h-[calc(100dvh-13rem)] xl:min-h-[560px] xl:max-h-[720px]">
        <div className="absolute right-3 top-3 z-[500] rounded-dalseo border border-dalseo-border bg-white p-1 shadow-[var(--shadow)]">
          <div className="grid grid-cols-3 gap-1">
            {radiusOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onRadiusChange(option)}
                className={`h-9 rounded-[6px] px-3 text-xs font-extrabold transition ${
                  radiusM === option
                    ? "bg-dalseo-accent-strong text-white"
                    : "text-dalseo-muted hover:bg-dalseo-soft hover:text-dalseo-ink"
                }`}
              >
                {formatRadius(option)}
              </button>
            ))}
          </div>
        </div>
        <MapContainer
          center={centerPoint}
          zoom={14}
          scrollWheelZoom
          className="h-full w-full"
        >
          <MapClickPicker onPickLocation={onPickLocation} />
          <MapViewport center={centerPoint} selectedItem={selectedItem} radiusM={radiusM} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Circle
            center={centerPoint}
            radius={radiusM}
            pathOptions={{
              color: "#315fd1",
              fillColor: "#315fd1",
              fillOpacity: 0.06,
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

function MapClickPicker({
  onPickLocation,
}: {
  onPickLocation?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPickLocation?.(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
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
  const line = linePositions(item);

  return (
    <>
      {line ? (
        <Polyline
          positions={line}
          pathOptions={{
            color,
            opacity: isSelected ? 0.9 : 0.58,
            weight: isSelected ? 6 : 4,
          }}
        />
      ) : null}
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
          예상 범위 {(item.impact_radius_m ?? 350).toLocaleString()}m
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
      const positions = [
        center,
        [selectedItem.lat, selectedItem.lng],
        ...(linePositions(selectedItem) ?? []),
      ] as [number, number][];
      const bounds = L.latLngBounds(positions).pad(0.45);
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

function isUsableCoordinate(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) > 1 && Math.abs(lng) > 1;
}

function linePositions(item: ImpactItem): [number, number][] | null {
  const coordinates = item.geometry?.coordinates;

  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  const positions = coordinates
    .filter((coordinate) => isUsableCoordinate(coordinate.lat, coordinate.lng))
    .map((coordinate) => [coordinate.lat, coordinate.lng] as [number, number]);

  return positions.length >= 2 ? positions : null;
}

function formatRadius(value: number) {
  return value >= 1000 ? `${value / 1000}km` : `${value}m`;
}
