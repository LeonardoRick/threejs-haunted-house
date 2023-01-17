import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';
import {
    BoxGeometry,
    ConeGeometry,
    DoubleSide,
    Float32BufferAttribute,
    Fog,
    Group,
    Mesh,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    PlaneGeometry,
    PointLight,
    RepeatWrapping,
    SphereGeometry,
} from 'three';

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
};

/**
 * Base
 */
// Debug
const gui = new dat.GUI();

// Canvas
const canvas = document.querySelector('canvas.webgl');

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const doorColorTexture = textureLoader.load('/textures/door/color.jpg');
const doorAlphaTexture = textureLoader.load('/textures/door/alpha.jpg');
const doorAmbientOcclusionTexture = textureLoader.load('/textures/door/ambientOcclusion.jpg');
const doorHeightTexture = textureLoader.load('/textures/door/height.jpg');
const doorNormalTexture = textureLoader.load('/textures/door/normal.jpg');
const doorMetalnessTexture = textureLoader.load('/textures/door/metalness.jpg');
const doorRoughnessTexture = textureLoader.load('/textures/door/roughness.jpg');

const bricksColorTexture = textureLoader.load('/textures/bricks/color.jpg');
const bricksAmbientOcclusionTexture = textureLoader.load('/textures/bricks/ambientOcclusion.jpg');
const bricksNormalTexture = textureLoader.load('/textures/bricks/normal.jpg');
const bricksRoughnessTexture = textureLoader.load('/textures/bricks/roughness.jpg');

const grassColorTexture = textureLoader.load('/textures/grass/color.jpg');
const grassAmbientOcclusionTexture = textureLoader.load('/textures/grass/ambientOcclusion.jpg');
const grassNormalTexture = textureLoader.load('/textures/grass/normal.jpg');
const grassRoughnessTexture = textureLoader.load('/textures/bricks/roughness.jpg');

grassColorTexture.repeat.set(8, 8);
grassAmbientOcclusionTexture.repeat.set(8, 8);
grassNormalTexture.repeat.set(8, 8);
grassRoughnessTexture.repeat.set(8, 8);

['wrapS', 'wrapT'].forEach((key) => {
    grassColorTexture[key] = RepeatWrapping;
    grassAmbientOcclusionTexture[key] = RepeatWrapping;
    grassNormalTexture[key] = RepeatWrapping;
    grassRoughnessTexture[key] = RepeatWrapping;
});

/**
 * House
 */
// group is just an 3d object
const house = new Group();
// walls
const wallsHeight = 2.5;
const wallsWidth = 4;
const walls = new Mesh(
    new BoxGeometry(wallsWidth, wallsHeight, 4),
    new MeshStandardMaterial({
        map: bricksColorTexture,
        aoMap: bricksAmbientOcclusionTexture,
        normalMap: bricksNormalTexture,
        roughnessMap: bricksRoughnessTexture,
        transparent: true,
    })
);
walls.geometry.setAttribute('uv2', new Float32BufferAttribute(walls.geometry.attributes.uv.array, 2));
walls.position.y = wallsHeight * 0.5;
house.add(walls);
scene.add(house);

// roof
const roofHeight = 1;
const roof = new Mesh(new ConeGeometry(3.5, roofHeight, 4), new MeshStandardMaterial({ color: '#b35f45' }));
roof.position.y = wallsHeight + roofHeight * 0.5;
roof.rotation.y = Math.PI * 0.25;
house.add(roof);

// door
const doorHeight = 2;
const door = new Mesh(
    // we need to add more vertices so displacementMap can work properly
    new PlaneGeometry(doorHeight, 2, 50, 50),
    new MeshStandardMaterial({
        map: doorColorTexture,
        alphaMap: doorAlphaTexture,
        transparent: true,
        aoMap: doorAmbientOcclusionTexture,
        displacementMap: doorHeightTexture,
        displacementScale: 0.1,
        normalMap: doorNormalTexture,
        metalnessMap: doorMetalnessTexture,
        roughnessMap: doorRoughnessTexture,
    })
);
door.geometry.setAttribute('uv2', new Float32BufferAttribute(door.geometry.attributes.uv.array, 2));
door.position.y = doorHeight * 0.46;
door.position.z = wallsWidth * 0.5 + 0.01;
house.add(door);

// bushes
const bushGeometry = new SphereGeometry(1, 16, 16);
const bushMaterial = new MeshStandardMaterial({ color: '#89c894' });
const bush1 = new Mesh(bushGeometry, bushMaterial);
bush1.scale.set(0.5, 0.5, 0.5);
bush1.position.set(0.8, 0.2, 2.2);
scene.add(bush1);

const bush2 = new Mesh(bushGeometry, bushMaterial);
bush2.scale.set(0.25, 0.25, 0.25);
bush2.position.set(1.4, 0.1, 2.1);
scene.add(bush2);

const bush3 = new Mesh(bushGeometry, bushMaterial);
bush3.scale.set(0.4, 0.4, 0.4);
bush3.position.set(-0.8, 0.1, 2.2);
scene.add(bush3);

