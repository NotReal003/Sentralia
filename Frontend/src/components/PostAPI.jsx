import apiClient, { API } from '../utils/api';
import { useEffect } from 'react';

const PerformanceSender = () => {
  useEffect(() => {
    import('web-vitals').then(({ getCLS, getFID, getLCP, getFCP, getTTFB, getINP }) => {
      const send = (metric) => {
        apiClient.post(`${API}/performance`, metric).catch(err => {
          console.warn("Failed to send metric:", err);
        });
      };
      getCLS(send);
      getFID(send);
      getLCP(send);
      getFCP(send);
      getTTFB(send);
      getINP?.(send);
    });
  }, []);

  return null;
};

export default PerformanceSender;
