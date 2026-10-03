console.log("✅ NEW GAUGE JS LOADED - FIXED VERSION");

// 🔥 CAR CONFIG - Speed limit based on selected car
// Ensure carData available
window.carData = window.carData || {topSpeed: 160, maxRPM: 8000, accel: 50};

const CAR = {
    maxSpeed: window.carData.topSpeed || 160
};

const state = {
    speed: 0,
    rpm: 0,
    battery: 80,
    tripDistance: 0,
    odometerDistance: 0,
    maxSpeed: CAR.maxSpeed,
    maxRPM: window.carData.maxRPM || 8000,
    isAccelerating: false,
    isBraking: false,
    isCruiseActive: false,
    cruiseSpeed: 0,
    prevTime: performance.now(),
    loopRunning: false
};

function drawSpeedometer(ctx, speed) {
    const cx = 150;
    const cy = 150;
    const r = 120;

    ctx.clearRect(0, 0, 300, 300);

    // === BACKGROUND GLOW ARC ===
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 10;
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#00ff88";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // === INNER DARK CIRCLE (GLASS EFFECT) ===
    ctx.beginPath();
    ctx.arc(cx, cy, r - 30, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();

    // === TICKS + NUMBERS ===
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Orbitron";
    ctx.textAlign = "center";

    // ✅ DYNAMIC SCALE BASED ON CAR MAX SPEED
    for (let i = 0; i <= CAR.maxSpeed; i += 20) {
        let angle = (i / CAR.maxSpeed) * 1.5 * Math.PI + 0.75 * Math.PI;

        let x1 = cx + Math.cos(angle) * (r - 10);
        let y1 = cy + Math.sin(angle) * (r - 10);

        let x2 = cx + Math.cos(angle) * (r - 25);
        let y2 = cy + Math.sin(angle) * (r - 25);

        // tick line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 2;
        ctx.stroke();

        // number
        let tx = cx + Math.cos(angle) * (r - 45);
        let ty = cy + Math.sin(angle) * (r - 45);
        ctx.fillText(Math.round(i), tx, ty);
    }

    // === NEEDLE (SMOOTH) ===
    // ✅ FIX ANGLE: DYNAMIC BASED ON CAR MAX SPEED
    let angle = (speed / CAR.maxSpeed) * 1.5 * Math.PI + 0.75 * Math.PI;

    let nx = cx + Math.cos(angle) * (r - 50);
    let ny = cy + Math.sin(angle) * (r - 50);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ff88";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // === CENTER VALUE ===
    ctx.fillStyle = "#00ff88";
    ctx.font = "bold 28px Orbitron";
    ctx.fillText(Math.round(speed), cx, cy);

    ctx.font = "12px Orbitron";
    ctx.fillText("km/h", cx, cy + 20);
}

function drawRPM(ctx, rpm) {
    const cx = 150;
    const cy = 150;
    const r = 120;

    ctx.clearRect(0, 0, 300, 300);

    // === GLOW ARC ===
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0.75 * Math.PI, 2.25 * Math.PI);
    ctx.strokeStyle = "#ff2d75";
    ctx.lineWidth = 10;
    ctx.shadowBlur = 25;
    ctx.shadowColor = "#ff2d75";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // === INNER GLASS ===
    ctx.beginPath();
    ctx.arc(cx, cy, r - 30, 0, 2 * Math.PI);
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fill();

    // === TICKS + NUMBERS ===
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Orbitron";
    ctx.textAlign = "center";

    for (let i = 0; i <= 10; i++) {
        let angle = (i / 10) * 1.5 * Math.PI + 0.75 * Math.PI;

        let x1 = cx + Math.cos(angle) * (r - 10);
        let y1 = cy + Math.sin(angle) * (r - 10);

        let x2 = cx + Math.cos(angle) * (r - 25);
        let y2 = cy + Math.sin(angle) * (r - 25);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#ff2d75";
        ctx.lineWidth = 2;
        ctx.stroke();

        let tx = cx + Math.cos(angle) * (r - 45);
        let ty = cy + Math.sin(angle) * (r - 45);
        ctx.fillText(i, tx, ty);
    }

    // === NEEDLE ===
    let visualRpm = Math.min(rpm, 10000); // Prevent needle wrap-around
    let angle = (visualRpm / 10000) * 1.5 * Math.PI + 0.75 * Math.PI;

    let nx = cx + Math.cos(angle) * (r - 50);
    let ny = cy + Math.sin(angle) * (r - 50);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = "#ff2d75";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ff2d75";
    ctx.stroke();
    ctx.shadowBlur = 0;

    // === CENTER VALUE ===
    ctx.fillStyle = "#ff2d75";
    ctx.font = "bold 28px Orbitron";
    ctx.fillText((rpm / 1000).toFixed(1), cx, cy);

    ctx.font = "12px Orbitron";
    ctx.fillText("RPM x1000", cx, cy + 20);
}

