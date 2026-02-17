import React, { useState, useEffect } from 'react'; // Added useEffect
import { useQuery } from '@tanstack/react-query';
// 1. Changed Imports for react-toastify
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../pages/Downloads.css';
import CryptoJS from 'crypto-js';

import { fetchData } from '../Utils';

const Downloads =()=> {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [versionData, setVersionData] = useState([])
  

  const STORED_HASH = process.env.REACT_APP_DOWNLOAD_PASSWORD;

const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin/versions'],
    queryFn: () => fetchData('admin/versions'),
    enabled: isAuthenticated, // Only fetch when authenticated
  });

  
useEffect(() => {
    if (data) {
      setVersionData(data);
    } else {
      setVersionData([]);
    }
  }, [data]);
  

  const handleLogin = (e) => {
    e.preventDefault();

    const inputHash = CryptoJS.SHA256(passwordInput).toString();
    
    if (inputHash === STORED_HASH) {
      setIsAuthenticated(true);
      toast.success("Access Granted");
    } else {
      toast.error("You shall not pass!");
      setPasswordInput("");
    }
  };

  // --- View: Login Screen ---
  if (!isAuthenticated) {
    return (
      <div className="download-container">
        {/* 2. Changed Toaster to ToastContainer */}
        <ToastContainer position="top-center" autoClose={3000} />
        
        <div className="login-box">
          <h1>Restricted Area</h1>
          <p>Please speak the password to enter.</p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter password..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="password-input"
            />
            <button type="submit" className="unlock-btn">
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- View: Download Area (Authenticated) ---
  return (
    <div className="download-container">
      <ToastContainer position="top-center" autoClose={3000} />
      
      <div className="header-row">
        <h1>Latest Releases</h1>
        <button onClick={() => setIsAuthenticated(false)} className="lock-btn">
          Lock Page
        </button>
      </div>

      {isLoading && <p>Loading versions...</p>}
      {isError && <p className="error">Error: {error.message}</p>}
{/* Render Table only if we have data */}
      {versionData.length > 0 && (
        <div className="table-wrapper">
          <table className="version-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Date</th>
                <th>Notes</th>
                <th style={{textAlign: 'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Map over versionData instead of 'releases' */}
              {versionData.map((release, index) => (
                <tr key={index}>
                  <td className="version-cell">{release.version}</td>
                  <td>{release.date}</td>
                  <td>{release.notes}</td>
                  <td style={{textAlign: 'right'}}>
                    <a 
                      href={release.url} 
                      className="download-link" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Optional: Show message if authenticated but no versions found */}
      {!isLoading && !isError && versionData.length === 0 && (
          <p>No downloads available at the moment.</p>
      )}
    </div>
  );
}

export default Downloads;