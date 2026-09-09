// Official UET shuttle schedule effective 14.09.2026. Independent of UET_DATA.
// Return departures come from column headings; unprinted stop times are omitted.
const SHUTTLE_DATA = [
  {
    "id": "main-ksk-0800",
    "direction": "Main Campus → New Campus (KSK)",
    "departure": "08:00 AM",
    "origin": "Main Campus",
    "destination": "New Campus",
    "stops": [
      {
        "name": "Main Campus",
        "time": "08:00 AM"
      },
      {
        "name": "Sultan Pura Metro Station",
        "time": "08:10 AM"
      },
      {
        "name": "Tezab Ehata"
      },
      {
        "name": "Do Moria Pull"
      },
      {
        "name": "Sheran Wala"
      },
      {
        "name": "Lari Ada gol chakr",
        "time": "08:15 AM"
      },
      {
        "name": "Timber Market"
      },
      {
        "name": "Bati Chowk",
        "time": "08:20 AM"
      },
      {
        "name": "Shahdara Chowk"
      },
      {
        "name": "Shahdara Station",
        "time": "08:25 AM"
      },
      {
        "name": "Machis Factory",
        "time": "08:30 AM"
      },
      {
        "name": "New Campus",
        "time": "08:50 AM"
      }
    ]
  },
  {
    "id": "main-ksk-0900",
    "direction": "Main Campus → New Campus (KSK)",
    "departure": "09:00 AM",
    "origin": "Main Campus",
    "destination": "New Campus",
    "stops": [
      {
        "name": "Main Campus",
        "time": "09:00 AM"
      },
      {
        "name": "Sultan Pura Metro Station",
        "time": "09:05 AM"
      },
      {
        "name": "Tezab Ehata"
      },
      {
        "name": "Do Moria Pull",
        "time": "09:10 AM"
      },
      {
        "name": "Sheran Wala"
      },
      {
        "name": "Lari Ada gol chakr",
        "time": "09:15 AM"
      },
      {
        "name": "Timber Market"
      },
      {
        "name": "Bati Chowk",
        "time": "09:20 AM"
      },
      {
        "name": "Shahdara Chowk"
      },
      {
        "name": "Shahdara Station",
        "time": "09:25 AM"
      },
      {
        "name": "Machis Factory",
        "time": "09:30 AM"
      },
      {
        "name": "New Campus",
        "time": "09:50 AM"
      }
    ]
  },
  {
    "id": "main-ksk-1000",
    "direction": "Main Campus → New Campus (KSK)",
    "departure": "10:00 AM",
    "origin": "Main Campus",
    "destination": "New Campus",
    "stops": [
      {
        "name": "Main Campus",
        "time": "10:00 AM"
      },
      {
        "name": "Sultan Pura Metro Station",
        "time": "10:05 AM"
      },
      {
        "name": "Tezab Ehata"
      },
      {
        "name": "Do Moria Pull",
        "time": "10:10 AM"
      },
      {
        "name": "Sheran Wala"
      },
      {
        "name": "Lari Ada gol chakr",
        "time": "10:15 AM"
      },
      {
        "name": "Timber Market"
      },
      {
        "name": "Bati Chowk",
        "time": "10:20 AM"
      },
      {
        "name": "Shahdara Chowk"
      },
      {
        "name": "Shahdara Station",
        "time": "10:25 AM"
      },
      {
        "name": "Machis Factory",
        "time": "10:30 AM"
      },
      {
        "name": "New Campus",
        "time": "10:50 AM"
      }
    ]
  },
  {
    "id": "main-ksk-1100",
    "direction": "Main Campus → New Campus (KSK)",
    "departure": "11:00 AM",
    "origin": "Main Campus",
    "destination": "New Campus",
    "stops": [
      {
        "name": "Main Campus",
        "time": "11:00 AM"
      },
      {
        "name": "Sultan Pura Metro Station",
        "time": "11:05 AM"
      },
      {
        "name": "Tezab Ehata"
      },
      {
        "name": "Do Moria Pull",
        "time": "11:10 AM"
      },
      {
        "name": "Sheran Wala"
      },
      {
        "name": "Lari Ada gol chakr",
        "time": "11:15 AM"
      },
      {
        "name": "Timber Market"
      },
      {
        "name": "Bati Chowk",
        "time": "11:20 AM"
      },
      {
        "name": "Shahdara Chowk"
      },
      {
        "name": "Shahdara Station",
        "time": "11:25 AM"
      },
      {
        "name": "Machis Factory",
        "time": "11:30 AM"
      },
      {
        "name": "New Campus",
        "time": "11:50 AM"
      }
    ]
  },
  {
    "id": "ksk-main-1100",
    "direction": "New Campus (KSK) → Main Campus",
    "departure": "11:00 AM",
    "origin": "New Campus",
    "destination": "Main Campus",
    "stops": [
      {
        "name": "New Campus"
      },
      {
        "name": "Rana Town"
      },
      {
        "name": "Rachna Town"
      },
      {
        "name": "Ferozewala"
      },
      {
        "name": "Shahdara Station"
      },
      {
        "name": "Shahadar Chowk"
      },
      {
        "name": "Batti Chowk"
      },
      {
        "name": "Timber Market"
      },
      {
        "name": "Lari Adda"
      },
      {
        "name": "DO Moria Pull"
      },
      {
        "name": "Sultan Pura Metro"
      },
      {
        "name": "Main Campus"
      }
    ]
  },
  {
    "id": "ksk-main-1200",
    "direction": "New Campus (KSK) → Main Campus",
    "departure": "12:00 PM",
    "origin": "New Campus",
    "destination": "Main Campus",
    "stops": [
      {
        "name": "New Campus"
      },
      {
        "name": "Rana Town"
      },
      {
        "name": "Rachna Town"
      },
      {
        "name": "Ferozewala"
      },
      {
        "name": "Shahdara Station"
      },
      {
        "name": "Shahadar Chowk"
      },
      {
        "name": "Batti Chowk"
      },
      {
        "name": "Timber Market"
      },
      {
        "name": "Lari Adda"
      },
      {
        "name": "DO Moria Pull"
      },
      {
        "name": "Sultan Pura Metro"
      },
      {
        "name": "Main Campus"
      }
    ]
  },
  {
    "id": "ksk-main-1300",
    "direction": "New Campus (KSK) → Main Campus",
    "departure": "01:00 PM",
    "origin": "New Campus",
    "destination": "Main Campus",
    "stops": [
      {
        "name": "New Campus"
      },
      {
        "name": "Rana Town"
      },
      {
        "name": "Rachna Town"
      },
      {
        "name": "Ferozewala"
      },
      {
        "name": "Shahdara Station"
      },
      {
        "name": "Shahadar Chowk"
      },
      {
        "name": "Batti Chowk"
      },
      {
        "name": "Timber Market"
      },
      {
        "name": "Lari Adda"
      },
      {
        "name": "DO Moria Pull"
      },
      {
        "name": "Sultan Pura Metro Station"
      },
      {
        "name": "Main Campus"
      }
    ]
  },
  {
    "id": "ksk-main-1400",
    "direction": "New Campus (KSK) → Main Campus",
    "departure": "02:00 PM",
    "origin": "New Campus",
    "destination": "Main Campus",
    "stops": [
      {
        "name": "New Campus"
      },
      {
        "name": "Rana Town"
      },
      {
        "name": "Rachna Town"
      },
      {
        "name": "Ferozewala"
      },
      {
        "name": "Shahdara Station"
      },
      {
        "name": "Shahadar Chowk"
      },
      {
        "name": "Batti Chowk"
      },
      {
        "name": "Timber Market"
      },
      {
        "name": "Lari Adda"
      },
      {
        "name": "DO Moria Pull"
      },
      {
        "name": "Sultan Pura Metro Station"
      },
      {
        "name": "Main Campus"
      }
    ]
  }
];

