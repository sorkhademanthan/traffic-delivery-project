import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAppSelector } from '../../store/hooks';
import { wsService } from '../../services/websocket.service';

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && token) {
      wsService.connect(token);
      
      return () => {
        wsService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
          },
          success: {
            iconTheme: { primary: '#4caf50', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#f44336', secondary: '#fff' },
          },
        }}
      />
    </>
  );
};

export default NotificationProvider;