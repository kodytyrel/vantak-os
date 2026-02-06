'use client';

import React, { useState, useEffect } from 'react';
import { isPushNotificationSupported, registerPushNotifications, savePushSubscription, getNotificationPermission } from '../lib/pushNotifications';
import { hasBusinessSuiteAccess } from '../lib/tierGating';

interface PushNotificationSetupProps {
  tenantId: string;
  tenantTier: string;
}

export const PushNotificationSetup: React.FC<PushNotificationSetupProps> = ({
  tenantId,
  tenantTier,
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setIsSupported(isPushNotificationSupported());
    setPermission(getNotificationPermission());
    setIsEnabled(permission === 'granted');
  }, [permission]);

  // Only show for Business Suite (Elite tier)
  if (!hasBusinessSuiteAccess(tenantTier as any)) {
    return null;
  }

  const handleEnable = async () => {
    if (!isSupported) {
      alert('Push notifications are not supported in this browser.');
      return;
    }

    setIsLoading(true);
    try {
      const subscription = await registerPushNotifications();
      
      if (subscription) {
        const saved = await savePushSubscription(tenantId, subscription);
        if (saved) {
          setIsEnabled(true);
          setPermission('granted');
          alert('Push notifications enabled! You\'ll receive appointment reminders.');
        } else {
          alert('Failed to save push subscription. Please try again.');
        }
      } else {
        alert('Failed to enable push notifications. Please check your browser settings.');
      }
    } catch (error: any) {
      console.error('Error enabling push notifications:', error);
      alert('Failed to enable push notifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  if (isEnabled) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-emerald-900">Push Notifications Enabled</p>
            <p className="text-sm text-emerald-700">You'll receive appointment reminders via push notifications</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 mb-2">Enable Push Notifications</h3>
          <p className="text-sm text-slate-600">
            Get instant appointment reminders sent directly to your phone. No SMS fees!
          </p>
        </div>
        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>
      <button
        onClick={handleEnable}
        disabled={isLoading || permission === 'denied'}
        className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Enabling...
          </>
        ) : permission === 'denied' ? (
          'Notifications Blocked - Please enable in browser settings'
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Enable Push Notifications
          </>
        )}
      </button>
    </div>
  );
};

