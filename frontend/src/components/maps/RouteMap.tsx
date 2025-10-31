import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Route, RouteStop } from '../../types/api.types';
import { Box, Typography, Chip } from '@mui/material';

interface RouteMapProps {
  route: Route;
  height?: string;
}

const FitRouteBounds: React.FC<{ stops: RouteStop[] }> = ({ stops }) => {
  const map = useMap();

  React.useEffect(() => {
    const validStops = stops.filter(s => s.order.latitude && s.order.longitude);
    if (validStops.length > 0) {
      const bounds = validStops.map(s => 
        [s.order.latitude!, s.order.longitude!] as LatLngExpression
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [stops, map]);

  return null;
};

const RouteMap: React.FC<RouteMapProps> = ({ route, height = '600px' }) => {
  const routeStops = route.stops
    .filter(s => s.order.latitude && s.order.longitude)
    .sort((a, b) => a.sequence - b.sequence);

  const routeLine: LatLngExpression[] = routeStops.map(stop => 
    [stop.order.latitude!, stop.order.longitude!]
  );

  const getStopColor = (status: RouteStop['status']) => {
    const colors = {
      PENDING: '#ff9800',
      EN_ROUTE: '#2196f3',
      DELIVERED: '#4caf50',
      FAILED: '#f44336',
    };
    return colors[status];
  };

  return (
    <Box sx={{ height, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer
        center={[43.6532, -79.3832]}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitRouteBounds stops={route.stops} />

        {/* Draw route line */}
        {routeLine.length > 1 && (
          <Polyline
            positions={routeLine}
            pathOptions={{
              color: '#2196f3',
              weight: 4,
              opacity: 0.7,
              dashArray: '10, 10',
            }}
          />
        )}

        {/* Markers for each stop */}
        {routeStops.map((stop, index) => (
          <Marker
            key={stop.id}
            position={[stop.order.latitude!, stop.order.longitude!]}
          >
            <Popup>
              <Box sx={{ minWidth: 250 }}>
                <Typography variant="h6" gutterBottom>
                  Stop {index + 1} of {routeStops.length}
                </Typography>
                <Chip
                  label={stop.status}
                  size="small"
                  sx={{ 
                    mb: 1,
                    bgcolor: getStopColor(stop.status),
                    color: 'white',
                  }}
                />
                <Typography variant="body2">
                  <strong>Order:</strong> {stop.order.orderNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Customer:</strong> {stop.order.customerName}
                </Typography>
                <Typography variant="body2">
                  <strong>Phone:</strong> {stop.order.customerPhone}
                </Typography>
                <Typography variant="body2">
                  <strong>Address:</strong> {stop.order.address}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default RouteMap;