"use client";
import { useEffect } from "react";
import logger from "@/lib/utils/logger";


export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js', { scope: '/' })
            .then(reg => {
              logger.debug('SW registered:', reg);
              if (!navigator.serviceWorker.controller) {
                logger.debug('No active controller yet — waiting for activation');
              }
              // listen for lifecycle changes
              reg.addEventListener('updatefound', () => {
                logger.debug('updatefound', reg.installing);
                reg.installing?.addEventListener('statechange', (state) => {
                  logger.debug('SW state:', reg.installing, state);
                });
              });
            })
            .catch(err => logger.error('SW registration failed:', err));
        });
      }
    }
  }, []);

  return null;
}
