import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];

export const QRCodePage: React.FC = () => {
  const { alias } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const menuUrl = `${window.location.origin}/business/${alias}`;

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const { data, error: restaurantError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('alias', alias)
          .single();

        if (restaurantError) throw restaurantError;
        setRestaurant(data);
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        setError('Restaurant not found');
      } finally {
        setLoading(false);
      }
    };

    if (alias) {
      fetchRestaurant();
    }
  }, [alias]);

  const handleDownload = () => {
    const svg = document.getElementById('qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `${restaurant?.name || 'menu'}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500 text-lg">Restaurant not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
          {restaurant.name} - Menu QR Code
        </h1>
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-lg shadow-md">
            <QRCodeSVG
              id="qr-code"
              value={menuUrl}
              size={256}
              level="H"
              includeMargin
            />
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600 break-all">
            Menu URL: <a href={menuUrl} className="text-indigo-600 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">{menuUrl}</a>
          </p>

          <button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR Code
          </button>
        </div>
      </div>
    </div>
  );
};