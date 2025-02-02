// Configuração básica da cena
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Habilitar sombras
document.body.appendChild(renderer.domElement);

renderer.setClearColor(0x111111, 1);

// Controles da câmera
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

// Iluminação simulando o sol, ajustada para luz mais natural
const sunLight = new THREE.DirectionalLight(0xFFD1A9, 0.7); // Cor suave e intensidade ajustada
sunLight.position.set(300, 300, 300); // Posicionar a luz "do sol"
sunLight.castShadow = true; // Habilitar sombras
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 1000;
scene.add(sunLight);

// // Adicionar helper para visualizar a luz
// const lightHelper = new THREE.DirectionalLightHelper(sunLight, 50);
// scene.add(lightHelper);

// Luz ambiente para suavizar o contraste
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

// Variáveis globais
let vehicle;
let curve;
let progress = 0;
// Variáveis globais para armazenar limites da pista
let trackBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };

// Carregar o SVG da pista
const loader = new THREE.SVGLoader();

// Adicionar retângulos para contorno da pista
function addTrackBorders() {
    const offsetDistance = 10; // Distância do contorno para as bordas da pista
    const rectangleWidth = 5; // Largura de cada retângulo
    const rectangleHeight = 2; // Altura de cada retângulo
    const points = curve.getPoints(700); // Dividir a curva em pontos
    let colorToggle = true; // Alternar entre vermelho e branco

    points.forEach((currentPoint, i) => {
        if (i + 1 < points.length) {
            const nextPoint = points[i + 1]; // Próximo ponto
            const tangent = nextPoint.clone().sub(currentPoint).normalize(); // Vetor tangente
            const normal = new THREE.Vector3(-tangent.y, tangent.x, 0); // Vetor normal (perpendicular)

            // Calcular posição para os retângulos das bordas esquerda e direita
            const leftPosition = currentPoint.clone().add(normal.clone().multiplyScalar(offsetDistance));
            const rightPosition = currentPoint.clone().add(normal.clone().multiplyScalar(-offsetDistance));

            // Criar retângulos
            createBorderRectangle(leftPosition, tangent, rectangleWidth, rectangleHeight, colorToggle ? 0xffffff : 0xff0000); // Esquerda
            createBorderRectangle(rightPosition, tangent, rectangleWidth, rectangleHeight, colorToggle ? 0xffffff : 0xff0000); // Direita

            // Alternar cor
            colorToggle = !colorToggle;
        }
    });
}

// Função para criar um retângulo e adicionar ao cenário
function createBorderRectangle(position, tangent, width, height, color) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshStandardMaterial({ color, side: THREE.DoubleSide });

    const rectangle = new THREE.Mesh(geometry, material);

    // Alinhar o retângulo com a tangente
    const angle = Math.atan2(tangent.y, tangent.x);
    rectangle.rotation.z = angle;

    // Posicionar no ponto correto
    rectangle.position.set(position.x, position.y, position.z + 0.1); // Leve elevação para evitar sobreposição com a pista
    scene.add(rectangle);
}

// Função para adicionar o traçado pontilhado
function addDashedLine() {
    const points = curve.getPoints(700); // Dividir a curva em pontos
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 3,
        gapSize: 10
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Necessário para o material pontilhado
    scene.add(line);
}

// Chamar a função para criar as bordas após carregar o circuito
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
                if (p.x < trackBounds.minX) trackBounds.minX = p.x;
                if (p.x > trackBounds.maxX) trackBounds.maxX = p.x;
                if (p.y < trackBounds.minY) trackBounds.minY = p.y;
                if (p.y > trackBounds.maxY) trackBounds.maxY = p.y;
            });
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
    trackMesh.receiveShadow = true; // Receber sombras
    scene.add(trackMesh);

    // Criar plano de gramado com base nos limites da pista
    createGrassPlane();

    // Adicionar as bordas da pista
    addTrackBorders();

    // Adicionar o traçado pontilhado
    addDashedLine();
});

// Função para criar um plano de gramado dinâmico
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
    plane.receiveShadow = true; // Receber sombras
    scene.add(plane);
}

// Importar veículo
const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load("/cars/f1_car.glb", function (gltf) {
    vehicle = gltf.scene;
    vehicle.scale.set(3, 3, 3);
    vehicle.rotation.set(Math.PI / 2, 0, Math.PI);
    vehicle.castShadow = true; // Projeta sombras
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