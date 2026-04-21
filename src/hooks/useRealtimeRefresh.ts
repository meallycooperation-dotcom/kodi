import { useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

type RealtimeTableSpec = {
  table: string;
  schema?: string;
  filter?: string;
  events?: Array<'INSERT' | 'UPDATE' | 'DELETE'>;
};

type UseRealtimeRefreshOptions = {
  enabled: boolean;
  channelName: string;
  tables: RealtimeTableSpec[];
  onChange: () => void | Promise<void>;
  debounceMs?: number;
};

export const useRealtimeRefresh = ({
  enabled,
  channelName,
  tables,
  onChange,
  debounceMs = 150
}: UseRealtimeRefreshOptions) => {
  const tablesSignature = JSON.stringify(tables);

  useEffect(() => {
    if (!enabled || tables.length === 0) {
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const triggerRefresh = () => {
      if (!active) {
        return;
      }

      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        if (active) {
          void onChange();
        }
      }, debounceMs);
    };

    const channel = supabase.channel(channelName);

    tables.forEach(({ table, schema = 'public', filter, events = ['INSERT', 'UPDATE', 'DELETE'] }) => {
      events.forEach((event) => {
        channel.on(
          'postgres_changes',
          filter
            ? { event, schema, table, filter }
            : { event, schema, table },
          triggerRefresh
        );
      });
    });

    channel.subscribe();

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
      void supabase.removeChannel(channel);
    };
  }, [enabled, channelName, tablesSignature, onChange, debounceMs]);
};
