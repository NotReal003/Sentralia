import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar, Footer, Unavailability } from './components';
import MaintenanceMode from './components/NoAPI';
import routeConfig from './routes';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import Ads from './components/Ads';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const API = process.env.REACT_APP_API;

    useEffect(() => {
    axios.get(`${API}/health`, { timeout: 7000 })
      .then(res => {
        const data = res.data;

        const isRailwayErrorBody =
          data?.status === "error" ||
          data?.status === 404 ||
          data?.code === 404 ||
          data?.message === "Application failed to respond" ||
          data?.message === "Application not found";

        setApiUnavailable(isRailwayErrorBody);
      })
      .catch(err => {
        const errorData = err?.response?.data; 

        const isRealDown =
          err?.code === "ECONNABORTED" || //
          err?.code === "ERR_BAD_RESPONSE" ||
          err?.response?.status === 502 || //
          err?.response?.status === 404 ||
          errorData?.code === 404 ||       // Handles the nested JSON "code"
          errorData?.message === "Application not found" ||
          errorData?.message === "Application failed to respond";

        setApiUnavailable(!!isRealDown); 
      });
  }, [API]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      axios.get(`${API}/ref/${ref}`);
      console.log(`${ref} referral`);
    }

    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (token) {
      setIsAuthenticated(true);
    } 

    setAuthChecked(true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [API]);

  useEffect(() => {
    if (!isOnline) {
      toast.error('No Internet connection');
    }
  }, [isOnline]);

  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center text-white bg-gray-900">
        <p>A moment...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="relative min-h-screen">
        <Navbar isAuthenticated={isAuthenticated} />
        <Unavailability/>
        
        <main className="container mx-auto">
          <Routes>
            {routeConfig(isAuthenticated).map((route, index) => (
              <Route
                key={index}
                path={route.path}
                element={route.element}
              />
            ))}
          </Routes>
        </main>

        <Footer />
        <Toaster />

        {apiUnavailable && (
          <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center">
            <MaintenanceMode />
          </div>
        )}
      </div>
    </Router>
  );
};

export default App;
