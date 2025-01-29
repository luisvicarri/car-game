const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-200, 200, 200, -200, 0.1, 1000);
camera.position.set(0, 0, 500);
camera.lookAt(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

renderer.setClearColor(0xeeeeee, 1);

const loader = new THREE.SVGLoader();

loader.load("interlagos-track.svg", function (data) {
    const paths = data.paths;
    const group = new THREE.Group();

    paths.forEach((path) => {
        const shapes = path.toShapes(true);
        shapes.forEach((shape) => {
            const material = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
            const geometry = new THREE.BufferGeometry().setFromPoints(shape.getPoints());
            const line = new THREE.Line(geometry, material);
            group.add(line);

        });
    });

    group.scale.set(0.2, -0.2, 1);
    group.position.set(0, 0, 0);

    scene.add(group);

    // Criar e adicionar o carro na cena
    const car = createCar();
    car.position.set(0, 0, 0); // Posicionar na origem
    scene.add(car);
});

camera.position.set(0, 0, 500);
camera.lookAt(0, 0, 0);

// Função para criar o carro
function createCar() {
    const car = new THREE.Group();

    // Corpo principal do carro
    const bodyGeometry = new THREE.BoxGeometry(10, 5, 5);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Vermelho
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    car.add(body);

    // Rodas (4 cilindros)
    const wheelGeometry = new THREE.CylinderGeometry(1, 1, 2, 16);
    const wheelMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Preto
    const wheelPositions = [
        [-4, -3, 2], [4, -3, 2], // Frente
        [-4, -3, -2], [4, -3, -2] // Traseira
    ];
    wheelPositions.forEach(([x, y, z]) => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2; // Girar para alinhar com o eixo X
        wheel.position.set(x, y, z);
        car.add(wheel);
    });

    // Cabeçote do carro
    const headGeometry = new THREE.BoxGeometry(4, 2, 3);
    const headMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Verde
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0, 3, 0);
    car.add(head);

    return car;
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();