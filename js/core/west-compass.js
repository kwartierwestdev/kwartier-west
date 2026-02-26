import { t } from "./i18n.js";

const WEST_BEARING = 270;
const SENSOR_TIMEOUT_MS = 2200;

function normalizeAngle(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return ((number % 360) + 360) % 360;
}

function screenRotationAngle() {
  if (typeof window.screen?.orientation?.angle === "number") {
    return normalizeAngle(window.screen.orientation.angle);
  }

  if (typeof window.orientation === "number") {
    return normalizeAngle(window.orientation);
  }

  return 0;
}

function headingFromEvent(event) {
  if (typeof event.webkitCompassHeading === "number" && Number.isFinite(event.webkitCompassHeading)) {
    return normalizeAngle(event.webkitCompassHeading);
  }

  if (event.type === "deviceorientation" && event.absolute === false) {
    return null;
  }

  if (typeof event.alpha === "number" && Number.isFinite(event.alpha)) {
    const adjustedAlpha = normalizeAngle(event.alpha + screenRotationAngle());
    return normalizeAngle(360 - adjustedAlpha);
  }

  return null;
}

function westAngleFromHeading(heading) {
  return normalizeAngle(WEST_BEARING - heading);
}

function setStatus(compass, key, params = {}) {
  const statusNode = compass.querySelector("[data-west-compass-status]");
  const text = t(key, params);
  compass.dataset.westState = key;
  compass.title = text;
  if (statusNode) statusNode.textContent = text;
}

function setNeedle(compass, heading) {
  const westAngle = westAngleFromHeading(heading);
  compass.style.setProperty("--west-angle", `${westAngle.toFixed(1)}deg`);
  setStatus(compass, "nav.compassHeading", { angle: Math.round(westAngle) });
}

function setDecorativeMode(compass) {
  compass.style.setProperty("--west-angle", "270deg");
  setStatus(compass, "nav.compassDecorative");
}

function setupCompass(compass) {
  if (!(compass instanceof HTMLElement)) return;
  if (compass.dataset.westCompassReady === "true") return;
  compass.dataset.westCompassReady = "true";

  let gotSensorHeading = false;
  let listenersBound = false;
  let activationRequested = false;

  const onOrientation = (event) => {
    if (typeof event.webkitCompassAccuracy === "number" && event.webkitCompassAccuracy > 80) return;

    const heading = headingFromEvent(event);
    if (heading === null) return;
    gotSensorHeading = true;
    setNeedle(compass, heading);
  };

  const removeSensorListeners = () => {
    if (!listenersBound) return;
    listenersBound = false;
    window.removeEventListener("deviceorientationabsolute", onOrientation, true);
    window.removeEventListener("deviceorientation", onOrientation, true);
  };

  const bindSensorListeners = () => {
    if (listenersBound) return;
    listenersBound = true;
    window.addEventListener("deviceorientationabsolute", onOrientation, true);
    window.addEventListener("deviceorientation", onOrientation, true);
  };

  const startSensorMode = () => {
    setStatus(compass, "nav.compassReady");
    bindSensorListeners();
    window.setTimeout(() => {
      if (gotSensorHeading) return;
      removeSensorListeners();
      setDecorativeMode(compass);
    }, SENSOR_TIMEOUT_MS);
  };

  async function requestActivation() {
    if (activationRequested || gotSensorHeading) return;
    activationRequested = true;

    const OrientationApi = window.DeviceOrientationEvent;
    const needsPermission = typeof OrientationApi?.requestPermission === "function";

    if (!OrientationApi) {
      setStatus(compass, "nav.compassUnavailable");
      setDecorativeMode(compass);
      return;
    }

    if (!needsPermission) {
      startSensorMode();
      return;
    }

    try {
      const permission = await OrientationApi.requestPermission();
      if (permission === "granted") {
        startSensorMode();
      } else {
        setStatus(compass, "nav.compassDenied");
        setDecorativeMode(compass);
      }
    } catch (error) {
      console.error("West compass activation failed", error);
      setStatus(compass, "nav.compassError");
      setDecorativeMode(compass);
    }
  }

  setStatus(compass, "nav.compassWaiting");

  const OrientationApi = window.DeviceOrientationEvent;
  const needsPermission = typeof OrientationApi?.requestPermission === "function";
  if (!needsPermission) {
    requestActivation();
  } else {
    const autoActivate = () => requestActivation();
    window.addEventListener("pointerdown", autoActivate, { once: true, passive: true });
    window.addEventListener("touchstart", autoActivate, { once: true, passive: true });
  }

  compass.addEventListener("click", () => {
    requestActivation();
  });

  compass.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      requestActivation();
    }
  });
}

export function initWestCompass(root = document) {
  const scope = root && typeof root.querySelectorAll === "function" ? root : document;
  const nodes = scope.querySelectorAll("[data-west-compass]");
  nodes.forEach((node) => setupCompass(node));
}
