# Notification design

## Channels

- In-app: required and delivered through stored notification plus WebSocket hint.
- Email: required; development may use console/Mailpit and production uses configured SMTP/provider.
- SMS: represented and configurable; a real provider is optional for the timebox, but a clear stub must record `skipped` rather than pretend success.
- Push: represented and configurable; same rule as SMS.

## No strategy hierarchy

Do not create an abstract notification channel class or subclass tree.
Use explicit functions:

```python
def send_email_delivery(*, delivery): ...
def send_sms_delivery(*, delivery): ...
def send_push_delivery(*, delivery): ...
def send_in_app_delivery(*, delivery): ...

def send_delivery(*, delivery):
    if delivery.channel == NotificationChannel.EMAIL:
        return send_email_delivery(delivery=delivery)
    if delivery.channel == NotificationChannel.SMS:
        return send_sms_delivery(delivery=delivery)
    ...
```

This small explicit dispatch is easier to review and change.

## Preferences

Preferences are per membership, event type, channel, and optional reminder offset.
The service evaluates preferences when creating deliveries.
A user can manage only their own preferences unless an admin-only system default is later added.

## Deduplication

Each delivery has a stable key, for example:

```text
deadline:<deadline-id>:recipient:<membership-id>:offset:<minutes>:channel:<channel>
```

A unique constraint prevents duplicate delivery rows.
Provider retries update the existing row.

## Templates and localization

Use stable event/template keys and explicit rendering functions.
Render in the recipient's preferred language.
Do not place raw legal document text in notifications.
Keep email/SMS/push content concise and link users back to the authorized application.
