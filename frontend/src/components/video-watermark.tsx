"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { Shield } from 'lucide-react';

interface VideoWatermarkProps {
  userName?: string;
  userEmail?: string;
}

export default function VideoWatermark({ userName, userEmail }: VideoWatermarkProps) {
  const { user } = useAuth();
  const [quadrant, setQuadrant] = useState<number>(0);
  const [timestamp, setTimestamp] = useState<string>('');

  const displayName = userName || (user ? `${user.firstName} ${user.lastName}` : 'Alpha Student');
  const displayEmail = userEmail || (user ? user.email : 'student@alphacoding.com');

  // Rotate position smoothly across 4 quadrants every 12 seconds
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimestamp(
        now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      );
    };

    updateTime();
    const timeInterval = setInterval(updateTime, 1000);

    const positionInterval = setInterval(() => {
      setQuadrant((prev) => (prev + 1) % 4);
    }, 12000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(positionInterval);
    };
  }, []);

  // Quadrant CSS positioning classes
  const quadrantStyles = [
    'top-6 left-6', // Quadrant 0: Top-Left
    'top-6 right-6', // Quadrant 1: Top-Right
    'bottom-16 right-6', // Quadrant 2: Bottom-Right
    'bottom-16 left-6', // Quadrant 3: Bottom-Left
  ];

  return (
    <div
      className={`absolute z-30 pointer-events-none select-none transition-all duration-1000 ease-in-out ${quadrantStyles[quadrant]}`}
    >
      <div className="bg-black/30 backdrop-blur-[2px] border border-white/10 rounded-lg px-2.5 py-1 flex items-center gap-2 text-[10px] font-mono text-white/35 shadow-sm">
        <Shield className="w-3 h-3 text-purple-400/50 shrink-0" />
        <span className="font-semibold tracking-wider text-purple-300/40">ALPHA SECURE</span>
        <span className="text-white/30">•</span>
        <span className="truncate max-w-[140px]">{displayName}</span>
        <span className="text-white/20">({displayEmail})</span>
        <span className="text-white/30">•</span>
        <span className="text-white/30">{timestamp}</span>
      </div>
    </div>
  );
}
