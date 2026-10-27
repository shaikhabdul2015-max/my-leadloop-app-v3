import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Lead } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('MY_SUPABASE_URL') &&
  supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected' | 'disabled';

export interface RealtimeSubscriptionHandlers {
  onInsert?: (lead: Lead) => void;
  onUpdate?: (lead: Lead) => void;
  onDelete?: (deletedId: string) => void;
  onStatusChange?: (status: RealtimeStatus) => void;
}

/**
 * Subscribes to real-time changes on the 'leads' table with automatic cleanup and status tracking.
 * Ensures single active channel, clean unsubscription, and true 'connected' state verification.
 */
export function subscribeToLeadRealtime(handlers: RealtimeSubscriptionHandlers): () => void {
  if (!supabase || !isSupabaseConfigured) {
    if (handlers.onStatusChange) handlers.onStatusChange('disabled');
    return () => {};
  }

  if (handlers.onStatusChange) handlers.onStatusChange('connecting');

  let channel: RealtimeChannel | null = supabase
    .channel('leadloop-realtime-leads')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'leads' },
      (payload) => {
        if (handlers.onInsert && payload.new) {
          handlers.onInsert(payload.new as Lead);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'leads' },
      (payload) => {
        if (handlers.onUpdate && payload.new) {
          handlers.onUpdate(payload.new as Lead);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'leads' },
      (payload) => {
        const oldRecord = payload.old as { id?: string } | null;
        if (handlers.onDelete && oldRecord?.id) {
          handlers.onDelete(oldRecord.id);
        }
      }
    )
    .subscribe((status) => {
      if (handlers.onStatusChange) {
        if (status === 'SUBSCRIBED') {
          handlers.onStatusChange('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          handlers.onStatusChange('disconnected');
        } else {
          handlers.onStatusChange('connecting');
        }
      }
    });

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
      channel = null;
      if (handlers.onStatusChange) handlers.onStatusChange('disconnected');
    }
  };
}
