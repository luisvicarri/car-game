// Configuração básica da cena
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.setClearColor(0x111111, 1); // Fundo escuro para melhor contraste

// Controles da câmera
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.update();

// Iluminação
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(50, 100, 50);
scene.add(light);

// Carregar o SVG
const loader = new THREE.SVGLoader();
loader.load("interlagos-track.svg", function (data) {
    const paths = data.paths;
    const trackPoints = [];

    paths.forEach((path) => {
        const shapes = path.toShapes(true);
        shapes.forEach((shape) => {
            trackPoints.push(...shape.getPoints(300)); // Mais pontos para suavidade
        });
    });

    // Criar a curva do traçado da pista
    const curve = new THREE.CatmullRomCurve3(
        trackPoints.map(p => new THREE.Vector3(p.x * 0.5, -p.y * 0.5, 0)),
        true // Fecha a curva
    );

    // Criar um perfil retangular CORRETAMENTE ORIENTADO para a pista
    const trackWidth = 20; // Largura da pista
    const trackHeight = 2; // Pequena altura para garantir visibilidade

    const trackShape = new THREE.Shape();
    trackShape.moveTo(0, -trackWidth / 2);
    trackShape.lineTo(0, trackWidth / 2);
    trackShape.lineTo(trackHeight, trackWidth / 2);
    trackShape.lineTo(trackHeight, -trackWidth / 2);
    trackShape.lineTo(0, -trackWidth / 2);

    // Criar a geometria da pista extrudada ao longo da curva
    const extrudeSettings = { steps: 300, bevelEnabled: false, extrudePath: curve };
    const trackGeometry = new THREE.ExtrudeGeometry(trackShape, extrudeSettings);
    const trackMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500, side: THREE.DoubleSide });

    const trackMesh = new THREE.Mesh(trackGeometry, trackMaterial);
    scene.add(trackMesh);

});

// Posicionamento da câmera
camera.position.set(0, 300, 500); // Melhor ângulo para ver a pista
camera.lookAt(0, 0, 0);

// Função de animação
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();