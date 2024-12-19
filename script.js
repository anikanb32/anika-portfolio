document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav ul');
    let menuOpen = false;

    menuToggle.addEventListener('click', () => {
        menuOpen = !menuOpen;
        if (menuOpen) {
            navList.classList.add('open');
        } else {
            navList.classList.remove('open');
        }
    });

    // Simple scroll-based reveal animations
    const elementsToReveal = document.querySelectorAll('.portfolio-item, .about p, .contact p, .social-links li');
    elementsToReveal.forEach(el => el.classList.add('fade-in'));

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        elementsToReveal.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - 60) {
                el.classList.add('visible');
            }
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    // THREE.JS SETUP
    const container = document.querySelector('.three-container');
    const hero = document.querySelector('.hero');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        45,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    window.addEventListener('resize', () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    });

    const bubblePositions = [
        { x: 0,   y: 0,   size: 2 },
        { x: 4,   y: 0,   size: 1.5 },
        { x: -4,  y: 0,   size: 1.5 },
        { x: 0,   y: 4,   size: 1.5 },
        { x: 0,   y: -4,  size: 1.5 },
        { x: 2,   y: 2,   size: 2 },
        { x: -2,  y: 2,   size: 2 },
        { x: 2,   y: -2,  size: 2 },
        { x: -2,  y: -2,  size: 2 },
        { x: 6,   y: 2,   size: 1.5 },
        { x: 6,   y: -2,  size: 1.5 },
        { x: -6,  y: 2,   size: 1.5 },
        { x: -6,  y: -2,  size: 1.5 },
        { x: 2,   y: 6,   size: 1.5 },
        { x: -2,  y: 6,   size: 1.5 },
        { x: 2,   y: -6,  size: 1.5 },
        { x: -2,  y: -6,  size: 1.5 },
        { x: 4,   y: 4,   size: 1 },
        { x: -4,  y: 4,   size: 1 },
        { x: 4,   y: -4,  size: 1 },
        { x: -4,  y: -4,  size: 1 },
        { x: 7,   y: 0,   size: 1 },
        { x: -7,  y: 0,   size: 1 },
        { x: 0,   y: 7,   size: 1 },
        { x: 0,   y: -7,  size: 1 }
    ];

    const bubbles = [];
    const originalPositions = [];
    const directions = [];
    const radii = [];
    const baseColor = 0x8D918D; //C0C0C0;

    function randomDirection() {
        const angle = Math.random() * Math.PI * 2;
        return { dx: Math.cos(angle), dy: Math.sin(angle) };
    }

    // Add a soft lighting setup
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 50);
    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    bubblePositions.forEach(pos => {
        const geometry = new THREE.SphereGeometry(pos.size, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: 0x000000,
            roughness: 0.7,    // Very reflective 0.6
            metalness: 0.8,    // Metallic sheen
            transparent: true,
            opacity: 1,
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(pos.x, pos.y, 0);
        sphere.scale.set(0.01, 0.01, 0.01); // start small for smooth appear
        scene.add(sphere);
        bubbles.push(sphere);
        originalPositions.push({ x: pos.x, y: pos.y, z: 0 });
        directions.push(randomDirection());
        radii.push(pos.size);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoverActive = false;
    let hoveredBubble = null;
    let time = 0; 

    hero.addEventListener('mouseenter', () => {
        hoverActive = true;
    });

    hero.addEventListener('mouseleave', () => {
        hoverActive = false;
        hoveredBubble = null;
    });

    hero.addEventListener('mousemove', (e) => {
        if (!hoverActive) return;
        const rect = hero.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        mouse.set(x, y);

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(bubbles);

        // If currently hovered bubble is still in intersects, keep it
        if (hoveredBubble && intersects.some(intersect => intersect.object === hoveredBubble)) {
            return;
        }

        // Otherwise, choose a new bubble if available
        if (intersects.length > 0) {
            hoveredBubble = intersects[0].object;
        } else {
            hoveredBubble = null;
        }
    });

    const maxDisplacementHovered = 5;
    const maxDisplacementNeighbor = 3;
    const neighborDistance = 5;

    const idleAmplitude = 0.2;
    const idleScaleAmplitude = 0.08;

    const collisionRepelFactor = 0.3;

    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        const targetPositions = [];
        const targetScales = [];

        if (!hoverActive || !hoveredBubble) {
            // No hovering: all idle
            for (let i = 0; i < bubbles.length; i++) {
                const orig = originalPositions[i];
                const idleX = orig.x + Math.sin(time + i) * idleAmplitude;
                const idleY = orig.y + Math.cos(time + i) * idleAmplitude;
                const ts = 1 + Math.sin(time + i) * idleScaleAmplitude;

                targetPositions.push({ x: idleX, y: idleY });
                targetScales.push(ts);
            }
        } else {
            // Hovering
            const hoveredIndex = bubbles.indexOf(hoveredBubble);
            const hoveredOrig = originalPositions[hoveredIndex];
            const hoveredDir = directions[hoveredIndex];
            const hoveredX = hoveredOrig.x + hoveredDir.dx * maxDisplacementHovered;
            const hoveredY = hoveredOrig.y + hoveredDir.dy * maxDisplacementHovered;

            for (let i = 0; i < bubbles.length; i++) {
                const orig = originalPositions[i];
                const dx = orig.x - hoveredOrig.x;
                const dy = orig.y - hoveredOrig.y;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (i === hoveredIndex) {
                    targetPositions.push({ x: hoveredX, y: hoveredY });
                    targetScales.push(1.3);
                } else if (dist < neighborDistance) {
                    const dir = directions[i];
                    const neighborX = orig.x + dir.dx * maxDisplacementNeighbor;
                    const neighborY = orig.y + dir.dy * maxDisplacementNeighbor;
                    targetPositions.push({ x: neighborX, y: neighborY });
                    targetScales.push(1.15);
                } else {
                    const idleX = orig.x + Math.sin(time + i) * (idleAmplitude * 0.5);
                    const idleY = orig.y + Math.cos(time + i) * (idleAmplitude * 0.5);
                    const ts = 1 + Math.sin(time + i) * (idleScaleAmplitude * 0.5);
                    targetPositions.push({ x: idleX, y: idleY });
                    targetScales.push(ts);
                }
            }
        }

        const smoothFactor = 0.02; //0.05

        // Lerp towards target positions and scales
        for (let i = 0; i < bubbles.length; i++) {
            const bubble = bubbles[i];
            const tp = targetPositions[i];
            const ts = targetScales[i];

            bubble.position.x += (tp.x - bubble.position.x) * smoothFactor;
            bubble.position.y += (tp.y - bubble.position.y) * smoothFactor;

            bubble.scale.x += (ts - bubble.scale.x) * smoothFactor;
            bubble.scale.y += (ts - bubble.scale.y) * smoothFactor;
            bubble.scale.z += (ts - bubble.scale.z) * smoothFactor;
        }

        // Collision avoidance
        for (let i = 0; i < bubbles.length; i++) {
            for (let j = i + 1; j < bubbles.length; j++) {
                const b1 = bubbles[i];
                const b2 = bubbles[j];
                const dx = b2.position.x - b1.position.x;
                const dy = b2.position.y - b1.position.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                const minDist = radii[i] + radii[j];
                if (dist < minDist && dist > 0) {
                    const overlap = (minDist - dist) * collisionRepelFactor;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    b1.position.x -= nx * (overlap * 0.5);
                    b1.position.y -= ny * (overlap * 0.5);
                    b2.position.x += nx * (overlap * 0.5);
                    b2.position.y += ny * (overlap * 0.5);
                }
            }
        }

        renderer.render(scene, camera);
    }
    animate();
});