// --- STEP 1: CREATE EV DATASET ---
const cars = {
  tesla_model_3: { name: "Tesla Model 3", maxRange: 491 },
  tata_nexon: { name: "Tata Nexon EV", maxRange: 465 },
  kia_ev6: { name: "Kia EV6", maxRange: 708 },
  mg_zs: { name: "MG ZS EV", maxRange: 461 }
};

// --- STEP 2: CREATE CALCULATION FUNCTION ---
function calculateRange(battery, speed) {
  let car = cars["tesla_model_3"]; // default

  let range = (battery / 100) * car.maxRange;

  if (speed > 100) {
    range *= 0.85;
  }

  return range;
}

function render() {

    console.log("RENDER RUNNING");

    const speedEl = document.getElementById("currentSpeed") || document.getElementById("current-speed");
    const batteryEl = document.getElementById("batteryText") || document.getElementById("live-battery");
    const distanceEl = document.getElementById("distanceText") || document.getElementById("distanceTravelled");

    if (speedEl) {
        speedEl.textContent = Math.round(state.speed) + " km/h";
        if (state.isCruiseActive) {
            speedEl.style.color = "#00ff88";
            speedEl.style.textShadow = "0 0 15px #00ff88";
        } else {
            speedEl.style.color = "#ffffff";
            speedEl.style.textShadow = "0 0 10px rgba(255,255,255,0.5)";
        }
        console.log(`📊 Current speed text updated to: ${Math.round(state.speed)} km/h`);
    } else {
        console.log("❌ currentSpeed NOT FOUND");
    }

    if (batteryEl) {
        batteryEl.textContent = state.battery.toFixed(1) + " %";
    } else {
        console.log("❌ batteryText NOT FOUND");
    }

    if (distanceEl) {
        distanceEl.textContent = state.tripDistance.toFixed(2) + " km";
    } else {
        console.log("❌ distanceText NOT FOUND");
    }

    // --- STEP 3: CONNECT TO RENDER FUNCTION ---
    const predictedEl = document.getElementById("predictedRange") || document.getElementById("travelDistance");
    const range = calculateRange(state.battery, state.speed);

    if (predictedEl) {
        predictedEl.textContent = range.toFixed(1) + " km";
    }

    // --- STEP 5: DEBUG ---
    console.log("Battery:", state.battery);
    console.log("Speed:", state.speed);
    console.log("Range:", range);

    // Trigger the route calculator update to refresh "Battery Sufficient" remaining text
    if (window.routeDistanceValue !== undefined && typeof window.updateBatteryStatus === 'function') {
        window.updateBatteryStatus(window.routeDistanceValue);
    }
    
    // Update Efficiency Status
    const effEl = document.getElementById("efficiency-status");
    if (effEl && state.efficiencyStatus) {
        effEl.textContent = state.efficiencyStatus;
        if (state.efficiencyStatus === "Regen") {
            effEl.style.color = "#007bff";
        } else if (state.efficiencyStatus === "Poor") {
            effEl.style.color = "#dc3545";
        } else if (state.efficiencyStatus === "Good") {
            effEl.style.color = "#17a2b8";
        } else if (state.efficiencyStatus === "Idle") {
            effEl.style.color = "#6c757d";
        } else {
            effEl.style.color = "#28a745";
        }
    }

    // Update Cruise Button UI
    const cruiseBtn = document.getElementById("pauseSpeedBtn");
    if (cruiseBtn) {
        if (state.isCruiseActive) {
            cruiseBtn.style.background = "rgba(34, 197, 94, 0.4)";
            cruiseBtn.style.color = "#ffffff";
            cruiseBtn.textContent = "▶️ Resume Manual Drive";
        } else {
            cruiseBtn.style.background = "rgba(10, 20, 15, 0.8)";
            cruiseBtn.style.color = "#22c55e";
            cruiseBtn.textContent = "⏸️ Pause Speed";
        }
    }
}

