function typeTextWithCursor(element, text, typingSpeed = 100) {
    // Create cursor inline
    const cursor = document.createElement("span"); 
    cursor.textContent = "|"; // Cursor symbol
    cursor.style.display = "inline-block";
    cursor.style.animation = "blink 0.9s steps(2) infinite"; // Apply blink animation
    element.textContent = ""; // Clear existing text
    element.appendChild(cursor); // Add cursor to the element

    let index = 0;
    const typeInterval = setInterval(() => {
        if (index < text.length) {
            // Add each character sequentially
            element.textContent = text.slice(0, index + 1); 
            element.appendChild(cursor); // Ensure cursor stays at the end
            index++;
        } else {
            // Keep cursor blinking at the end and stop the typing
            clearInterval(typeInterval); 
        }
    }, typingSpeed);
}

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
    const smoothFactors = []; // Array to hold individual smooth factors
    const baseColor = 0xFFFFFF; // Changed to a more metallic color

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
        const geometry = new THREE.SphereGeometry(pos.size, 64, 64); // Increased segments for smoother spheres
        const material = new THREE.MeshStandardMaterial({
            color: baseColor,
            emissive: 0x333333,
            roughness: 0.8,    // Lower roughness for shinier surfaces
            metalness: 1.0,     // Higher metalness for more reflectivity
            transparent: true,
            opacity: 1
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(pos.x, pos.y, 0);
        scene.add(sphere);
        bubbles.push(sphere);
        originalPositions.push({ x: pos.x, y: pos.y, z: 0 });
        directions.push(randomDirection());
        radii.push(pos.size);
        smoothFactors.push(0.005 + Math.random() * 0.005); // Assign a smooth factor between 0.005 and 0.01
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

    // Adjusted parameters for freer movement and smoothness
    const maxDisplacementHovered = 12;     // Increased for larger movement
    const maxDisplacementNeighbor = 8;    // Increased for larger movement
    const neighborDistance = 7;           // Slightly larger neighbor radius

    const idleAmplitude = 0.25;            // Slightly increased idle amplitude
    const idleScaleAmplitude = 0.1;        // Slightly increased idle scale amplitude

    const collisionRepelFactor = 0.1;     // Slightly less strong to reduce jitter

    function animate() {
        requestAnimationFrame(animate);
        time += 0.01;

        const targetPositions = [];
        const targetScales = [];

        if (!hoverActive || !hoveredBubble) {
            // No hovering: all idle with individual smooth factors
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
                    targetScales.push(1.5); // Increased scale for more prominence
                } else if (dist < neighborDistance) {
                    const dir = directions[i];
                    const neighborX = orig.x + dir.dx * maxDisplacementNeighbor;
                    const neighborY = orig.y + dir.dy * maxDisplacementNeighbor;
                    targetPositions.push({ x: neighborX, y: neighborY });
                    targetScales.push(1.3); // Increased scale for neighbors
                } else {
                    const idleX = orig.x + Math.sin(time + i) * (idleAmplitude * 0.5);
                    const idleY = orig.y + Math.cos(time + i) * (idleAmplitude * 0.5);
                    const ts = 1 + Math.sin(time + i) * (idleScaleAmplitude * 0.5);
                    targetPositions.push({ x: idleX, y: idleY });
                    targetScales.push(ts);
                }
            }
        }

        // Iterate through each bubble and apply individual smooth factors
        for (let i = 0; i < bubbles.length; i++) {
            const bubble = bubbles[i];
            const tp = targetPositions[i];
            const ts = targetScales[i];
            const sf = smoothFactors[i]; // Individual smooth factor

            // Smoothly interpolate position
            bubble.position.x += (tp.x - bubble.position.x) * sf;
            bubble.position.y += (tp.y - bubble.position.y) * sf;

            // Smoothly interpolate scale
            bubble.scale.x += (ts - bubble.scale.x) * sf;
            bubble.scale.y += (ts - bubble.scale.y) * sf;
            bubble.scale.z += (ts - bubble.scale.z) * sf;
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
    const helloElement = document.querySelector(".hello"); 
    const text = "Hello";

    if (helloElement) {
        // Optional: Hide the element initially if you want to trigger on scroll
        helloElement.style.visibility = "hidden";

        // Intersection Observer Options
        const observerOptions = {
            root: null, // viewport
            threshold: 0.5 // 50% of the element is visible
        };

        // Callback for Intersection Observer
        function observerCallback(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    helloElement.style.visibility = "visible"; // Show the element
                    typeTextWithCursor(helloElement, text, 150); // Start typing with desired speed
                    observer.unobserve(helloElement); // Stop observing after animation
                }
            });
        }

        // Create the Intersection Observer
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        observer.observe(helloElement);
    } 


    const roles = ["researcher", "designer", "developer"]; // Roles to cycle through
    const roleElement = document.querySelector(".role"); // Target element

    if (roleElement) {
        // Initialize the typing effect
        typeRoles(roles, roleElement);
    }
    


});

/**
 * Function to cycle through roles with typing and deleting animations
 * @param {Array} roles - Array of role strings to display
 * @param {HTMLElement} element - The DOM element where the roles will be displayed
 */
 function typeRoles(roles, element) {
    let currentRoleIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    const typingSpeed = 150; // Speed of typing in ms
    const deletingSpeed = 100; // Speed of deleting in ms
    const delayBetweenRoles = 1500; // Delay before typing next role in ms

    // Create and append cursor
    const cursor = document.createElement("span");
    cursor.classList.add("cursor");
    element.appendChild(cursor);

    function type() {
        const currentRole = roles[currentRoleIndex];
        let displayedText = currentRole.substring(0, currentCharIndex);
        element.textContent = displayedText;
        element.appendChild(cursor); // Re-append cursor after updating text

        if (!isDeleting) {
            currentCharIndex++;
            if (currentCharIndex > currentRole.length) {
                isDeleting = true;
                setTimeout(type, delayBetweenRoles); // Pause before starting to delete
                return;
            }
        } else {
            currentCharIndex--;
            if (currentCharIndex < 0) {
                isDeleting = false;
                currentRoleIndex = (currentRoleIndex + 1) % roles.length; // Move to next role
                setTimeout(type, 500); // Brief pause before typing next role
                return;
            }
        }

        const speed = isDeleting ? deletingSpeed : typingSpeed;
        setTimeout(type, speed);
    }

    type(); // Start the typing effect
}