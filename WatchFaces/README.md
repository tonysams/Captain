# Classic Faces (watchOS)

A standalone watchOS app — no iPhone companion app required — that shows five
full-screen analog dial designs inspired by classic watch genres. Swipe left
or right on the watch to switch between them.

## Dials included

- **Mariner** — navy dial, brass hands, marine-chronometer styling (a nod to
  this repo's sailing theme).
- **Aviator** — black dial, bold white numerals, red seconds hand.
- **Classic** — minimalist cream dress-watch dial, thin gold hands, no
  running seconds.
- **Regatta** — racing chronograph colors, in the spirit of yacht-club
  regatta timers.
- **Field** — high-contrast khaki military field-watch dial.

## Important: this is not a system watch face

Apple does not provide a public API for third-party apps to install
themselves as a system watch face (the ones you pick by force-touching or
swiping the main clock screen). This project is a regular watchOS app: open
it from your app grid (or pin it as a Dock favorite / complication launcher)
and it fills the screen with a live, ticking analog dial. That's the
practical ceiling for a personal, non-jailbroken project.

## Build & run on your own watch

Requirements: a Mac with Xcode 15+ (Xcode 16 recommended), your Apple ID
added to Xcode as a personal team, and your Apple Watch paired to an iPhone
that's connected to the same Mac (or on the same Wi-Fi network for wireless
install).

1. Open `ClassicFaces.xcodeproj` in Xcode.
2. Select the **ClassicFaces Watch App** target, go to
   **Signing & Capabilities**, and set your personal team under
   **Team**. Xcode will generate a bundle identifier-specific provisioning
   profile automatically (you can also change
   `PRODUCT_BUNDLE_IDENTIFIER` in Build Settings if `com.tonysams.classicfaces`
   collides with something else in your account).
3. In the scheme/device picker at the top of the Xcode window, choose your
   physical Apple Watch (it should appear once your iPhone is connected and
   trusted; if it only shows simulators, open the **Watch** app on your
   iPhone once with the Mac connected so Xcode can see the paired watch).
4. Press **Run** (⌘R). Xcode builds, installs, and launches the app on your
   watch. The first install may prompt you on the watch/iPhone to trust the
   developer certificate: **Settings → General → VPN & Device Management**
   on the iPhone (or the equivalent on watchOS) → trust your Apple ID.
5. Free Apple ID accounts can only keep a handful of apps signed at once and
   the provisioning profile expires after about 7 days — just re-run from
   Xcode to refresh it. A paid Apple Developer Program membership removes
   that limit.

## Project layout

```
ClassicFaces.xcodeproj/          Xcode project (single watchOS target, watchOS 10+)
ClassicFaces Watch App/
  ClassicFacesApp.swift          App entry point
  ContentView.swift              Paging TabView across the five faces
  WatchFaceStyle.swift           Style struct + numeral formatting
  AnalogClockView.swift          Shared Canvas-based clock renderer + DateBadge
  MarinerFace.swift              Marine chronometer dial
  AviatorFace.swift              Pilot-watch dial
  DressClassicFace.swift         Minimalist dress-watch dial
  RegattaFace.swift              Regatta chronograph dial
  FieldFace.swift                Field-watch dial
  Assets.xcassets/               App icon (placeholder) + accent color
  Preview Content/                Xcode canvas preview assets
```

## Adding another dial

Each face is a small SwiftUI view that builds a `WatchFaceStyle` (colors,
numeral style, whether to show a seconds hand) and hands it to the shared
`AnalogClockView`, then layers on any extra text/branding. Copy one of the
existing face files, tweak the style, and add it to the `TabView` in
`ContentView.swift`.
