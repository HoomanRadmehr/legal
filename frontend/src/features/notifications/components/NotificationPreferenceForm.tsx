import { useEffect, useState } from "react";

import { NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS } from "../options";
import type {
  NotificationChannel,
  NotificationPreference,
  NotificationPreferenceInput,
  PreferenceOption,
} from "../types";

type PreferenceState = Record<string, boolean>;

export function NotificationPreferenceForm({
  error,
  onSubmit,
  preferences,
  saving,
}: {
  error?: string;
  onSubmit: (preferences: NotificationPreferenceInput[]) => void;
  preferences: NotificationPreference[];
  saving: boolean;
}) {
  const [state, setState] = useState<PreferenceState>(() =>
    initialPreferenceState(preferences),
  );

  useEffect(() => {
    setState(initialPreferenceState(preferences));
  }, [preferences]);

  return (
    <form
      className="notification-preferences"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(preferenceInputs(state));
      }}
    >
      {error ? (
        <p className="notification-alert" role="alert">
          {error}
        </p>
      ) : null}
      {NOTIFICATION_EVENTS.map((eventOption) => (
        <PreferenceGroup
          eventOption={eventOption}
          key={eventOption.eventType}
          onToggle={(channel, enabled) =>
            setState((current) =>
              updatePreference(
                current,
                eventOption.eventType,
                channel,
                enabled,
              ),
            )
          }
          state={state}
        />
      ))}
      <button disabled={saving} type="submit">
        {saving ? "Saving" : "Save preferences"}
      </button>
    </form>
  );
}

function PreferenceGroup({
  eventOption,
  onToggle,
  state,
}: {
  eventOption: PreferenceOption;
  onToggle: (channel: NotificationChannel, enabled: boolean) => void;
  state: PreferenceState;
}) {
  return (
    <fieldset className="notification-preferences__group">
      <legend>{eventOption.label}</legend>
      {NOTIFICATION_CHANNELS.map((channelOption) => (
        <label
          className="notification-preferences__option"
          key={channelOption.channel}
        >
          <input
            checked={isEnabled(
              state,
              eventOption.eventType,
              channelOption.channel,
            )}
            disabled={channelOption.channel === "in_app"}
            onChange={(event) =>
              onToggle(channelOption.channel, event.target.checked)
            }
            type="checkbox"
          />
          <span>
            <strong>{channelOption.label}</strong>
            <small>{channelOption.status}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function initialPreferenceState(
  preferences: NotificationPreference[],
): PreferenceState {
  const state: PreferenceState = {};
  for (const eventOption of NOTIFICATION_EVENTS) {
    for (const channelOption of NOTIFICATION_CHANNELS) {
      state[preferenceKey(eventOption.eventType, channelOption.channel)] =
        initialEnabled(
          preferences,
          eventOption.eventType,
          channelOption.channel,
        );
    }
  }
  return state;
}

function initialEnabled(
  preferences: NotificationPreference[],
  eventType: string,
  channel: NotificationChannel,
): boolean {
  const preference = preferences.find(
    (item) =>
      item.event_type === eventType &&
      item.channel === channel &&
      item.reminder_offset_minutes === 0,
  );
  return preference?.enabled ?? channel === "in_app";
}

function preferenceInputs(
  state: PreferenceState,
): NotificationPreferenceInput[] {
  return NOTIFICATION_EVENTS.flatMap((eventOption) =>
    NOTIFICATION_CHANNELS.map((channelOption) => ({
      channel: channelOption.channel,
      enabled: isEnabled(state, eventOption.eventType, channelOption.channel),
      event_type: eventOption.eventType,
      reminder_offset_minutes: 0,
    })),
  );
}

function updatePreference(
  state: PreferenceState,
  eventType: string,
  channel: NotificationChannel,
  enabled: boolean,
): PreferenceState {
  return {
    ...state,
    [preferenceKey(eventType, channel)]: channel === "in_app" ? true : enabled,
  };
}

function isEnabled(
  state: PreferenceState,
  eventType: string,
  channel: NotificationChannel,
): boolean {
  return state[preferenceKey(eventType, channel)] ?? channel === "in_app";
}

function preferenceKey(
  eventType: string,
  channel: NotificationChannel,
): string {
  return `${eventType}:${channel}`;
}
