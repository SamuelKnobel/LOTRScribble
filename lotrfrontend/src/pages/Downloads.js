import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../pages/Downloads.css';
import CryptoJS from 'crypto-js';

import { fetchVersions } from '../Utils';

const Downloads = () => {
  const [passwordInput, setPasswordInput] = useState("");
  // SHA-256 of the entered password; sent to the backend, which verifies it.
  const [downloadKey, setDownloadKey] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin/versions', downloadKey],
    queryFn: () => fetchVersions(downloadKey),
    enabled: !!downloadKey,
    retry: false,
  });

  // A rejected request (401) means the backend refused the password.
  useEffect(() => {
    if (isError) {
      toast.error("You shall not pass!");
      setDownloadKey(null);
      setPasswordInput("");
    }
  }, [isError]);

  const handleLogin = (e) => {
    e.preventDefault();
    setDownloadKey(CryptoJS.SHA256(passwordInput).toString());
  };

  const authenticated = !!data && !isError;
  const versionData = Array.isArray(data) ? data : [];

  // --- View: Login Screen ---
  if (!authenticated) {
    return (
      <div className="download-container">
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
              disabled={isLoading}
            />
            <button type="submit" className="unlock-btn" disabled={isLoading}>
              {isLoading ? "Checking…" : "Unlock"}
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
        <button
          onClick={() => { setDownloadKey(null); setPasswordInput(""); }}
          className="lock-btn"
        >
          Lock Page
        </button>
      </div>

      {versionData.length > 0 ? (
        <div className="table-wrapper">
          <table className="version-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Date</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {versionData.map((release, index) => (
                <tr key={index}>
                  <td className="version-cell">{release.version}</td>
                  <td>{release.date}</td>
                  <td>{release.notes}</td>
                  <td style={{ textAlign: 'right' }}>
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
      ) : (
        <p>No downloads available at the moment.</p>
      )}
    </div>
  );
};

export default Downloads;
