import { useState, useEffect, useRef } from 'react';
import { fetchChannelStats } from './services/youtubeService';
import type { YoutubeStats } from './types';
import './App.css';

const POLLING_INTERVAL = 60000; // 60 sekund
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

function App() {
  const [channelId, setChannelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [stats, setStats] = useState<YoutubeStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastViews, setLastViews] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const intervalRef = useRef<number>();

  useEffect(() => {
    if (isMonitoring) {
      // Początkowe sprawdzenie
      checkStats();
      
      // Ustawienie interwału
      intervalRef.current = window.setInterval(checkStats, POLLING_INTERVAL);
      
      // Czyszczenie
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isMonitoring]);

  const checkStats = async () => {
    try {
      const newStats = await fetchChannelStats(channelId, apiKey);
      
      // Sprawdź czy są nowe wyświetlenia
      if (lastViews !== null && newStats.totalViews > lastViews) {
        audioRef.current?.play();
      }
      
      setStats(newStats);
      setLastViews(newStats.totalViews);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd');
      stopMonitoring();
    }
  };

  const startMonitoring = async () => {
    if (!channelId || !apiKey) {
      setError('Wypełnij wszystkie pola');
      return;
    }

    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">Monitor wyświetleń YouTube</h1>
        
        {!isMonitoring ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">ID kanału YouTube</label>
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="np. UC..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Klucz API</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={startMonitoring}
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
            >
              Rozpocznij monitorowanie
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Liczba filmów</p>
              <p className="text-xl font-bold">{stats?.videoCount || 0}</p>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">Suma wyświetleń</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats?.totalViews.toLocaleString() || 0}
              </p>
            </div>

            <button
              onClick={stopMonitoring}
              className="w-full bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
            >
              Zatrzymaj monitorowanie
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>

      <audio ref={audioRef} src={NOTIFICATION_SOUND} />
    </div>
  );
}

export default App;
