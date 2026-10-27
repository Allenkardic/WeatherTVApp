#!/usr/bin/env bash
# Boot the Android TV AVD if needed, then install and launch the app on it.
set -euo pipefail

AVD="Television_1080p_API_36"
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
EMULATOR="$SDK/emulator/emulator"
ADB="$SDK/platform-tools/adb"

if [[ ! -x "$EMULATOR" || ! -x "$ADB" ]]; then
  echo "Android SDK emulator or adb was not found. Set ANDROID_HOME." >&2
  exit 1
fi

avd_serial() {
  local dev name
  while read -r dev _; do
    [[ "$dev" == emulator-* ]] || continue
    name="$("$ADB" -s "$dev" emu avd name 2>/dev/null | head -n 1 | tr -d '\r')"
    if [[ "$name" == "$AVD" ]]; then
      echo "$dev"
      return 0
    fi
  done < <("$ADB" devices | awk 'NR>1 && $2=="device" {print $1}')
  return 1
}

serial="$(avd_serial || true)"
if [[ -z "$serial" ]]; then
  echo "Starting $AVD..."
  "$EMULATOR" -avd "$AVD" -netdelay none -netspeed full >/dev/null 2>&1 &
  for _ in $(seq 1 90); do
    serial="$(avd_serial || true)"
    if [[ -n "$serial" ]]; then
      break
    fi
    sleep 2
  done
fi

if [[ -z "$serial" ]]; then
  echo "Timed out waiting for $AVD to appear in adb." >&2
  exit 1
fi

echo "Waiting for $AVD ($serial) to finish booting..."
"$ADB" -s "$serial" wait-for-device
for _ in $(seq 1 60); do
  boot="$("$ADB" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
  if [[ "$boot" == "1" ]]; then
    break
  fi
  sleep 2
done

exec npx react-native run-android --device "$serial" "$@"
