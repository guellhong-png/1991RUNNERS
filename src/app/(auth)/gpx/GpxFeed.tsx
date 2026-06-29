{/* 스탯 */}
<div className="grid grid-cols-3 gap-2 mb-3">
  {route.distance != null && (
    <div>
      <p className="text-base font-bold text-gray-900">{route.distance.toFixed(2)} km</p>
      <p className="text-xs text-gray-400">거리</p>
    </div>
  )}
  {route.elevation_gain != null && (
    <div>
      <p className="text-base font-bold text-gray-900">↑ {route.elevation_gain} m</p>
      <p className="text-xs text-gray-400">총 상승</p>
    </div>
  )}
  {(route as any).elevation_loss != null && (
    <div>
      <p className="text-base font-bold text-gray-900">↓ {(route as any).elevation_loss} m</p>
      <p className="text-xs text-gray-400">총 하강</p>
    </div>
  )}
</div>
