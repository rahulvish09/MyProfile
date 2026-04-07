// solar-bg.js
(function () {
    const canvas = document.getElementById('solar-canvas');
    if (!canvas) return;
  
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 40;
  
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
    // ─── Solar Particles (Sunlight) ───
    const solarCount = 1500;
    const solarGeometry = new THREE.BufferGeometry();
    const solarPositions = new Float32Array(solarCount * 3);
    const solarVelocities = [];
  
    for (let i = 0; i < solarCount; i++) {
      solarPositions[i * 3] = (Math.random() - 0.5) * 100;
      solarPositions[i * 3 + 1] = Math.random() * 50 + 20; // Start high
      solarPositions[i * 3 + 2] = (Math.random() - 0.5) * 50;
      
      solarVelocities.push({
        y: -1 * (Math.random() * 0.1 + 0.05),
        x: (Math.random() - 0.5) * 0.02
      });
    }
  
    solarGeometry.setAttribute('position', new THREE.BufferAttribute(solarPositions, 3));
    
    // Create a circular glowing texture for particles (saves generating an image)
    const circleCanvas = document.createElement('canvas');
    circleCanvas.width = 32;
    circleCanvas.height = 32;
    const context = circleCanvas.getContext('2d');
    const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,200,50,0.8)');
    gradient.addColorStop(1, 'rgba(255,100,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 32);
    const solarTexture = new THREE.CanvasTexture(circleCanvas);
  
    const solarMaterial = new THREE.PointsMaterial({
      size: 1.5,
      map: solarTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0xffdd44
    });
  
    const solarSystem = new THREE.Points(solarGeometry, solarMaterial);
    scene.add(solarSystem);
  
    // ─── Water Particles (Purified Water) ───
    const waterCount = 2000;
    const waterGeometry = new THREE.BufferGeometry();
    const waterPositions = new Float32Array(waterCount * 3);
    const waterVelocities = [];
  
    for (let i = 0; i < waterCount; i++) {
        // Water flows from middle-bottomwards and narrows
        waterPositions[i * 3] = (Math.random() - 0.5) * 30;
        waterPositions[i * 3 + 1] = (Math.random() - 0.5) * -50 - 10;
        waterPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        
        waterVelocities.push({
          y: -1 * (Math.random() * 0.2 + 0.15) // Falls faster than sunlight
        });
    }
  
    waterGeometry.setAttribute('position', new THREE.BufferAttribute(waterPositions, 3));
  
    const waterCanvas = document.createElement('canvas');
    waterCanvas.width = 32;
    waterCanvas.height = 32;
    const wCtx = waterCanvas.getContext('2d');
    const wGradient = wCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    wGradient.addColorStop(0, 'rgba(255,255,255,1)');
    wGradient.addColorStop(0.3, 'rgba(40,150,255,0.8)');
    wGradient.addColorStop(1, 'rgba(0,50,255,0)');
    wCtx.fillStyle = wGradient;
    wCtx.fillRect(0, 0, 32, 32);
    const waterTexture = new THREE.CanvasTexture(waterCanvas);
  
    const waterMaterial = new THREE.PointsMaterial({
      size: 1.2,
      map: waterTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x44aaff
    });
  
    const waterSystem = new THREE.Points(waterGeometry, waterMaterial);
    scene.add(waterSystem);
  
    // ─── Animation Loop ───
    function animate() {
      requestAnimationFrame(animate);
  
      // Animate Solar
      const solarPos = solarGeometry.attributes.position.array;
      for (let i = 0; i < solarCount; i++) {
        solarPos[i * 3 + 1] += solarVelocities[i].y;
        solarPos[i * 3] += solarVelocities[i].x;
        
        // Reset sunlight if it hits the "filter" line (y = 0)
        if (solarPos[i * 3 + 1] < -10) {
            solarPos[i * 3 + 1] = 50 + Math.random() * 10;
            solarPos[i * 3] = (Math.random() - 0.5) * 100;
        }
      }
      solarGeometry.attributes.position.needsUpdate = true;
  
      // Animate Water
      const waterPos = waterGeometry.attributes.position.array;
      for (let i = 0; i < waterCount; i++) {
        waterPos[i * 3 + 1] += waterVelocities[i].y;
        
        // Push inwards mildly to form a column
        if(waterPos[i * 3] > 0) waterPos[i * 3] -= 0.02;
        if(waterPos[i * 3] < 0) waterPos[i * 3] += 0.02;
  
        // Reset water to the "filter" line
        if (waterPos[i * 3 + 1] < -50) {
            waterPos[i * 3 + 1] = -5 + Math.random() * 5;
            waterPos[i * 3] = (Math.random() - 0.5) * 30;
        }
      }
      waterGeometry.attributes.position.needsUpdate = true;
  
      // Slow panoramic rotation
      scene.rotation.y += 0.001;
      
      renderer.render(scene, camera);
    }
  
    animate();
  
    // Handle Resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  
  })();
