// Route Navigation & Nearest Power Station Slide Bar Controller
(function () {
    console.log("⚡ Route Navigation & Power Station Slide Bar script loaded");

    let totalRouteKm = 100;
    let initialStationDistanceKm = 12.4;
    let nearestStationData = null;

    function haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async function fetchNearestPowerStation(userLoc) {
        if (!userLoc || !userLoc.lat || !userLoc.lng) {
            userLoc = { lat: 15.5057, lng: 80.0499 };
        }

        const fallbackDist = Math.max(3.2, Math.min(25, (totalRouteKm * 0.08) || 12.4));
        let bestStation = {
            name: "Highway Fast EV Hub",
            distanceKm: parseFloat(fallbackDist.toFixed(1)),
            lat: userLoc.lat + 0.04,
            lng: userLoc.lng + 0.04
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const response = await fetch(`/stations?lat=${userLoc.lat}&lon=${userLoc.lng}&radius=35000`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                if (data.stations && data.stations.length > 0) {
                    let minDist = Infinity;
                    let closest = null;
                    data.stations.forEach(st => {
                        if (st.lat && st.lng) {
                            const d = haversineDistance(userLoc.lat, userLoc.lng, st.lat, st.lng);
                            if (d < minDist) {
                                minDist = d;
                                closest = st;
                            }
                        }
                    });

                    if (closest && minDist < Infinity) {
                        bestStation = {
                            name: closest.name || closest.operator || "EV Supercharge Hub",
                            distanceKm: parseFloat(minDist.toFixed(1)),
                            lat: closest.lat,
                            lng: closest.lng
                        };
                    }
                }
            }
        } catch (e) {
            console.warn("⚠️ Using fallback nearest power station:", e.message);
        }

        nearestStationData = bestStation;
        initialStationDistanceKm = bestStation.distanceKm;
        updateStationDisplay(bestStation);
    }

    function updateStationDisplay(station) {
        const distEl = document.getElementById("nearestStationDistance");
        const nameEl = document.getElementById("nearestStationName");
        const slidebarStationDistEl = document.getElementById("slidebarStationDistance");
        const stationPinEl = document.getElementById("slidebarStationPin");

        if (distEl) distEl.textContent = station.distanceKm.toFixed(1) + " km";
        if (nameEl) nameEl.textContent = station.name;
        if (slidebarStationDistEl) slidebarStationDistEl.textContent = station.distanceKm.toFixed(1) + " km";

        if (stationPinEl) {
            // Position station marker along the track (between 10% and 85%)
            let ratio = (station.distanceKm / totalRouteKm) * 100;
            ratio = Math.max(12, Math.min(85, ratio));
            stationPinEl.style.left = ratio + "%";
            stationPinEl.title = `⚡ ${station.name} (${station.distanceKm.toFixed(1)} km) - Click to navigate`;
            
            stationPinEl.onclick = function() {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;
                window.open(url, "_blank");
            };
        }
    }

    function updateSlideBarProgress(currentKm) {
        const total = totalRouteKm || 100;
        const current = Math.max(0, currentKm);
        const percent = Math.min(100, (current / total) * 100);

        const currentDistEl = document.getElementById("slidebarCurrentDistance");
        const fillEl = document.getElementById("routeSlideBarFill");
        const carPinEl = document.getElementById("slidebarCarPin");
        const distEl = document.getElementById("nearestStationDistance");
        const badgeEl = document.getElementById("nearestStationBadge");

        if (currentDistEl) currentDistEl.textContent = current.toFixed(1) + " km";
        if (fillEl) fillEl.style.width = percent + "%";
        if (carPinEl) carPinEl.style.left = percent + "%";

        // Update remaining distance to nearest station
        const remainingToStation = Math.max(0, initialStationDistanceKm - current);
        if (distEl) {
            if (remainingToStation <= 0.1) {
                distEl.textContent = "Reached";
                distEl.style.color = "#22c55e";
                if (badgeEl) badgeEl.textContent = "CHARGING ZONE";
            } else {
                distEl.textContent = remainingToStation.toFixed(1) + " km";
                distEl.style.color = "#00e5ff";
                if (badgeEl) badgeEl.textContent = "AWAY";
            }
        }
    }

    function initSlideBar() {
        const predEl = document.getElementById("prediction-data");
        let dest = "";
        let speed = 60;

        if (predEl && predEl.dataset.prediction) {
            try {
                const data = JSON.parse(predEl.dataset.prediction);
                dest = data.destination || "";
                speed = data.speed || 60;
            } catch (e) {
                console.error("Error reading prediction:", e);
            }
        }

        const destEl = document.getElementById("navDestinationDisplay");
        if (destEl && dest) {
            destEl.textContent = dest;
        }

        // Check if routeDistance element gets updated
        function syncRouteDistance() {
            const rEl = document.getElementById("routeDistance");
            if (rEl && rEl.innerText && !rEl.innerText.includes("--") && !rEl.innerText.includes("Loading")) {
                const parsed = parseFloat(rEl.innerText);
                if (!isNaN(parsed) && parsed > 0) {
                    totalRouteKm = parsed;
                    const totalEl = document.getElementById("slidebarTotalDistance");
                    if (totalEl) totalEl.textContent = totalRouteKm.toFixed(1) + " km";

                    // Update ETA
                    const etaMin = Math.round((totalRouteKm / (speed || 60)) * 60);
                    const etaHours = Math.floor(etaMin / 60);
                    const remMin = etaMin % 60;
                    const etaText = etaHours > 0 ? `${etaHours}h ${remMin}m` : `${remMin} min`;
                    const etaEl = document.getElementById("navEtaDisplay");
                    if (etaEl) etaEl.textContent = `ETA: ~${etaText} (${totalRouteKm.toFixed(1)} km)`;

                    if (nearestStationData) {
                        updateStationDisplay(nearestStationData);
                    }
                }
            }
        }

        // Poll for routeDistance update from route-calculator-fixed.js
        const checkInterval = setInterval(syncRouteDistance, 1000);
        setTimeout(() => clearInterval(checkInterval), 30000);

        // Fetch nearest power station once location is ready or fallback
        if (window.userLocation) {
            fetchNearestPowerStation(window.userLocation);
        } else {
            window.addEventListener("userLocationReady", function () {
                fetchNearestPowerStation(window.userLocation);
            });
            setTimeout(() => {
                if (!nearestStationData) {
                    fetchNearestPowerStation({ lat: 15.5057, lng: 80.0499 });
                }
            }, 3000);
        }

        // Setup Interactive Slider
        const sliderInput = document.getElementById("routeNavSliderInput");
        if (sliderInput) {
            sliderInput.addEventListener("input", function (e) {
                const val = parseFloat(e.target.value);
                const simKm = (val / 100) * totalRouteKm;
                updateSlideBarProgress(simKm);
            });
        }

        // Hook into live simulation tripDistance updates
        const distTravelledEl = document.getElementById("distanceTravelled");
        if (distTravelledEl) {
            const observer = new MutationObserver(function () {
                const val = parseFloat(distTravelledEl.textContent);
                if (!isNaN(val)) {
                    updateSlideBarProgress(val);
                }
            });
            observer.observe(distTravelledEl, { childList: true, characterData: true, subtree: true });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSlideBar);
    } else {
        initSlideBar();
    }
})();