function updateCluster() {
    const speedCanvas = document.getElementById("speedCanvas");
    const rpmCanvas = document.getElementById("rpmCanvas");
    
    if (!speedCanvas || !rpmCanvas) {
        console.warn("Canvases not found - waiting for DOM");
        return;
    }
    
    const speedCtx = speedCanvas.getContext("2d");
    const rpmCtx = rpmCanvas.getContext("2d");

    console.log(`Updating gauges - Speed: ${Math.round(state.speed)} km/h, RPM: ${Math.round(state.rpm)}`);
    
    drawSpeedometer(speedCtx, state.speed);
    drawRPM(rpmCtx, state.rpm);
}


function updatePhysics(dt) {
    // 🚀 ACCELERATION
    if (state.isAccelerating) {
        state.isCruiseActive = false;
        // Reduced baseAccel from 60 to 20 for more realistic slower pickup
        const baseAccel = (window.currentCar?.accel || window.carData?.accel || 20);
        
        // EVs have high instant torque at low speeds that tapers off at higher RPMs.
        // It takes extra time to reach high speed because acceleration force gently drops.
        const speedRatio = state.speed / state.maxSpeed;
        const accelMultiplier = Math.max(0.1, 1 - Math.pow(speedRatio, 2.0));
        
        const actualAccel = baseAccel * accelMultiplier;
        state.speed += actualAccel * dt;
    }

    // 🛑 BRAKE
    if (state.isBraking) {
        state.isCruiseActive = false;
        state.speed -= 60 * dt; // Strong, responsive brakes
    } else if (!state.isAccelerating) {
        // 💨 AERODYNAMIC DRAG & ROLLING RESISTANCE (Coasting)
        if (state.isCruiseActive) {
            state.speed = state.cruiseSpeed; // Hard Pause on speed
        } else {
            const dragForce = 0.0005 * state.speed * state.speed * dt;
            state.speed -= dragForce;
            state.speed *= 0.995;
            if (state.speed > 0) state.speed -= 1 * dt; // Linear friction to complete stop
        }
    }

    // 🚫 LIMIT SPEED
    if (state.speed > state.maxSpeed) {
        state.speed = state.maxSpeed;
    }
    if (state.speed < 0) state.speed = 0;

    // ✅ MAIN LOGIC (distance = speed × time)
    const distKm = state.speed * dt / 3600;
    state.tripDistance += distKm;
    state.odometerDistance += distKm;

    // 🎯 Determine Efficiency Status
    if (state.isBraking && state.speed > 5) {
        state.efficiencyStatus = "Regen";
    } else if (state.speed > 120) {
        state.efficiencyStatus = "Poor";
    } else if (state.speed > 80 || (state.speed < 20 && state.speed > 0)) {
        state.efficiencyStatus = "Good";
    } else if (state.speed === 0) {
        state.efficiencyStatus = "Idle";
    } else {
        state.efficiencyStatus = "Optimal";
    }

    // 🔋 BATTERY CALCULATION (Exact exact mathematical tracking as per "cars website")
    if (state.initialBattery && state.initialRange && state.initialRange > 0) {
        // Straight mathematical drain for distance driven
        let baseDrain = (distKm * state.initialBattery) / state.initialRange;
        
        // Implement Multiplier Logic based on Efficiency Status
        let consumptionMultiplier = 1.0;
        if (state.efficiencyStatus === "Poor") {
            consumptionMultiplier = 2.5; // High drag and massive power draw
        } else if (state.efficiencyStatus === "Good") {
            consumptionMultiplier = 1.5; // Moderate drain modifier
        } else if (state.efficiencyStatus === "Optimal") {
            consumptionMultiplier = 1.0; // Ideal efficiency
        }
        
        let batteryLostPercent = baseDrain * consumptionMultiplier;
        
        // Idle ambient drain (A/C, electronics etc)
        if (state.efficiencyStatus === "Idle") {
            batteryLostPercent += (0.0005 * dt);
        }

        // Regenerative braking recovers a tiny accurate subset of momentum
        if (state.efficiencyStatus === "Regen") {
            let regen = 0.005 * dt;
            batteryLostPercent -= regen;
        }
        
        state.battery -= batteryLostPercent;
    } else {
        // Fallback simple drain if no prediction exists
        if (state.isAccelerating) state.battery -= 0.02 * dt;
        if (state.isBraking) state.battery += 0.01 * dt;
        if (state.speed === 0 && !state.isBraking && !state.isAccelerating) state.battery -= 0.001 * dt;
    }

    // 🔋 BATTERY CLAMP
    state.battery = Math.max(0, Math.min(100, state.battery));

    // RPM
    state.rpm = state.speed * 40;
}

