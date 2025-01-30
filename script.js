// Configuração básica da cena
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.setClearColor(0x111111, 1);

// Controles da câmera
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

// Iluminação
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(100, 100, 150);
scene.add(light);

// Variáveis globais
let vehicle;
let curve;
let progress = 0;

// Carregar o SVG
const loader = new THREE.SVGLoader();
loader.load("/tracks/Suzuka.svg", function (data) {
    const paths = data.paths;
    const trackPoints = [];

    paths.forEach((path) => {
        const shapes = path.toShapes(true);
        shapes.forEach((shape) => {
            trackPoints.push(...shape.getPoints(1000));
        });
    });

    // Criar a curva do traçado da pista
    curve = new THREE.CatmullRomCurve3(
        trackPoints.map(p => new THREE.Vector3(p.x * 0.5, -p.y * 0.5, 0)),
        true
    );

    // Criar um perfil retangular para a pista
    const trackWidth = 15;
    const trackHeight = 4;

    const trackShape = new THREE.Shape();
    trackShape.moveTo(0, -trackWidth / 2);
    trackShape.lineTo(0, trackWidth / 2);
    trackShape.lineTo(trackHeight, trackWidth / 2);
    trackShape.lineTo(trackHeight, -trackWidth / 2);
    trackShape.lineTo(0, -trackWidth / 2);

    // Criar a geometria da pista extrudada ao longo da curva
    const extrudeSettings = { steps: 300, bevelEnabled: false, extrudePath: curve };
    const trackGeometry = new THREE.ExtrudeGeometry(trackShape, extrudeSettings);
    const trackMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3, side: THREE.DoubleSide });

    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    scene.add(trackMesh);

});

// Importar veículo
const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load("/cars/f1_car.glb", function (gltf) {
    vehicle = gltf.scene;
    vehicle.scale.set(3, 3, 3);
    vehicle.rotation.set(Math.PI / 2, 0, Math.PI);
    scene.add(vehicle);
});

// Atualizar posição do veículo
function updateVehiclePosition() {
    if (!vehicle || !curve) return;

    progress += 0.001;
    if (progress > 1) progress = 0;

    const position = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress);

    vehicle.position.copy(position);

    // Ajuste fino da rotação
    const lookAtMatrix = new THREE.Matrix4();
    lookAtMatrix.lookAt(position.clone().add(tangent), position, new THREE.Vector3(0, 0, 1));
    vehicle.quaternion.setFromRotationMatrix(lookAtMatrix);
}

// Posicionamento da câmera
camera.position.set(0, -500, 300);
camera.lookAt(0, 0, 0);

// Função de animação
function animate() {
    requestAnimationFrame(animate);
    updateVehiclePosition();
    controls.update();
    renderer.render(scene, camera);
}

animate();