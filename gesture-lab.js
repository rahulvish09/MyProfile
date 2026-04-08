/* ============================================
   GESTURE-LAB.JS — Iron Man Hand Controls
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  const videoElement = document.getElementById('input_video');
  const canvasElement = document.getElementById('output_canvas');
  const canvasCtx = canvasElement.getContext('2d');
  const toggleBtn = document.getElementById('toggle-camera-btn');
  const placeholder = document.getElementById('camera-placeholder');
  const virtualCursor = document.getElementById('virtual-cursor');

  let camera = null;
  let isTracking = false;
  let isPinching = false;
  let lastHandY = null;

  // --- THREE.JS HOLOGRAPHIC OBJECT SETUP ---
  const scene3D = new THREE.Scene();
  const labViewport = document.getElementById('gesture-3d-canvas');
  const camera3D = new THREE.PerspectiveCamera(75, labViewport.clientWidth / labViewport.clientHeight, 0.1, 1000);
  const renderer3D = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer3D.setSize(labViewport.clientWidth, labViewport.clientHeight);
  labViewport.appendChild(renderer3D.domElement);

  // Create an Iron Man Arc-Reactor style geometry
  const geometry = new THREE.IcosahedronGeometry(2, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.8 });
  const hologramMesh = new THREE.Mesh(geometry, material);
  
  // Inner core
  const coreGeo = new THREE.OctahedronGeometry(1, 0);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  hologramMesh.add(coreMesh);
  
  scene3D.add(hologramMesh);
  camera3D.position.z = 5;

  let baseRotationSpeedX = 0.005;
  let baseRotationSpeedY = 0.005;

  function animate3D() {
    requestAnimationFrame(animate3D);
    if (!isTracking) {
      // Idle spin when no hands detected
      hologramMesh.rotation.x += baseRotationSpeedX;
      hologramMesh.rotation.y += baseRotationSpeedY;
    }
    renderer3D.render(scene3D, camera3D);
  }
  animate3D();

  // Handle resize for 3D
  window.addEventListener('resize', () => {
    if(!labViewport) return;
    camera3D.aspect = labViewport.clientWidth / labViewport.clientHeight;
    camera3D.updateProjectionMatrix();
    renderer3D.setSize(labViewport.clientWidth, labViewport.clientHeight);
  });

  // --- MEDIAPIPE HANDS SETUP ---
  const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }});

  hands.setOptions({
    maxNumHands: 1, // Focus on single hand for precise control
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
  });

  hands.onResults(onResults);

  function onResults(results) {
    // 1. Draw camera feed + Landmarks onto small Canvas
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      virtualCursor.style.display = 'block';
      const landmarks = results.multiHandLandmarks[0];
      
      // Draw bones visually on the webcam overlay
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00f0ff', lineWidth: 2});
      drawLandmarks(canvasCtx, landmarks, {color: '#ffffff', lineWidth: 1, radius: 2});

      // --- PAGE DOMINATION CONTROL ---
      // Get tip of Index Finger (8) and Thumb (4) and Middle (12)
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];
      const middleTip = landmarks[12];
      const wrist = landmarks[0];

      // Mirror X coordinates because webcam is mirrored
      const mappedX = (1 - indexTip.x) * window.innerWidth;
      const mappedY = indexTip.y * window.innerHeight;

      // Update virtual cursor position
      virtualCursor.style.left = `${mappedX}px`;
      virtualCursor.style.top = `${mappedY}px`;

      // ─── SNAP DETECTION ───
      // If Middle Finger tip is folded incredibly deeply into the palm base (wrist), but Index is straight.
      const snapDistance = Math.sqrt(Math.pow(middleTip.x - wrist.x, 2) + Math.pow(middleTip.y - wrist.y, 2));
      const indexExtend = Math.sqrt(Math.pow(indexTip.x - wrist.x, 2) + Math.pow(indexTip.y - wrist.y, 2));
      
      // If Middle is folded tightly and Index is extended
      if (snapDistance < 0.25 && indexExtend > 0.4) {
        // Trigger Shutdown!
        if (isTracking) toggleBtn.click(); // Stop camera via its native logic
        window.location.hash = "#home"; // Fly user back exactly to #home!
        return; // Halt further drawing loop frames instantly
      }

      // Calculate Pinch Distance
      const distance = Math.sqrt(Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2));

      // CLICK LOGIC: Pinch threshold
      if (distance < 0.05) {
        if (!isPinching) {
          isPinching = true;
          virtualCursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
          virtualCursor.style.backgroundColor = 'var(--accent-pink)';
          
          // Trigger a click at the coordinate!
          const elementToClick = document.elementFromPoint(mappedX, mappedY);
          if (elementToClick && typeof elementToClick.click === 'function') {
            // Flash element
            const originalBg = elementToClick.style.backgroundColor;
            elementToClick.style.backgroundColor = 'var(--accent-blue)';
            setTimeout(() => { elementToClick.style.backgroundColor = originalBg; }, 200);
            elementToClick.click();
          }
        }
      } else {
        if (isPinching) {
          isPinching = false;
          virtualCursor.style.transform = 'translate(-50%, -50%) scale(1)';
          virtualCursor.style.backgroundColor = 'var(--accent-blue)';
        }
      }

      // SLIDING/SCROLLING LOGIC: Tracking Index Finger Vertically
      if (distance > 0.1 && !isPinching) {
        if (lastHandY !== null) {
          const deltaY = indexTip.y - lastHandY;
          if (Math.abs(deltaY) > 0.005) { // Responsive deadzone
            // Scroll the window dynamically based on index finger!
            window.scrollBy({ top: deltaY * 3000, behavior: 'instant' });
          }
        }
        lastHandY = indexTip.y;
      } else {
        lastHandY = null; // Clear if pinched or lost
      }

      // --- 3D MANIPULATION LOGIC ---
      // Map hand position to holographic rotation
      // Center of screen is 0.5. Hand offset dictates rotation offset.
      const rotX = (wrist.y - 0.5) * Math.PI * 2;
      const rotY = ((1 - wrist.x) - 0.5) * Math.PI * 2;
      
      // Smooth interpolation for 3D model
      hologramMesh.rotation.x += (rotX - hologramMesh.rotation.x) * 0.1;
      hologramMesh.rotation.y += (rotY - hologramMesh.rotation.y) * 0.1;
      
      // Scale mapping based on Z distance of wrist
      const targetScale = Math.max(0.5, 1.5 - (Math.abs(wrist.z) * 5));
      hologramMesh.scale.x += (targetScale - hologramMesh.scale.x) * 0.1;
      hologramMesh.scale.y += (targetScale - hologramMesh.scale.y) * 0.1;
      hologramMesh.scale.z += (targetScale - hologramMesh.scale.z) * 0.1;

    } else {
      virtualCursor.style.display = 'none';
      lastHandY = null;
    }
    canvasCtx.restore();
  }

  // --- CAMERA TOGGLE LOGIC ---
  toggleBtn.addEventListener('click', () => {
    if (!isTracking) {
      toggleBtn.textContent = "Starting Camera...";
      toggleBtn.style.opacity = '0.7';

      camera = new Camera(videoElement, {
        onFrame: async () => {
          await hands.send({image: videoElement});
        },
        width: 640,
        height: 360
      });
      
      camera.start().then(() => {
        isTracking = true;
        toggleBtn.textContent = "Disable Hand Tracking";
        toggleBtn.classList.replace('btn-primary', 'btn-ghost');
        toggleBtn.style.opacity = '1';
        videoElement.style.display = 'block';
        placeholder.style.display = 'none';
      }).catch(err => {
        console.error(err);
        toggleBtn.textContent = "Error: Camera Denied";
      });
    } else {
      // STOP Camera
      camera.stop();
      isTracking = false;
      toggleBtn.textContent = "Enable Hand Tracking";
      toggleBtn.classList.replace('btn-ghost', 'btn-primary');
      videoElement.style.display = 'none';
      placeholder.style.display = 'flex';
      virtualCursor.style.display = 'none';
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      // Reset Hologram scale
      hologramMesh.scale.set(1, 1, 1);
    }
  });

});
