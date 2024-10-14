const scene = new THREE.Scene();
scene.background = new THREE.Color(0x130c0b);

const camera = new THREE.PerspectiveCamera(41, window.innerWidth / window.innerHeight, 0.2, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 0);
sunLight.position.set(0, 0, 0); 
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 256;
sunLight.shadow.mapSize.height = 512;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 1000;
sunLight.shadow.radius = 10;
sunLight.shadow.bias = -0.0001;
scene.add(sunLight);

const sunLightHelper = new THREE.DirectionalLightHelper(sunLight, 10);
scene.add(sunLightHelper);

camera.position.set(662, 376, 976);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 1;
controls.maxDistance = 1000;
controls.maxPolarAngle = Math.PI;
controls.autoRotate = false;
controls.autoRotateSpeed = 1;

const gui = new dat.GUI();
const cameraFolder = gui.addFolder('Camera');
const cameraPositionX = cameraFolder.add(camera.position, 'x', -1000, 1000);
const cameraPositionY = cameraFolder.add(camera.position, 'y', -1000, 1000);
const cameraPositionZ = cameraFolder.add(camera.position, 'z', -1000, 1000);
cameraFolder.add(camera, 'fov', 10, 120).onChange(() => {
    camera.updateProjectionMatrix();
});
cameraFolder.open();

const sunLightFolder = gui.addFolder('Sun Light');
const sunLightAngle = { theta: 45, phi: 45 };
sunLightFolder.add(sunLightAngle, 'theta', 0, 180).name('Vertical Angle').onChange(updateSunPosition);
sunLightFolder.add(sunLightAngle, 'phi', 0, 360).name('Horizontal Angle').onChange(updateSunPosition);
sunLightFolder.add(sunLight, 'intensity', 0, 1);
sunLightFolder.open();

function updateSunPosition() {
    const theta = sunLightAngle.theta * (Math.PI / 180);
    const phi = sunLightAngle.phi * (Math.PI / 180);
    const x = 500 * Math.sin(theta) * Math.cos(phi);
    const y = 500 * Math.cos(theta);
    const z = 500 * Math.sin(theta) * Math.sin(phi);
    sunLight.position.set(x, y, z);
    sunLightHelper.update();
}

const controlsFolder = gui.addFolder('Controls');
controlsFolder.add(controls, 'autoRotate');
controlsFolder.add(controls, 'autoRotateSpeed', 0, 5);
controlsFolder.open();

const loader = new THREE.GLTFLoader();
loader.load(
    './models/scene.gltf',
    (gltf) => {
        scene.add(gltf.scene);
        
        gltf.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                if (child.material) {
                    if (child.material.roughness !== undefined) {
                        child.material.roughness = Math.min(1, child.material.roughness + 0.2);
                    }
                    if (child.material.metalness !== undefined) {
                        child.material.metalness = Math.max(0, child.material.metalness - 0.1);
                    }
                    child.material.needsUpdate = true;
                }
            }
        });

        const box = new THREE.Box3().setFromObject(gltf.scene);
        const center = box.getCenter(new THREE.Vector3());
        
        camera.position.set(662, 376, 976);
        camera.lookAt(center);
        
        controls.target.copy(center);
        controls.update();

        cameraPositionX.updateDisplay();
        cameraPositionY.updateDisplay();
        cameraPositionZ.updateDisplay();

        document.getElementById('loading').style.display = 'none';
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('An error happened', error);
    }
);

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
