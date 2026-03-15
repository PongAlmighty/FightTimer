# Firmware Spec: Add `timer-state` Periodic Broadcast

**Target repo:** Arena-Timer-Firmware-Standalone
**Constraint:** Additive only. No existing methods, endpoints, or event names may be changed.
**Backwards compatibility:** Old firmware connecting to new FightTimer server works fine (server just never receives `timer-state`). New firmware connecting to old FightTimer server works fine (server ignores unknown events).

---

## What to add

### 1. New method declaration — `WebSocketClient.h`

Add to the public section of `WebSocketClient`:

```cpp
void sendTimerState();
```

---

### 2. New method implementation — `WebSocketClient.cpp`

Add anywhere after the existing methods:

```cpp
void WebSocketClient::sendTimerState() {
    if (!_connected || !_timer) return;

    Timer::Components remaining = _timer->getRemainingTime();
    unsigned int timeRemaining = (remaining.minutes * 60) + remaining.seconds;

    JsonDocument doc;
    JsonArray arr = doc.to<JsonArray>();
    arr.add("timer-state");
    JsonObject payload = arr.add<JsonObject>();
    payload["timeRemaining"] = timeRemaining;
    payload["isRunning"]     = _timer->isRunning();
    payload["isPaused"]      = _timer->isPaused();
    payload["duration"]      = _timer->getDurationSeconds();

    String json;
    serializeJson(doc, json);

    // Socket.IO event format varies by namespace
    String message;
    if (_namespace == "/") {
        message = "42" + json;
    } else {
        message = "42" + _namespace + "," + json;
    }

    _client.sendTXT(message);
    DEBUG_PRINT("Timer state broadcast: ");
    DEBUG_PRINTLN(message);
}
```

---

### 3. Periodic broadcast + immediate-on-connect — `WebSocketClient.cpp`

#### In `poll()` — add after the existing `_client.loop()` call:

```cpp
// Periodic timer state broadcast to FightTimer server (every 10 seconds)
static unsigned long _lastStateBroadcast = 0;
if (_connected) {
    unsigned long now = millis();
    if (now - _lastStateBroadcast >= 10000) {
        _lastStateBroadcast = now;
        sendTimerState();
    }
}
```

#### In `handleWebSocketEvent()`, `WStype_CONNECTED` case — add one line after the existing "Ready" Serial.println:

```cpp
case WStype_CONNECTED:
    Serial.print("WebSocket: Connected to: ");
    Serial.println((char *)payload);
    _connected = true;
    _connectInProgress = false;
    _consecutiveFailures = 0;
    Serial.println("WebSocket: Ready to receive timer events");
    sendTimerState();   // <-- ADD THIS: send state immediately on connect
    break;
```

---

## What the server receives

Event name: `timer-state`
Payload:
```json
{
  "timeRemaining": 95,
  "isRunning": true,
  "isPaused": false,
  "duration": 180
}
```

Sent:
- Once immediately when the WebSocket connects or reconnects
- Every 10 seconds while connected

---

## Known bug to fix in the fork

**Hardware immediately shows 2:59 on start instead of 3:00.**

The web timer correctly shows 3:00 for the first full second (0 seconds elapsed = display full time). The hardware treats the current second as already consumed and immediately decrements, making the display 1 second behind the web throughout the entire countdown.

Fix: In `Timer::getRemainingTime()` (or wherever the display value is calculated), ensure the first second is not consumed until 1 full second has elapsed — same wall-clock approach the web timer uses.

This is the authoritative behavior: show the set duration on start, decrement only after a full second has elapsed.

---

## No other changes needed

- All existing REST endpoints unchanged
- All existing WebSocket event handlers unchanged
- All existing Socket.IO event names (`timer_update`, `timer_control`) unchanged
- EEPROM layout unchanged
- `timer-state` is a new event name with no collision risk
