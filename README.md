# UET Bus Route Info

**Phase 1 / v1.0 — Route Information Platform**

**Status: Completed / Production Ready**

A community-focused route information platform for UET Lahore students, covering KSK / New Campus and Main Campus transport routes.

**Route information is based on official UET transport schedules.** This independently developed website is a community project; it is not presented as an officially authorized UET application.

[Visit the website](https://rusabch07.github.io/UET/)

## Phase 1 features

- KSK / New Campus and Main Campus route information and campus selection.
- Local UET stop autocomplete with route-specific suggestions, including stops appearing on multiple routes.
- Device-location detection and a **1.5 km nearby-stop search** with multiple pickup options from the same or different routes.
- Route Schedules search and a dedicated **Full Route** view with return navigation.
- Stop timings and driver, contact, and bus information where available; unavailable details display as N/A.
- **Directions to Stop** chooser with Google Maps walking directions, Apple Maps on iPhone/iPad, and an Open Stop Location fallback.
- **Saved Routes**, stored on the current browser/device.
- Responsive mobile, tablet, and desktop layouts, a mobile drawer, and dark/light themes.
- iPhone and Android geolocation handling, distinct failure messages, and manual stop search as a fallback.
- Interactive pickup maps, notices, FAQs, and printable route schedules.

### How nearby search works

Press **Detect My Area** to request location. The selected campus's valid stops are checked using straight-line distance. Every stop within **1.5 km**, including the boundary, is retained and sorted nearest first. Multiple stops on one route remain separate options. If none qualify, the page shows that no nearby UET bus stop was found within 1.5 km.

Distances are estimates, not walking distances or live bus positions. Manual autocomplete selects the chosen stop and route directly; it does not require GPS.

## Technology

| Area | Technologies used |
| --- | --- |
| Website | HTML, CSS, vanilla JavaScript |
| Location | Standard browser `navigator.geolocation.getCurrentPosition()` |
| Maps | Leaflet with OpenStreetMap tiles; Google Maps directions links |
| Presentation | Lucide icons; Inter and Outfit through Google Fonts |
| Local preferences | Browser `localStorage` for Saved Routes and theme |
| Hosting | GitHub Pages and GitHub Actions |
| Build and checks | Node.js built-in modules/test runner; Playwright browser tests |

The deployed website is static. It requires no application server, database, Google Places loader, or API key. Third-party fonts, icons, map scripts, and tiles require network access.

## Data source and integrity

Route and schedule information is derived from official UET transport route information. The release contains **35 route records and 365 stop records**. These are dataset records, not counts of individual buses or unique physical stops; route variants and shared stops can appear separately.

The dataset lives in [`js/data.js`](js/data.js). Stop names, timings, driver/contact/bus details, and coordinates must not be changed as part of layout or code cleanup.

GPS stop coordinates support maps, directions, and nearby searches and may be maintained and verified separately from the schedules. Current stop coordinates are marked `unverified`; numeric validation does not establish physical accuracy. Shared coordinates can be legitimate and must not be automatically merged or corrected.

- [Coordinate audit](docs/stop-coordinate-audit.md)
- [Stop spelling and search-alias notes](docs/stop-spelling-review.md)
- [Maintainer notes](docs/maintenance.md)

## Privacy and location permissions

Phase 1 **does not continuously track students or buses**. Device location is requested only when a user activates location-based functionality, such as Detect My Area or an explicit GPS retry button. There is no background location watcher, account system, or application backend collecting location history.

The initial request allows a recent cached position, uses a 12-second timeout, and does not require high accuracy. One automatic retry is allowed for location-unavailable or timeout errors; permission denial is not automatically retried. The button and loading state recover after failure, and manual stop search remains available.

On iPhone, denied permission may require enabling Safari location access and **Settings → Privacy & Security → Location Services**, then reloading the page. Production geolocation requires HTTPS; use localhost for local development.

Saved Routes and theme preferences remain in the browser's local storage and do not sync between devices. Map and CDN providers receive normal network requests. Choosing a map option sends the stop destination coordinates to Google Maps or Apple Maps; website location permission is not required.

## Project structure

```text
UET/
├── index.html                  # Page structure and initial theme setup
├── css/
│   └── styles.css              # Shared styles and responsive rules
├── js/
│   ├── data.js                 # Route, stop, campus, and transport data
│   └── app.js                  # Search, location, rendering, and navigation
├── assets/
│   └── uet-logo.png
├── docs/
│   ├── maintenance.md
│   ├── stop-coordinate-audit.md
│   └── stop-spelling-review.md
├── scripts/
│   ├── build-pages.cjs         # Static build and asset versioning
│   └── audit-stop-coordinates.cjs
├── tests/                     # Automated tests and browser diagnostics
├── .github/workflows/         # GitHub Pages deployment workflow
└── _site/                     # Generated Pages artifact; ignored by Git
```

`test-results/` contains generated screenshots and is also ignored. Documentation, tests, and Node.js tooling are not required by the deployed page.

## Run locally

Use Node.js 24, matching the deployment workflow:

```sh
node scripts/build-pages.cjs
```

Serve `_site` with a static HTTP server and open its localhost URL. For example, if Python is installed:

```sh
python -m http.server 8080 --directory _site
```

Open `http://localhost:8080/`. Avoid `file://` when checking browser permissions, asset requests, and navigation. Rebuild after changing source files.

## Deploy to GitHub Pages

1. In the repository's **Settings → Pages**, select **GitHub Actions** as the source.
2. Push the release changes to `main`, or run the **Deploy GitHub Pages** workflow manually for `main`.
3. The workflow runs automated tests and the coordinate audit, builds `_site`, and uploads that freshly generated artifact.
4. Check the completed deployment and reload the published site.

The build copies current source assets and adds a SHA-256 content version to each local CSS/JS reference in generated HTML, such as `js/app.js?v=<content-hash>`. Versions change automatically when asset bytes change. Source HTML keeps plain relative paths; generated URLs remain compatible with `/UET/` project hosting. An existing root `CNAME` is preserved.

Do not upload an older `_site` copy or manually edit generated assets. A previously cached HTML document can still reference an earlier version until it is refreshed; content versioning ensures newly loaded release HTML requests the corresponding CSS/JS.

## Validation

Run the automated suite and the read-only coordinate audit:

```sh
node --test tests/*.test.cjs
node scripts/audit-stop-coordinates.cjs
```

Browser checks require Playwright and Chrome. For a local development install:

```sh
npm install --no-save --package-lock=false playwright
node scripts/build-pages.cjs
node tests/phase1-browser.cjs
node tests/places-browser.cjs
node tests/responsive-accessibility.cjs
node tests/header-browser.cjs
```

Set `CHROMIUM_PATH` to your Chrome executable if the default Windows location does not apply. Set `TEST_EXTERNAL_ASSETS=1` for responsive tests with real fonts and icons. The release smoke test serves the built artifact under `/UET/` and checks versioned asset loading, manual search after denied GPS, campuses, duplicate stops, directions, Saved Routes, GPS, and console/network failures.

Responsive checks cover 360×800, 390×844, 412×915, 768×1024, 820×1180, 1024×768, and 1366×768 in both themes. iPhone flows are simulated in Chromium, and Android uses Chrome emulation; these checks do not replace physical-device Safari/Android testing.

To refresh only the coordinate report after an authorized data update:

```sh
node scripts/audit-stop-coordinates.cjs --write
```

Do not update dataset regression baselines merely to make a failing test pass.

## v1.0 release notes

- Local UET stop search and route-specific autocomplete selection.
- GPS nearby-stop detection within 1.5 km, preserving multiple pickup options.
- Route Schedules, Full Route views, and return navigation.
- Saved Routes, coordinate-based directions, and available transport details.
- Mobile/tablet/desktop responsiveness and dark/light themes.
- iOS/Android geolocation compatibility improvements and manual fallback.
- Content-versioned production assets and release regression coverage.

## Future roadmap — planned 2027 work

The following are future plans, **not current Phase 1 functionality**:

- Secure UET student accounts.
- Route senior and driver accounts.
- Live bus tracking and real-time ETA.
- Notifications.
- Transport administration tools.

No authentication, OTP, Firebase, Supabase, live tracking backend, or admin panel is included in this release.
