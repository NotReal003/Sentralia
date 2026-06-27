import axios from 'axios';
import { useEffect } from 'react';

const PerformanceSender = () => {
  useEffect(() => {
    const API = process.env.REACT_APP_API;
    import('web-vitals').then(({ getCLS, getFID, getLCP, getFCP, getTTFB, getINP }) => {
      const send = (metric) => {
        axios.post(`${API}/performance`, metric, {
          headers: {
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }).catch(err => {
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
