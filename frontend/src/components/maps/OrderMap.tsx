import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
import { Order } from '../../types/api.types';
import { Box, Chip } from '@mui/material';

interface OrderMapProps {
  orders: Order[];
  center?: LatLngExpression;
  zoom?: number;
  height?: string;
}

// Custom marker icons
const createCustomIcon = (color: string) => new Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const statusIcons = {
  PENDING: createCustomIcon('red'),
  ASSIGNED: createCustomIcon('orange'),
  IN_TRANSIT: createCustomIcon('blue'),
  DELIVERED: createCustomIcon('green'),
  FAILED: createCustomIcon('grey'),
  CANCELLED: createCustomIcon('black'),
};

// Component to fit bounds when orders change
const FitBounds: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const map = useMap();

  React.useEffect(() => {
    const validOrders = orders.filter(o => o.latitude && o.longitude);
    if (validOrders.length > 0) {
      const bounds = validOrders.map(o => [o.latitude!, o.longitude!] as LatLngExpression);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [orders, map]);

  return null;
};

const OrderMap: React.FC<OrderMapProps> = ({
  orders,
  center = [43.6532, -79.3832], // Toronto
  zoom = 12,
  height = '500px',
}) => {
  const validOrders = useMemo(
    () => orders.filter(o => o.latitude && o.longitude),
    [orders]
  );

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      PENDING: 'error',
      ASSIGNED: 'warning',
      IN_TRANSIT: 'info',
      DELIVERED: 'success',
      FAILED: 'default',
      CANCELLED: 'default',
    };
    return colors[status] as any;
  };

  return (
    <Box sx={{ height, width: '100%', borderRadius: 2, overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds orders={validOrders} />

        {validOrders.map((order) => (
          <Marker
            key={order.id}
            position={[order.latitude!, order.longitude!]}
            icon={statusIcons[order.status]}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <strong>{order.orderNumber}</strong>
                <br />
                <Chip
                  label={order.status}
                  color={getStatusColor(order.status)}
                  size="small"
                  sx={{ mt: 1, mb: 1 }}
                />
                <br />
                <strong>Customer:</strong> {order.customerName}
                <br />
                <strong>Phone:</strong> {order.customerPhone}
                <br />
                <strong>Address:</strong> {order.address}
                <br />
                {order.orderValue && (
                  <>
                    <strong>Value:</strong> ${order.orderValue.toFixed(2)}
                  </>
                )}
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
};

export default OrderMap;