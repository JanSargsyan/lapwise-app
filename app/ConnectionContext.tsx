import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConnectionContextType {
  connectedDeviceId: string | null;
  setConnectedDeviceId: (id: string | null) => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);

  return (
    <ConnectionContext.Provider value={{ connectedDeviceId, setConnectedDeviceId }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error('useConnection must be used within a ConnectionProvider');
  return ctx;
} 