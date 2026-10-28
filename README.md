# WeatherTVApp

WeatherTVApp is a shared React Native app for Android TV and Apple TV. One TypeScript codebase renders a movie list, a details screen, and a video player. A remote drives every screen: directional focus, Select, and Back. Touch and mouse are not required.

The native runtime is [react-native-tvos](https://github.com/react-native-tvos/react-native-tvos) `0.83.0-0`, installed under the `react-native` package name. UI code in `src/` is shared. Platform-specific code is limited to the Android and tvOS projects, plus one Android TV launch script.

## Screen recordings

Each recording shows launch, the movie list, remote navigation and focus, movie details, playback, play and pause, rewind, fast-forward, and Back.

- [Android TV](https://drive.google.com/file/d/176Gi8yDfRrVw7kzh5bbjWMGZTnDBt5Wj/view?usp=sharing)
- [Apple TV](https://drive.google.com/file/d/1K2oCQucKoqnKKZEj3-t0jv8beq70zTOE/view?usp=sharing)

## Requirements

Install these before the first build.

| Tool | Used for |
| --- | --- |
| Node.js 20 or newer | Metro, the React Native CLI, and tests |
| npm | Package install. `npm install` also applies `patch-package` |
| JDK 17 | Android Gradle builds |
| Android Studio, Android SDK 36, and platform tools | Android TV emulator and `adb` |
| Xcode with the tvOS simulator runtime | Apple TV |
| CocoaPods 1.13 or newer, excluding 1.15.0 and 1.15.1 | tvOS native dependencies |
| Ruby 2.6.10 or newer | The repo `Gemfile`, if you install CocoaPods with Bundler |

Set `ANDROID_HOME` to the Android SDK. On macOS the usual path is `$HOME/Library/Android/sdk`. The Android TV script also checks that path when `ANDROID_HOME` is unset.

Confirm the toolchain:

```sh
node -v
npm -v
echo "$ANDROID_HOME"
xcodebuild -version
pod --version
```

## Environment setup

### Android TV

1. In Android Studio, install the Android 36 SDK and a Google TV system image.
2. Create an Android TV virtual device and name it exactly `Television_1080p_API_36`. `npm run androidtv` looks up that name, boots it when it is shut down, waits until `sys.boot_completed` is `1`, then installs the app on that emulator's `adb` serial.
3. Do not rely on `npm run android` for TV. That command uses the React Native CLI device picker and can launch a phone emulator when one is registered first.

The app declares leanback support and does not require a touchscreen (`android/app/src/main/AndroidManifest.xml`). `minSdk` is 24 and `compileSdk` / `targetSdk` are 36.

### Apple TV

1. Install Xcode and a tvOS simulator runtime. Boot, or leave available, a simulator whose name is `Apple TV`.
2. This repo's Xcode project is a tvOS app (`platform :tvos` in `ios/Podfile`). There is one scheme, `WeatherTVApp`. There is no separate `run-tvos` command.
3. Xcode 27 replaced `Simulator.app` with Device Hub. The CLI packages in this repo are pinned to `@react-native-community/cli` 20.2.0 so `run-ios` can open that simulator. Older 20.0.0 CLIs look for `Simulator.app` and fail.
4. The Podfile compiles the `fmt` pod as C++17. Apple Clang 21 rejects `consteval` in fmt 11 when that pod is built as C++20. Leave that `post_install` block in place.

## Install

From the repository root:

```sh
npm install
```

`postinstall` runs `patch-package`. The patch teaches React Native 0.83 codegen to accept `React.ComponentRef` as well as `React.ElementRef`, which `react-native-screens` 4.30 uses. Without it, `pod install` fails while generating native code.

Install tvOS pods. From the repository root:

```sh
bundle install
cd ios
bundle exec pod install
cd ..
```

`pod install` directly in `ios/` also works. React Native may print a deprecation notice. That notice is expected. Re-run pod install after changing native dependencies.

## Run

Start Metro in one terminal and leave it running:

```sh
npm start
```

In a second terminal, launch a TV target. Both launch commands build the native app and install it. Pass `--no-packager` when Metro is already running so the CLI does not start a second packager on port 8081.

### Android TV

```sh
npm run androidtv
```

The script is `scripts/android-tv.sh`. It refuses to start when `emulator` or `adb` cannot be found. The first boot of API 36 can take several minutes. Extra arguments are forwarded to `react-native run-android`:

```sh
npm run androidtv -- --no-packager
```

### Apple TV

```sh
npm run tvos
```

That runs `react-native run-ios --simulator "Apple TV"`. The CLI device list is iPhone and iPad only, so it may warn that it could not find a simulator named Apple TV. It then falls back through `simctl`, which does include the booted Apple TV. A warning followed by a launch on an Apple TV UDID is the successful path.

```sh
npm run tvos -- --no-packager
```

### Phone targets

`npm run android` and `npm run ios` still exist for a phone emulator or simulator. They are not the TV builds this project is meant to demonstrate.

### Reload

Fast Refresh applies most JavaScript edits. When a full reload is needed:

- Android TV: press `R` twice, or open the dev menu.
- Apple TV: press `R` in the simulator, or use the dev menu from the Xcode or Device Hub menu.

## Using the app

The remote behavior is the same on both platforms.

| Screen | Remote |
| --- | --- |
| Movies | Left and Right move between cards. Select opens details. |
| Movie details | Select on Play opens the player. Back returns to the movie list. |
| Player | Select or Play/Pause toggles playback. Left or Rewind jumps back 10 seconds. Right or Fast-forward jumps ahead 10 seconds. Back returns to details. |

The focused movie card grows slightly and shows a gold border. Play starts focused on the details screen. At the end of a video, Select starts it again from the beginning. If a poster or video cannot load, the screen shows a message instead of crashing, and Back still works.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Metro bundler |
| `npm run androidtv` | Boot `Television_1080p_API_36` if needed, then build and launch |
| `npm run tvos` | Build and launch on the Apple TV simulator |
| `npm test` | Jest |
| `npm run lint` | ESLint |

## Project layout

```text
src/
  App.tsx                 Focus provider and navigator
  assets/movies.json      Static catalog of eight movies
  components/             MovieCard and Text
  context/                In-memory focused movie id
  data/movies.ts          Typed catalog and findMovie
  hooks/usePlayerRemote.ts
  navigation/             Native stack: home, movie-details, player
  screens/                Home, Movie details, Player
  utils/                  Colors, spacing, scale, clock, seek helpers
scripts/android-tv.sh
patches/                  Codegen patch applied on npm install
```

Layout sizes are designed at 1920px wide and scaled with `scaledSize`, so type and spacing stay readable on a television.

## Architecture

### Navigation and state

`AppNavigator` is a native stack with the header hidden. Home stays mounted underneath details, which is what makes focus restoration possible. State is managed with the React Context API. `FocusProvider` in `src/context` holds the last focused movie id in memory for the session. Playback position stays local to the player and is not stored in that context.

Selecting a card saves that id and navigates to `movie-details`. Back from details returns to the list. After the home screen has been left once, it scrolls the saved card to the center and calls `requestTVFocus()`. The first launch focuses the first card with `hasTVPreferredFocus`.

Playback position is local to the player screen. Leaving the player pauses the video. Nothing is resumed on the next visit.

### Focus

TV focus is not the same as a mouse hover. Cards and the Play button are `Pressable`s. `src/utils/focusMovie.ts` prefers `requestTVFocus()` and falls back to `hasTVPreferredFocus` for hosts that only expose the older prop. The player traps focus on one full-screen target and listens with `useTVEventHandler`, so Left and Right seek instead of moving focus onto the video surface. The video is created with `controls={false}` and `disableFocus`. Android TV's stock controls are not reliably reachable from a D-pad.

A completed remote press arrives as a key-up. The player ignores key-down so a held button does not toggle or seek twice.

### Video

Playback uses `react-native-video` 6.19.3. That release supports the new architecture, tvOS, and Android ExoPlayer. Version 7 is not used: its TV support is unfinished and it pulls in another native module.

The catalog is `src/assets/movies.json`. Each movie has an id, title, description, year, genre, poster, optional backdrop, and an MP4 URL. `react-native-video` plays those files directly. Android's certificate store rejects the legacy Go Daddy Class 2 chain used by some archive.org hosts, while Apple TV still accepts it. The checked-in video URLs are progressive MP4s on hosts both platforms trust, including Google Cloud Storage. Posters and backdrops are HTTPS images. A failed image is replaced in the UI. A failed video shows an error and leaves Back working.

The player reports the current time, duration, and a progress bar. Seek steps are 10 seconds and are clamped to the file. `formatClock` prints `m:ss` under an hour and `h:mm:ss` after that.

### What differs by platform

| Concern | Android TV | Apple TV |
| --- | --- | --- |
| Launch | `npm run androidtv` | `npm run tvos` |
| UI code | Shared `src/` | Shared `src/` |
| Player engine | ExoPlayer | AVPlayer |
| Back | Hardware back, consumed once by the player | Menu key, mapped to the same exit path |
| Certificates | Rejects the old Go Daddy Class 2 root | Accepts that chain |
| Native project | `android/` | `ios/` built with `platform :tvos` |

## Tests

```sh
npm test
```

Jest covers the home list and focus restore, movie details including a missing movie and broken images, player transport, `formatClock`, the text component, and an app render. The React Native preset does not compile React Navigation by default, so `jest.config.js` allows those packages, `react-native-screens`, and `react-native-safe-area-context` through the transformer.

## Production tradeoffs

This is a television demo, not a streaming service.

- The catalog is a JSON file in the bundle. A production app would use an API, pagination, and artwork CDNs with cache headers.
- Focus and playback position live in memory. A production app would persist continue-watching and the last focused row across process death.
- Videos are public progressive MP4s. A production player would use adaptive HLS or DASH, tokens, and DRM. `react-native-video` 6 can do that, but this app does not.
- Custom controls were chosen so one remote map works on both TVs. Native player chrome would be less code and worse D-pad behavior on Android TV.
- There is no account, search, or offline download path.
- The Android TV launcher expects an emulator named `Television_1080p_API_36`. A different device name requires editing `scripts/android-tv.sh`.
- I would recommend Expo for a production version of this app. EAS Update ships JavaScript and asset fixes over the air, so a player or catalog change does not wait on a store review. EAS Build and Submit also remove most of the local Xcode and Gradle release work, config plugins replace hand-edited native projects, and release channels make it possible to roll a build back. This demo stays on the bare react-native-tvos CLI because both TV targets had to be built and run directly. Expo is still the better production default where the TV SDK supports it.

## Troubleshooting

**`unknown command run-tvos`.** Use `npm run tvos`. react-native-tvos does not add a `run-tvos` command. The tvOS app is launched with `run-ios` and an Apple TV simulator.

**Apple TV: `Simulator.app` cannot be opened.** Use the CLI versions pinned in `package.json` (20.2.0). Xcode 27 opens Device Hub instead of the old Simulator application.

**`pod install` fails on `React.ElementRef` or `fmt` `consteval`.** Run `npm install` so the codegen patch is applied, then pod install again. Do not remove the fmt C++17 setting in the Podfile.

**Android: no device, or a phone emulator starts.** Create the `Television_1080p_API_36` AVD and run `npm run androidtv`. Confirm `adb devices` shows `emulator-5554` or similar after boot.

**Android video fails while Apple TV plays the same file.** The Android log will show an `SSLHandshakeException` for an untrusted certificate. Point `videoUrl` at an MP4 whose certificate chain current Android trusts. Archive.org hosts that still send the Go Daddy Class 2 root fail on Android and succeed on Apple TV.

**Android images fail with `Chain validation failed`.** The emulator clock is behind real time, so Android rejects the image host's revocation check. Set it with `adb shell cmd alarm set-time` and a current Unix time in milliseconds, then open the movie again.

**Metro is already running.** Add `--no-packager` to the launch command, or stop the other process on port 8081.
