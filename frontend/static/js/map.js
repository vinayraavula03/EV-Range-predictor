// Leaflet + Nominatim + OSRM Map Integration
// No API key required

let map;
let userLocation = null;
let userMarker = null;
let destMarker = null;
let routeLayer = null;

const DEFAULT_LOCATION = { lat: 15.5057, lng: 80.0499 }; // Ongole India

function showStatus(msg) {
    const el = document.getElementById("status-message");
    if (el) el.innerText = msg;
}

function initMap() {

    map = L.map("map").setView([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);

    detectLocation();
    setupSearch();
}

function detectLocation() {

    if (!navigator.geolocation) {
        setUserLocation(DEFAULT_LOCATION);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            setUserLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            });
        },
        () => {
            setUserLocation(DEFAULT_LOCATION);
        }
    );
}

function setUserLocation(loc) {

    userLocation = loc;

    if (userMarker) map.removeLayer(userMarker);

    userMarker = L.marker([loc.lat, loc.lng])
        .addTo(map)
        .bindPopup("Your Location")
        .openPopup();

    map.setView([loc.lat, loc.lng], 14);
}

function setupSearch() {

    const input = document.getElementById("search-input");

    input.addEventListener("keydown", function (e) {

        if (e.key === "Enter") {
            searchLocation(input.value);
        }
    });
}

async function searchLocation(query) {

    if (!query) return;

    showStatus("Searching location...");

    const url =
        "https://nominatim.openstreetmap.org/search?format=json&q=" +
        encodeURIComponent(query);

    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.length === 0) {
        showStatus("Location not found");
        return;
    }

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);

    setDestination({ lat, lng, name: data[0].display_name });
}

function setDestination(dest) {

    if (destMarker) map.removeLayer(destMarker);

    destMarker = L.marker([dest.lat, dest.lng])
        .addTo(map)
        .bindPopup(dest.name)
        .openPopup();

    map.panTo([dest.lat, dest.lng]);

    calculateRoute(dest.lat, dest.lng);
}

async function calculateRoute(destLat, destLng) {

    if (!userLocation) {
        showStatus("User location not detected");
        return;
    }

    showStatus("Calculating route...");

    const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${userLocation.lng},${userLocation.lat};` +
        `${destLng},${destLat}` +
        `?overview=full&geometries=geojson`;

    try {

        const res = await fetch(url);
        const data = await res.json();

        if (!data.routes || data.routes.length === 0) {
            showStatus("Route not found");
            return;
        }

        const route = data.routes[0];

        const distanceKm = (route.distance / 1000).toFixed(1);
        const durationMin = Math.round(route.duration / 60);

        document.getElementById("routeDistance").innerText = distanceKm + " km";

        showStatus("Route found");

        drawRoute(route.geometry.coordinates);

    } catch (err) {

        console.error(err);
        showStatus("Route calculation failed");
    }
}

function drawRoute(coords) {

    if (routeLayer) map.removeLayer(routeLayer);

    const latlngs = coords.map(c => [c[1], c[0]]);

    routeLayer = L.polyline(latlngs, {
        color: "#007bff",
        weight: 6
    }).addTo(map);

    map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });
}

document.addEventListener("DOMContentLoaded", initMap);