import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('fetching...');
  const API = process.env.REACT_APP_API;

  const fetchMetrics = async () => {
    try {
      const res = await axios.get(`${API}/performance`, { withCredentials: true });
      setMetrics(res.data);
      setLastUpdated(format(new Date(), 'HH:mm:ss'));
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setLastUpdated('Error');
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, lastUpdated };
};

export default usePerformanceMetrics;
