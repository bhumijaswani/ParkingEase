import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { socket } from '../api/socket';

export default function useLiveSlots() {
  const [slots, setSlots] = useState([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadSlots() {
      try {
        const res = await axiosClient.get('/slots');
        if (!cancelled) {
          setSlots(res.data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load slots.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    function onConnect() {
      setConnected(true);
      loadSlots(); // har (re)connect pe fresh fetch: miss hue events cover ho jaate hain
    }
    
    function onDisconnect() {
      setConnected(false);
    }

    function onSlotUpdated(updated) {
      setSlots((prev) =>
        prev.some((s) => s._id === updated._id)
          ? prev.map((s) => (s._id === updated._id ? updated : s))
          : [...prev, updated]
      );
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('slot:updated', onSlotUpdated);

    loadSlots(); // socket ke bina bhi page pe data aaye
    socket.connect();

    return () => {
      cancelled = true;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('slot:updated', onSlotUpdated);
      socket.disconnect();
    };
  }, []);

  return { slots, connected, loading, error };
}