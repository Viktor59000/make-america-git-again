import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const containerEl = document.querySelector(".globe-wrapper");
const canvasEl = containerEl.querySelector("#globe-3d");
const svgMapDomEl = document.querySelector("#map");
const svgCountries = Array.from(svgMapDomEl.querySelectorAll("path"));
const svgCountryDomEl = document.querySelector("#country");
const countryNameEl = document.querySelector(".info span");
const countryCards = document.querySelectorAll(".country-card");

// Map country names to their links
const countryLinks = {};
svgCountries.forEach(path => {
    const name = path.getAttribute("data-name");
    const link = path.getAttribute("data-link");
    if (name && link) countryLinks[name] = link;
});

let renderer, scene, camera, rayCaster, pointer, controls;
let globeGroup, globeColorMesh, globeStrokesMesh, globeSelectionOuterMesh;

const svgViewBox = [2000, 1000];
const offsetY = 0; // Removed offset to fix silhouette alignment

const params = {
    strokeColor: "#ffffff",
    defaultColor: "#34495e",
    hoverColor: "#ffd700",
    fogColor: "#0a0a1a",
    fogDistance: 2.8,
    strokeWidth: 1, // Thinner strokes for sharpness
    hiResScalingFactor: 2,
    lowResScalingFactor: 0.7
};

let hoveredCountryIdx = 0;
let isTouchScreen = false;
let isHoverable = true;

const textureLoader = new THREE.TextureLoader();
let staticMapUri;
const bBoxes = [];
const dataUris = [];

initScene();

window.addEventListener("resize", updateSize);

containerEl.addEventListener("touchstart", () => { isTouchScreen = true; });
containerEl.addEventListener("mousemove", (e) => updateMousePosition(e.clientX, e.clientY));
containerEl.addEventListener("click", (e) => {
    updateMousePosition(e.clientX, e.clientY);
    // Navigate on click if country has link
    const name = svgCountries[hoveredCountryIdx]?.getAttribute("data-name");
    if (name && countryLinks[name]) {
        window.location.href = countryLinks[name];
    }
});

// Sync hover between cards and globe
countryCards.forEach(card => {
    card.addEventListener("mouseenter", () => {
        const name = card.getAttribute("data-country");
        const idx = svgCountries.findIndex(p => p.getAttribute("data-name") === name);
        if (idx >= 0) {
            hoveredCountryIdx = idx;
            setMapTexture(globeSelectionOuterMesh.material, dataUris[hoveredCountryIdx]);
            countryNameEl.innerHTML = name;
        }
    });
});

function updateMousePosition(eX, eY) {
    pointer.x = (eX - containerEl.offsetLeft) / containerEl.offsetWidth * 2 - 1;
    pointer.y = -((eY - containerEl.offsetTop) / containerEl.offsetHeight) * 2 + 1;
}

function initScene() {
    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(params.fogColor, 0, params.fogDistance);

    camera = new THREE.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, 0, 3);
    camera.position.z = 1.3;

    globeGroup = new THREE.Group();
    scene.add(globeGroup);

    rayCaster = new THREE.Raycaster();
    rayCaster.far = 1.15;
    pointer = new THREE.Vector2(-1, -1);

    createOrbitControls();
    createGlobe();
    prepareHiResTextures();
    prepareLowResTextures();
    updateSize();

    if (typeof gsap !== 'undefined') {
        gsap.ticker.add(render);
    } else {
        function animate() { render(); requestAnimationFrame(animate); }
        animate();
    }
}

function createOrbitControls() {
    controls = new OrbitControls(camera, canvasEl);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minPolarAngle = 0.46 * Math.PI;
    controls.maxPolarAngle = 0.46 * Math.PI;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    controls.addEventListener("start", () => {
        isHoverable = false;
        pointer = new THREE.Vector2(-1, -1);
        if (typeof gsap !== 'undefined') {
            gsap.to(globeGroup.scale, { duration: 0.3, x: 0.9, y: 0.9, z: 0.9, ease: "power1.inOut" });
        }
    });
    controls.addEventListener("end", () => {
        if (typeof gsap !== 'undefined') {
            gsap.to(globeGroup.scale, { duration: 0.6, x: 1, y: 1, z: 1, ease: "back(1.7).out", onComplete: () => { isHoverable = true; } });
        } else {
            isHoverable = true;
        }
    });
}