function shuttleEndpoints(trip) {
  return `<dl class="shuttle-endpoints"><div><dt>Origin</dt><dd>${trip.origin}</dd></div><div><dt>Destination</dt><dd>${trip.destination}</dd></div></dl>`;
}

function renderShuttlePage(tripId = null) {
  const container = document.getElementById('shuttle-content');
  const trip = SHUTTLE_DATA.find(item => item.id === tripId);
  if (trip) {
    container.innerHTML = `<button type="button" class="btn-secondary shuttle-back" onclick="backToShuttle('${trip.id}')">← Back to Shuttle Service</button>
      <article class="shuttle-detail">
        <p class="shuttle-eyebrow">KSK Campus Shuttle Service</p>
        <h1 tabindex="-1" id="shuttle-trip-heading">${trip.direction}</h1>
        <p class="shuttle-departure">Departure: <span class="shuttle-time">${trip.departure}</span></p>
        ${shuttleEndpoints(trip)}
        <h2>Complete stop sequence</h2>
        <p class="shuttle-note">Times are shown only where provided in the official schedule.</p>
        <ol class="shuttle-timeline">${trip.stops.map(stop => `<li><span class="shuttle-marker" aria-hidden="true"></span><div class="shuttle-stop"><span>${stop.name}</span>${stop.time ? `<span class="shuttle-time">${stop.time}</span>` : ''}</div></li>`).join('')}</ol>
      </article>`;
    document.getElementById('shuttle-trip-heading').focus({preventScroll:true});
    window.scrollTo({top:0, behavior:'instant'});
    return;
  }
  container.innerHTML = `<header class="shuttle-heading"><h1>🚌 KSK Campus Shuttle Service</h1>
    <p>Hourly shuttle service between UET Main Campus and New Campus (KSK)</p></header>
    <div class="shuttle-summary"><strong>Main Campus ↔ KSK Campus</strong><span>8 scheduled shuttle trips</span></div>
    <p class="shuttle-note">Official UET shuttle schedule · Effective 14.09.2026</p>
    ${[SHUTTLE_DATA.slice(0,4),SHUTTLE_DATA.slice(4)].map((trips,index) => `<section class="shuttle-direction" aria-labelledby="shuttle-direction-${index}"><h2 id="shuttle-direction-${index}">${trips[0].direction}</h2><div class="shuttle-grid">${trips.map(item => `<article class="shuttle-card"><h3>${item.direction}</h3><p class="shuttle-departure">Departure <span class="shuttle-time">${item.departure}</span></p>${shuttleEndpoints(item)}<button type="button" class="shuttle-view" data-shuttle-id="${item.id}" onclick="renderShuttlePage('${item.id}')" aria-label="View full route: ${item.direction}, ${item.departure}">View Full Route <span aria-hidden="true">→</span></button></article>`).join('')}</div></section>`).join('')}`;
}

function backToShuttle(tripId) {
  renderShuttlePage();
  document.querySelector(`[data-shuttle-id="${tripId}"]`).focus();
}
