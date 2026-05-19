import { useState, useEffect } from 'react';

interface IGeoState {
  lat: number | null;
  lng: number | null;
  error: string | null;
}

export const useGeolocation = (): IGeoState => {
  const [state, setState] = useState<IGeoState>({ lat: null, lng: null, error: null });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ lat: null, lng: null, error: 'Geolocation not supported' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setState({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null }),
      (err) => setState({ lat: null, lng: null, error: err.message }),
    );
  }, []);

  return state;
};
