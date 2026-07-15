import { useState } from "react";

import { useI18n } from "../../../i18n";
import { NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS } from "../options";
import { notificationText } from "../text";
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
  return (
    <NotificationPreferenceStateForm
      key={preferenceStateKey(preferences)}
      error={error}
      initialState={initialPreferenceState(preferences)}
      onSubmit={onSubmit}
      saving={saving}
    />
  );
}

function NotificationPreferenceStateForm({
  error,
  initialState,
  onSubmit,
  saving,
}: {
  error?: string;
  initialState: PreferenceState;
  onSubmit: (preferences: NotificationPreferenceInput[]) => void;
  saving: boolean;
}) {
  const { locale } = useI18n();
  const labels = notificationText(locale);
  const [state, setState] = useState<PreferenceState>(() => initialState);

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
          locale={locale}
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
        {saving ? labels.saving : labels.save}
      </button>
    </form>
  );
}

function PreferenceGroup({
  eventOption,
  locale,
  onToggle,
  state,
}: {
  eventOption: PreferenceOption;
  locale: ReturnType<typeof useI18n>["locale"];
  onToggle: (channel: NotificationChannel, enabled: boolean) => void;
  state: PreferenceState;
}) {
  const labels = notificationText(locale);

  return (
    <fieldset className="notification-preferences__group">
      <legend>{eventOptionLabel(eventOption.eventType, labels)}</legend>
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
            <strong>{labels.channels[channelOption.channel].label}</strong>
            <small>{labels.channels[channelOption.channel].status}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function eventOptionLabel(
  eventType: string,
  labels: ReturnType<typeof notificationText>,
): string {
  if (eventType === "deadline.reminder.created") {
    return labels.events.deadline;
  }
  if (eventType === "document.upload.status_changed") {
    return labels.events.document;
  }
  if (eventType === "offboarding.status_changed") {
    return labels.events.offboarding;
  }
  return labels.events.notification;
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

function preferenceStateKey(preferences: NotificationPreference[]): string {
  return preferences
    .map((preference) =>
      [
        preference.event_type,
        preference.channel,
        preference.reminder_offset_minutes,
        preference.enabled ? "1" : "0",
      ].join(":"),
    )
    .join("|");
}