function loop() {
    console.log("LOOP RUNNING - Speed:", state.speed);

    const now = performance.now();
    const dt = (now - state.prevTime) / 1000;
    state.prevTime = now;

    updatePhysics(dt);

    state.speed = Math.max(0, Math.min(state.maxSpeed, state.speed));
    state.battery = Math.max(0, Math.min(100, state.battery));

    updateCluster();
    render();

    requestAnimationFrame(loop);
}



let hasEventListeners = false;

function initSimulation(config) {
    if (config.battery !== undefined) {
        state.battery = config.battery;
    }
    state.initialBattery = state.battery > 0 ? state.battery : 100;
    state.initialRange = config.estimated_range_km !== undefined ? config.estimated_range_km : 400;

    state.speed = 0;
    state.tripDistance = 0;
    state.prevTime = performance.now();

    const container = document.getElementById("simulation-container");
    if (container) {
        container.style.display = "block";
    }

    if (hasEventListeners) return;
    hasEventListeners = true;

    const accelPedal = document.querySelector(".pedal.accel");
    const brakePedal = document.querySelector(".pedal.brake");

    const cruiseBtn = document.getElementById("pauseSpeedBtn");
    if (cruiseBtn) {
        cruiseBtn.addEventListener("click", () => {
            if (state.speed > 0) {
                state.isCruiseActive = !state.isCruiseActive;
                if (state.isCruiseActive) {
                    state.cruiseSpeed = state.speed; // Lock exact speed
                    state.isAccelerating = false; // Override held accelerator
                    state.isBraking = false;
                }
            }
        });
    }

    function setAccelerating(active) {
        state.isAccelerating = active;
        if (active) state.isCruiseActive = false;
    }
    function setBraking(active) {
        state.isBraking = active;
        if (active) state.isCruiseActive = false;
    }

    if (accelPedal) {
        accelPedal.addEventListener("mousedown", () => setAccelerating(true));
        accelPedal.addEventListener("mouseup", () => setAccelerating(false));
        accelPedal.addEventListener("mouseleave", () => setAccelerating(false)); // Fix mouse slip
        accelPedal.addEventListener("touchstart", (e) => { e.preventDefault(); setAccelerating(true); });
        accelPedal.addEventListener("touchend", () => setAccelerating(false));
        accelPedal.addEventListener("touchcancel", () => setAccelerating(false)); // Fix touch slip
    }

    if (brakePedal) {
        brakePedal.addEventListener("mousedown", () => setBraking(true));
        brakePedal.addEventListener("mouseup", () => setBraking(false));
        brakePedal.addEventListener("mouseleave", () => setBraking(false)); // Fix mouse slip
        brakePedal.addEventListener("touchstart", (e) => { e.preventDefault(); setBraking(true); });
        brakePedal.addEventListener("touchend", () => setBraking(false));
        brakePedal.addEventListener("touchcancel", () => setBraking(false)); // Fix touch slip
    }

    // ⌨️ KEYBOARD CONTROLS for easy testing
    const keys = {};
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        if (e.key === 'w' || e.key === 'ArrowUp') state.isAccelerating = true;
        if (e.key === 's' || e.key === 'ArrowDown') state.isBraking = true;
    });
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
        if (e.key === 'w' || e.key === 'ArrowUp') state.isAccelerating = false;
        if (e.key === 's' || e.key === 'ArrowDown') state.isBraking = false;
    });

    console.log("✅ Simulation initialized - pedals active, physics ready");

    if (!state.loopRunning) {
        state.loopRunning = true;
        requestAnimationFrame(loop);
    }
}

state.loopRunning = false;

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSimulation);
} else {
    initSimulation({battery: 100});
}
