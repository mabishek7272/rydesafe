"use client";

import { useEffect, useState } from "react";
import { 
  Activity, 
  Map as MapIcon, 
  AlertTriangle, 
  UserCheck, 
  Bus,
  Clock
} from "lucide-react";

interface DispatchEvent {
  type: string;
  tripId: string;
  passengerName?: string;
  action?: string;
  timestamp: string;
}

export default function DispatchDashboard() {
  const [events, setEvents] = useState<DispatchEvent[]>([]);
  const [activeTrips, setActiveTrips] = useState(0);

  useEffect(() => {
    const eventSource = new EventSource("/api/dispatch/live");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type !== 'HEARTBEAT') {
        setEvents(prev => [data, ...prev].slice(0, 50));
        if (data.type === 'TRIP_STARTED') setActiveTrips(prev => prev + 1);
      }
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Dispatch Control</h1>
          <p className="text-slate-400">Real-time monitoring of all active routes</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
            <Bus className="text-blue-500" size={20} />
            <div>
              <p className="text-xs text-slate-400">Active Trips</p>
              <p className="text-lg font-bold text-white">{activeTrips}</p>
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={20} />
            <div>
              <p className="text-xs text-slate-400">Alerts</p>
              <p className="text-lg font-bold text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Feed */}
        <div className="lg:col-span-1 bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
            <Activity size={18} className="text-blue-400" />
            <h2 className="font-semibold text-white">Live Activity Feed</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {events.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Clock size={32} />
                <p>Waiting for live events...</p>
              </div>
            ) : (
              events.map((event, i) => (
                <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className={`mt-1 p-2 rounded-lg ${
                    event.type === 'SOS_TRIGGERED' ? 'bg-red-500/20 text-red-500' :
                    event.type === 'PASSENGER_EVENT' ? 'bg-green-500/20 text-green-500' :
                    'bg-blue-500/20 text-blue-500'
                  }`}>
                    {event.type === 'PASSENGER_EVENT' ? <UserCheck size={14} /> : <Bus size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      {event.type === 'PASSENGER_EVENT' 
                        ? <span><b>{event.passengerName}</b> was {event.action?.toLowerCase().replace('_', ' ')}</span>
                        : <span>Trip <b>{event.tripId}</b> was started</span>
                      }
                    </p>
                    <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Map Placeholder */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden relative h-[600px]">
           <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-500">
              <MapIcon size={48} className="mb-4 opacity-20" />
              <p>Live GPS Fleet Map</p>
              <p className="text-sm">Integrating Wialon Stream...</p>
           </div>
           
           {/* Floating Info Overlay */}
           <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-xl w-64">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Vehicle Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white">Bus 102 (KL-99)</span>
                  <span className="text-green-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Active</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white">Bus 105 (KL-42)</span>
                  <span className="text-slate-500 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-500" /> Idle</span>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
