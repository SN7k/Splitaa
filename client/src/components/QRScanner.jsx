import React, { useRef, useState, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import './QRScanner.css';

const QRScanner = ({ onClose }) => {
  const videoRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { colors } = useTheme();

  useEffect(() => {
    if (!videoRef.current) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      (result) => {
        console.log('✅ QR Code scanned:', result.data);
        handleScanResult(result.data);
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    setScanner(qrScanner);
    qrScanner.start().catch((err) => {
      console.error('❌ Error starting scanner:', err);
      setError('Failed to access camera. Please allow camera permissions.');
    });

    return () => {
      if (qrScanner) {
        qrScanner.stop();
        qrScanner.destroy();
      }
    };
  }, []);

  const handleScanResult = (data) => {
    try {
      // Extract invite token from URL
      // Expected format: http://localhost:5173/invite/TOKEN or https://splitaa.snk.codes/invite/TOKEN
      const url = new URL(data);
      const pathParts = url.pathname.split('/');
      const inviteIndex = pathParts.indexOf('invite');
      
      if (inviteIndex !== -1 && pathParts[inviteIndex + 1]) {
        const token = pathParts[inviteIndex + 1];
        console.log('📧 Extracted token:', token);
        
        // Stop scanning
        if (scanner) {
          scanner.stop();
        }

        // Navigate to invite page
        onClose();
        navigate(`/invite/${token}`);
      } else {
        setError('Invalid QR code');
        setTimeout(() => setError(''), 2000);
      }
    } catch (err) {
      console.error('❌ Error parsing QR code:', err);
      setError('Invalid QR code');
      setTimeout(() => setError(''), 2000);
    }
  };

  return (
    <div className="qr-scanner-overlay" onClick={onClose}>
      <div className="qr-scanner-wrapper" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button className="qr-close-btn" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>

        {/* Error message */}
        {error && (
          <div className="qr-error-toast">
            ⚠️ {error}
          </div>
        )}

        {/* Camera view */}
        <div className="qr-camera-container">
          <video ref={videoRef} className="qr-camera-video"></video>
          <div className="qr-scan-overlay">
            <div className="qr-corner qr-corner-tl"></div>
            <div className="qr-corner qr-corner-tr"></div>
            <div className="qr-corner qr-corner-bl"></div>
            <div className="qr-corner qr-corner-br"></div>
            <div className="qr-scan-line"></div>
          </div>
        </div>

        {/* Instruction text */}
        <div className="qr-instruction">
          Scan QR Code
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