function createGlobe() {
    const globeGeometry = new THREE.IcosahedronGeometry(1, 20);
    const globeColorMaterial = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: true, side: THREE.DoubleSide });
    const globeStrokeMaterial = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false });
    const outerSelectionColorMaterial = new THREE.MeshBasicMaterial({ transparent: true, side: THREE.DoubleSide });

    globeColorMesh = new THREE.Mesh(globeGeometry, globeColorMaterial);
    globeStrokesMesh = new THREE.Mesh(globeGeometry, globeStrokeMaterial);
    globeSelectionOuterMesh = new THREE.Mesh(globeGeometry, outerSelectionColorMaterial);

    // Black internal sphere to hide back lines
    const globeGeometryFill = new THREE.IcosahedronGeometry(0.99, 20);
    const globeFillMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const globeFillMesh = new THREE.Mesh(globeGeometryFill, globeFillMaterial);

    // Halo/Atmosphere effect
    const globeGeometryHalo = new THREE.IcosahedronGeometry(1.1, 20);
    const globeHaloMaterial = new THREE.MeshBasicMaterial({
        color: 0x4466ff,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    const globeHaloMesh = new THREE.Mesh(globeGeometryHalo, globeHaloMaterial);

    globeStrokesMesh.renderOrder = 2;
    globeGroup.add(globeHaloMesh, globeFillMesh, globeStrokesMesh, globeSelectionOuterMesh, globeColorMesh);
}

function setMapTexture(material, URI) {
    textureLoader.load(URI, (t) => {
        t.repeat.set(1, 1);
        material.map = t;
        material.needsUpdate = true;
    });
}

function prepareHiResTextures() {
    svgMapDomEl.setAttribute("viewBox", `0 ${offsetY * svgViewBox[1]} ${svgViewBox[0]} ${svgViewBox[1]}`);
    svgMapDomEl.setAttribute("stroke-width", params.strokeWidth);
    svgMapDomEl.setAttribute("stroke", params.strokeColor);
    svgMapDomEl.setAttribute("fill", params.defaultColor);
    svgMapDomEl.setAttribute("width", svgViewBox[0] * params.hiResScalingFactor);
    svgMapDomEl.setAttribute("height", svgViewBox[1] * params.hiResScalingFactor);

    let svgData = new XMLSerializer().serializeToString(svgMapDomEl);
    staticMapUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    setMapTexture(globeColorMesh.material, staticMapUri);

    svgMapDomEl.setAttribute("fill", "none");
    svgMapDomEl.setAttribute("stroke", params.strokeColor);
    svgData = new XMLSerializer().serializeToString(svgMapDomEl);
    staticMapUri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    setMapTexture(globeStrokesMesh.material, staticMapUri);

    if (svgCountries[hoveredCountryIdx]) {
        countryNameEl.innerHTML = svgCountries[hoveredCountryIdx].getAttribute("data-name");
    }
}

function prepareLowResTextures() {
    svgCountryDomEl.setAttribute("viewBox", `0 ${offsetY * svgViewBox[1]} ${svgViewBox[0]} ${svgViewBox[1]}`);
    svgCountryDomEl.setAttribute("stroke-width", params.strokeWidth);
    svgCountryDomEl.setAttribute("stroke", params.strokeColor);
    svgCountryDomEl.setAttribute("fill", params.hoverColor);
    svgCountryDomEl.setAttribute("width", svgViewBox[0] * params.lowResScalingFactor);
    svgCountryDomEl.setAttribute("height", svgViewBox[1] * params.lowResScalingFactor);

    svgCountries.forEach((path, idx) => { bBoxes[idx] = path.getBBox(); });
    svgCountries.forEach((path, idx) => {
        svgCountryDomEl.innerHTML = "";
        svgCountryDomEl.appendChild(path.cloneNode(true));
        const svgData = new XMLSerializer().serializeToString(svgCountryDomEl);
        dataUris[idx] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
    });
    setMapTexture(globeSelectionOuterMesh.material, dataUris[hoveredCountryIdx]);
}

function updateMap(uv = { x: 0, y: 0 }) {
    const pointObj = svgMapDomEl.createSVGPoint();
    pointObj.x = uv.x * svgViewBox[0];
    pointObj.y = (1 + offsetY - uv.y) * svgViewBox[1];

    for (let i = 0; i < svgCountries.length; i++) {
        const boundingBox = bBoxes[i];
        if (pointObj.x > boundingBox.x || pointObj.x < boundingBox.x + boundingBox.width ||
            pointObj.y > boundingBox.y || pointObj.y < boundingBox.y + boundingBox.height) {
            const isHovering = svgCountries[i].isPointInFill(pointObj);
            if (isHovering && i !== hoveredCountryIdx) {
                hoveredCountryIdx = i;
                setMapTexture(globeSelectionOuterMesh.material, dataUris[hoveredCountryIdx]);
                countryNameEl.innerHTML = svgCountries[hoveredCountryIdx].getAttribute("data-name");
                break;
            }
        }
    }
}

function render() {
    controls.update();
    if (isHoverable) {
        rayCaster.setFromCamera(pointer, camera);
        const intersects = rayCaster.intersectObject(globeStrokesMesh);
        if (intersects.length) updateMap(intersects[0].uv);
    }
    if (isTouchScreen && isHoverable) isHoverable = false;
    renderer.render(scene, camera);
}

function updateSize() {
    const side = Math.max(100, Math.min(400, Math.min(window.innerWidth, window.innerHeight) - 100));
    containerEl.style.width = side + "px";
    containerEl.style.height = side + "px";
    renderer.setSize(side, side);
}