const bush4 = new Mesh(bushGeometry, bushMaterial);
bush4.scale.set(0.15, 0.15, 0.15);
bush4.position.set(-1, 0.05, 2.6);
scene.add(bush4);

// graves
const graves = new Group();
const gravesHeight = 0.8;
const graveGeometry = new BoxGeometry(0.6, gravesHeight, 0.2);
const graveMaterial = new MeshStandardMaterial({ color: '#b2b6b1' });
for (let i = 0; i < 50; i++) {
    const grave = new Mesh(graveGeometry, graveMaterial);

    const angle = Math.random() * Math.PI * 2;
    // when you use the same value on Math.sin and Math.cos you get a position on a circle.

    // We want the graves to be out of the house, but not so far, like we had
    // a circle protecting the house while we random create the graves.
    const radius = wallsWidth - 1 + Math.random() * 6; // random value from 3 to 9;
    //To do that we  need to multiply the value of the sin and cos so the graves are not so close to the
    // center of our scene
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    // we subtract 0.1 because when we rotate on the z axe, we may show the bottom of the grave out of the floor
    grave.position.set(x, gravesHeight * 0.5 - 0.1, z);
    // slight rotate the graves (multiplying by 0.4) to give a more natural and disorder aspect
    grave.rotation.y = (Math.random() - 0.5) * 0.4;
    grave.rotation.z = (Math.random() - 0.5) * 0.4;
    grave.castShadow = true;
    graves.add(grave);
}
scene.add(graves);

// floor
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({
        map: grassColorTexture,
        aoMap: grassAmbientOcclusionTexture,
        normalMap: grassNormalTexture,
        roughnessMap: grassRoughnessTexture,
        side: DoubleSide,
    })
);
floor.geometry.setAttribute('uv2', new Float32BufferAttribute(floor.geometry.attributes.uv.array, 2));
floor.rotation.x = -Math.PI * 0.5;
floor.position.y = 0;
scene.add(floor);

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#b9d5ff', 0.12);
gui.add(ambientLight, 'intensity').min(0).max(1).step(0.001).name('Ambient Light Intensity');
scene.add(ambientLight);

// Directional light
const moonLight = new THREE.DirectionalLight('#b9d5ff', 0.12);
moonLight.position.set(4, 5, -2);

gui.add(moonLight, 'intensity').min(0).max(1).step(0.001).name('Moon Light Intensity');
gui.add(moonLight.position, 'x').min(-5).max(5).step(0.001);
gui.add(moonLight.position, 'y').min(-5).max(5).step(0.001);
gui.add(moonLight.position, 'z').min(-5).max(5).step(0.001);
scene.add(moonLight);

// Door light
const doorLight = new PointLight('#ff7d46', 1, 7);
doorLight.position.set(0, 2.2, 2.7);
house.add(doorLight);

// Fog
const fogColor = '#262837';
const fog = new Fog(fogColor, 1, 15);
// change the background color
renderer.setClearColor(fogColor);
scene.fog = fog;

/**
 * Ghosts
 */
const ghost1 = new PointLight('#ff00ff', 2, 3);
scene.add(ghost1);
const ghost2 = new PointLight('#00ffff', 2, 3);
scene.add(ghost2);
const ghost3 = new PointLight('#ffff00', 2, 3);
scene.add(ghost3);

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Shadows
 */

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;

moonLight.castShadow = true;
doorLight.castShadow = true;
ghost1.castShadow = true;
ghost2.castShadow = true;
ghost3.castShadow = true;

walls.castShadow = true;
bush1.castShadow = true;
bush2.castShadow = true;
bush3.castShadow = true;
bush4.castShadow = true;

floor.receiveShadow = true;
walls.receiveShadow = true;

// optimize shadow maps
[doorLight, ghost1, ghost2, ghost3].forEach((pointLight) => {
    pointLight.shadow.mapSize.width = 256;
    pointLight.shadow.mapSize.height = 256;
    pointLight.shadow.camera.far = 7;
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.x = 4;
camera.position.y = 2;
camera.position.z = 5;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Animate
 */
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // update ghosts
    const ghostAngle1 = elapsedTime * 0.5; // change the speed;
    ghost1.position.x = Math.cos(ghostAngle1) * 4;
    ghost1.position.z = Math.sin(ghostAngle1) * 4;
    ghost1.position.y = Math.sin(elapsedTime * 2);

    const ghostAngle2 = -elapsedTime * 0.32;
    ghost2.position.x = Math.cos(ghostAngle2) * 4;
    ghost2.position.z = Math.sin(ghostAngle2) * 4;
    // adding two sins will add more randomness to the animation
    ghost2.position.y = Math.sin(elapsedTime * 2) + Math.sin(elapsedTime * 1.2);

    const ghostAngule3 = -elapsedTime * 0.18;
    // 7 + Math.sin will change the radius of the 'base' circle so it will be not moving in perfect circles
    ghost3.position.x = Math.cos(ghostAngule3) * (7 + Math.sin(elapsedTime * 0.32));
    ghost3.position.z = Math.sin(ghostAngule3) * (7 + Math.sin(elapsedTime * 0.5));
    ghost3.position.y = Math.sin(elapsedTime * 4) + Math.sin(elapsedTime * 2.5);
    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();
