// ==========================
// Configuração Inicial
// ==========================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Habilitar sombras
document.body.appendChild(renderer.domElement);

// Cor de fundo da cena
renderer.setClearColor(0x111111, 1);

// Controles da câmera
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

// Posicionamento inicial da câmera
camera.position.set(0, -500, 300);
camera.lookAt(0, 0, 0);

// ==========================
// Iluminação
// ==========================
const sunLight = new THREE.DirectionalLight(0xFFD1A9, 0.7); // Luz simulando o sol
sunLight.position.set(300, 300, 300);
sunLight.castShadow = true; // Ativar sombras
sunLight.shadow.mapSize.width = 1024;
sunLight.shadow.mapSize.height = 1024;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 1000;
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Luz ambiente para suavizar o contraste
scene.add(ambientLight);

// ==========================
// Variáveis Globais
// ==========================
let vehicle;
let curve;
let progress = 0; // Posição do veículo na pista (0 a 1)
let trackBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }; // Limites da pista

// ==========================
// Carregar o Circuito SVG
// ==========================
const loader = new THREE.SVGLoader();

loader.load("/tracks/Brazil.svg", function (data) {
    const paths = data.paths;
    const trackPoints = [];

    paths.forEach((path) => {
        const shapes = path.toShapes(true);
        shapes.forEach((shape) => {
            const points = shape.getPoints(1000);
            trackPoints.push(...points);

            // Atualizar os limites da pista
            points.forEach(p => {
                trackBounds.minX = Math.min(trackBounds.minX, p.x);
                trackBounds.maxX = Math.max(trackBounds.maxX, p.x);
                trackBounds.minY = Math.min(trackBounds.minY, p.y);
                trackBounds.maxY = Math.max(trackBounds.maxY, p.y);
            });
        });
    });

    // Criar a curva da pista
    curve = new THREE.CatmullRomCurve3(
        trackPoints.map(p => new THREE.Vector3(p.x * 0.5, -p.y * 0.5, 0)),
        true
    );

    createTrack(); // Criar a geometria da pista
    createGrassPlane(); // Criar o gramado
    addTrackBorders(); // Adicionar as bordas
    addDashedLine(); // Adicionar linha pontilhada no centro
});

// ==========================
// Funções de Construção do Circuito
// ==========================
function createTrack() {
    const trackWidth = 15;
    const trackHeight = 4;

    const trackShape = new THREE.Shape();
    trackShape.moveTo(0, -trackWidth / 2);
    trackShape.lineTo(0, trackWidth / 2);
    trackShape.lineTo(trackHeight, trackWidth / 2);
    trackShape.lineTo(trackHeight, -trackWidth / 2);
    trackShape.lineTo(0, -trackWidth / 2);

    const extrudeSettings = { steps: 300, bevelEnabled: false, extrudePath: curve };
    const trackGeometry = new THREE.ExtrudeGeometry(trackShape, extrudeSettings);
    const trackMaterial = new THREE.MeshStandardMaterial({ color: 0xD3D3D3, side: THREE.DoubleSide });

    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    trackMesh.receiveShadow = true; // Ativar sombras na pista
    scene.add(trackMesh);
}

function createGrassPlane() {
    const width = (trackBounds.maxX - trackBounds.minX) * 0.6;
    const height = (trackBounds.maxY - trackBounds.minY) * 0.6;
    const planeGeometry = new THREE.PlaneGeometry(width, height);
    const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, side: THREE.DoubleSide });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.set(
        (trackBounds.maxX + trackBounds.minX) * 0.5 * 0.5,
        (trackBounds.maxY + trackBounds.minY) * -0.5 * 0.5,
        -1
    );
    plane.receiveShadow = true;
    scene.add(plane);
}

function addTrackBorders() {
    const offsetDistance = 10; // Distância das bordas
    const rectangleWidth = 5;
    const rectangleHeight = 2;
    const points = curve.getPoints(700);
    let colorToggle = true;

    points.forEach((currentPoint, i) => {
        if (i + 1 < points.length) {
            const nextPoint = points[i + 1];
            const tangent = nextPoint.clone().sub(currentPoint).normalize();
            const normal = new THREE.Vector3(-tangent.y, tangent.x, 0);

            const leftPosition = currentPoint.clone().add(normal.clone().multiplyScalar(offsetDistance));
            const rightPosition = currentPoint.clone().add(normal.clone().multiplyScalar(-offsetDistance));

            createBorderRectangle(leftPosition, tangent, rectangleWidth, rectangleHeight, colorToggle ? 0xffffff : 0xff0000);
            createBorderRectangle(rightPosition, tangent, rectangleWidth, rectangleHeight, colorToggle ? 0xffffff : 0xff0000);

            colorToggle = !colorToggle;
        }
    });
}

function createBorderRectangle(position, tangent, width, height, color) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });

    const rectangle = new THREE.Mesh(geometry, material);
    rectangle.rotation.z = Math.atan2(tangent.y, tangent.x);
    rectangle.position.set(position.x, position.y, position.z + 0.1);
    scene.add(rectangle);
}

function addDashedLine() {
    const points = curve.getPoints(700);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 3, gapSize: 10 });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    scene.add(line);
}

// ==========================
// Carregar o Veículo
// ==========================
const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load("/cars/f1_car.glb", function (gltf) {
    vehicle = gltf.scene;
    vehicle.scale.set(3, 3, 3);
    vehicle.rotation.set(Math.PI / 2, 0, Math.PI);
    vehicle.castShadow = true;
    scene.add(vehicle);
});

// ==========================
// Atualizar Posição do Veículo
// ==========================
function updateVehiclePosition() {
    if (!vehicle || !curve) return;

    progress += 0.001;
    if (progress > 1) progress = 0;

    const position = curve.getPointAt(progress);
    const tangent = curve.getTangentAt(progress);

    vehicle.position.copy(position);

    const lookAtMatrix = new THREE.Matrix4();
    lookAtMatrix.lookAt(position.clone().add(tangent), position, new THREE.Vector3(0, 0, 1));
    vehicle.quaternion.setFromRotationMatrix(lookAtMatrix);
}

// ==========================
// Função de Animação
// ==========================
function animate() {
    requestAnimationFrame(animate);
    updateVehiclePosition();
    controls.update();
    renderer.render(scene, camera);
}

animate();