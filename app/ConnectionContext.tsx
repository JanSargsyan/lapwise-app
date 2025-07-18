import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ConnectionContextType {
  connectedDeviceId: string | null;
  setConnectedDeviceId: (id: string | null) => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
} 