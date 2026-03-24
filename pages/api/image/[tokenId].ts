import { NextApiRequest, NextApiResponse } from 'next';

// Advanced mathematical generative art system inspired by shader mathematics
const generateNFTImageSVG = (tokenId: number): string => {
  // Seeded pseudo-random number generator for consistency
  class SeededRandom {
    private seed: number;
    
    constructor(seed: number) {
      this.seed = seed;
    }
    
    // Linear Congruential Generator for consistent randomness
    next(): number {
      this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
      return this.seed / 0x7fffffff;
    }
    
    // Random in range [min, max]
    range(min: number, max: number): number {
      return min + this.next() * (max - min);
    }
    
    // Random integer in range [min, max]
    int(min: number, max: number): number {
      return Math.floor(this.range(min, max + 1));
    }
  }
  
  const rng = new SeededRandom(tokenId);
  
  // Advanced shader-inspired mathematical functions
  const shaderFunctions = {
    // Multi-octave sine wave interference (inspired by shader code)
    plasmaField: (x: number, y: number, t: number, freq: number, octaves: number) => {
      let value = 0;
      let amplitude = 1;
      let frequency = Math.max(0.001, Math.min(1, freq)); // Clamp frequency
      const safeOctaves = Math.max(1, Math.min(10, octaves)); // Clamp octaves
      
      for (let i = 0; i < safeOctaves; i++) {
        // Complex sine wave interference pattern
        const nx = x * frequency;
        const ny = y * frequency;
        const wave1 = Math.sin(nx + t) * Math.cos(ny + t * 0.7);
        const wave2 = Math.sin(nx * 1.3 + ny * 0.8 + t * 1.2) * 0.5;
        const wave3 = Math.sin((nx + ny) * 0.5 + t * 0.9) * 0.3;
        
        const waveSum = wave1 + wave2 + wave3;
        if (!isNaN(waveSum) && isFinite(waveSum)) {
          value += waveSum * amplitude;
        }
        amplitude *= 0.5;
        frequency *= 2;
      }
      return isNaN(value) || !isFinite(value) ? 0 : value;
    },
    
    // Distance field functions (SDF-inspired)
    distanceField: (x: number, y: number, centerX: number, centerY: number, radius: number) => {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy) - Math.max(0, radius);
      return isNaN(distance) || !isFinite(distance) ? 0 : distance;
    },
    
    // Fractal with rotation and scaling (more shader-like)
    rotationalFractal: (x: number, y: number, iterations: number, rotation: number) => {
      let zx = (x - 256) / 256;
      let zy = (y - 256) / 256;
      
      // Apply rotation
      const cos_r = Math.cos(rotation);
      const sin_r = Math.sin(rotation);
      const rx = zx * cos_r - zy * sin_r;
      const ry = zx * sin_r + zy * cos_r;
      zx = rx;
      zy = ry;
      
      for (let i = 0; i < iterations; i++) {
        const xtemp = zx * zx - zy * zy + rx * 0.5;
        zy = 2 * zx * zy + ry * 0.5;
        zx = xtemp;
        
        if (zx * zx + zy * zy > 4) return i / iterations;
      }
      return 1;
    },
    
    // Perlin-like noise with multiple octaves
    multiOctaveNoise: (x: number, y: number, scale: number, octaves: number, persistence: number) => {
      let value = 0;
      let amplitude = 1;
      let frequency = scale;
      let maxValue = 0;
      
      for (let i = 0; i < octaves; i++) {
        const nx = x * frequency;
        const ny = y * frequency;
        const noise = Math.sin(nx) * Math.cos(ny) + 
                     Math.sin(nx * 2.1) * Math.cos(ny * 2.3) * 0.5 +
                     Math.sin(nx * 0.7) * Math.cos(ny * 1.7) * 0.25;
        
        value += noise * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= 2;
      }
      
      return value / maxValue;
    },
    
    // Plasma-inspired energy field
    energyField: (x: number, y: number, t: number, centers: Array<{x: number, y: number, energy: number}>) => {
      let field = 0;
      
      centers.forEach(center => {
        const dx = x - center.x;
        const dy = y - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const influence = center.energy / (1 + dist * 0.01);
        
        // Add wave interference
        field += Math.sin(dist * 0.1 + t) * influence;
        field += Math.cos(dist * 0.07 + t * 1.3) * influence * 0.5;
      });
      
      return field;
    },
    
    // Cellular automata-like function
    cellular: (x: number, y: number, points: Array<{x: number, y: number}>) => {
      let minDistance = Infinity;
      for (const point of points) {
        const dx = x - point.x;
        const dy = y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        minDistance = Math.min(minDistance, distance);
      }
      return isNaN(minDistance) || !isFinite(minDistance) ? 0 : minDistance;
    },
    
    // Fluid dynamics simulation (inspired by Phosphor shader)
    fluidTurbulence: (x: number, y: number, t: number, intensity: number) => {
      let turbulence = 0;
      let amplitude = intensity;
      let frequency = 0.01;
      
      // Apply turbulence at multiple frequencies (like the Phosphor shader)
      for (let i = 1; i <= 6; i++) {
        const nx = x * frequency;
        const ny = y * frequency;
        
        // Multi-octave sine waves with phase shifting
        const wave1 = Math.sin(nx + t + i) * Math.cos(ny + t * 0.7 + i);
        const wave2 = Math.sin(nx * 1.3 + ny * 0.8 + t * 1.2 + i) * 0.5;
        const wave3 = Math.sin((nx + ny) * 0.5 + t * 0.9 + i) * 0.3;
        
        turbulence += (wave1 + wave2 + wave3) * amplitude / i;
        amplitude *= 0.6;
        frequency *= 2.1;
      }
      
      return isNaN(turbulence) || !isFinite(turbulence) ? 0 : turbulence;
    },
    
    // Volumetric particle field (Phosphor-inspired)
    volumetricField: (x: number, y: number, centerX: number, centerY: number, t: number, radius: number) => {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Distance to ring (hollow sphere in 2D)
      const ringDistance = Math.abs(distance - radius);
      
      // Rotation axis with trailing effect
      const rotationPhase = t - ringDistance * 0.02; // Trailing based on distance
      const rotationAxis = {
        x: Math.cos(rotationPhase + 4),
        y: Math.cos(rotationPhase + 2),
        z: Math.cos(rotationPhase)
      };
      
      // Apply turbulence
      const turbulence = shaderFunctions.fluidTurbulence(x, y, t, 0.5);
      
      // Volumetric attenuation (closer = brighter)
      const attenuation = 1.0 / (ringDistance * 0.1 + 0.01);
      
      // Combine effects
      const field = attenuation * (1 + turbulence * 0.3) * Math.max(0, 1 - ringDistance / (radius * 0.5));
      
      return isNaN(field) || !isFinite(field) ? 0 : Math.max(0, field);
    },
    
    // Glowing particle system
    glowingParticles: (x: number, y: number, t: number, particles: Array<{x: number, y: number, intensity: number}>) => {
      let glow = 0;
      
      for (const particle of particles) {
        const dx = x - particle.x;
        const dy = y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Soft falloff with pulsing
        const pulse = 0.8 + 0.2 * Math.sin(t * 3 + particle.x * 0.01);
        const falloff = particle.intensity / (distance * 0.05 + 0.01) * pulse;
        
        glow += Math.max(0, falloff);
      }
      
      return isNaN(glow) || !isFinite(glow) ? 0 : Math.min(glow, 10); // Cap the glow
    }
  };
  
  // Generate Plasma-themed color palette (green spectrum focused)
  const generatePlasmaColorPalette = () => {
    const baseHue = (tokenId * 137.508) % 360; // Golden angle for distribution
    // Bias toward green spectrum (80-200 degrees) for Plasma theme
    const plasmaHue = ((baseHue + 120) % 120) + 80;
    const saturation = Math.max(70, Math.min(95, rng.range(70, 95)));
    const lightness = Math.max(35, Math.min(75, rng.range(35, 75)));
    
    // Safety check for NaN values
    const safeHue = isNaN(plasmaHue) ? 120 : plasmaHue;
    const safeSat = isNaN(saturation) ? 80 : saturation;
    const safeLight = isNaN(lightness) ? 50 : lightness;
    
    // Create complementary colors within the plasma spectrum
    return {
      primary: `hsl(${safeHue}, ${safeSat}%, ${safeLight}%)`,
      secondary: `hsl(${safeHue + 30}, ${safeSat * 0.8}%, ${safeLight + 15}%)`,
      accent: `hsl(${safeHue - 20}, ${safeSat * 1.1}%, ${safeLight - 10}%)`,
      energy: `hsl(${safeHue + 40}, ${safeSat * 0.9}%, ${safeLight + 25}%)`,
      background1: `hsl(${safeHue - 10}, ${safeSat * 0.2}%, ${safeLight * 0.15}%)`,
      background2: `hsl(${safeHue + 15}, ${safeSat * 0.4}%, ${safeLight * 0.3}%)`
    };
  };
  
  const palette = generatePlasmaColorPalette();
  

  // Generate shader-inspired pattern based on token characteristics
  const generatePlasmaPattern = (): string => {
    const patternType = tokenId % 7; // Increased to 7 for new fluid patterns
    let pattern = '';
    const t = tokenId * 0.1; // Time-like parameter for animation-style effects
    
    switch (patternType) {
      case 0: // Flowing particle streams (pure fluid)
        {
          const numParticleStreams = rng.int(4, 8);
          
          for (let stream = 0; stream < numParticleStreams; stream++) {
            const startX = rng.range(50, 462);
            const startY = rng.range(50, 462);
            const streamIntensity = rng.range(0.4, 0.9);
            
            // Create particle trail path
            let particlePath = `M ${startX} ${startY}`;
            let currentX = startX;
            let currentY = startY;
            
            for (let step = 0; step < 80; step++) {
              const turbulence = shaderFunctions.fluidTurbulence(currentX, currentY, tokenId * 0.1 + stream, 0.6);
              const flowDirection = turbulence * Math.PI * 4 + step * 0.08;
              
              currentX += Math.cos(flowDirection) * 6;
              currentY += Math.sin(flowDirection) * 6;
              
              // Boundary wrapping for continuous flow
              if (currentX < 50) currentX = 462;
              if (currentX > 462) currentX = 50;
              if (currentY < 50) currentY = 462;
              if (currentY > 462) currentY = 50;
              
              particlePath += ` L ${currentX} ${currentY}`;
            }
            
            const streamId = `particle_stream_${stream}`;
            pattern += `
              <defs>
                <linearGradient id="${streamId}">
                  <stop offset="0%" style="stop-color:${palette.energy};stop-opacity:0" />
                  <stop offset="20%" style="stop-color:${palette.primary};stop-opacity:${streamIntensity}" />
                  <stop offset="80%" style="stop-color:${palette.secondary};stop-opacity:${streamIntensity * 0.8}" />
                  <stop offset="100%" style="stop-color:${palette.accent};stop-opacity:0" />
                </linearGradient>
              </defs>
              <path d="${particlePath}" fill="none" stroke="url(#${streamId})" 
                    stroke-width="${rng.range(0.8, 2.5)}" stroke-linecap="round" 
                    opacity="${streamIntensity}" filter="url(#plasma-glow)" />`;
            }
          }
          break;
        
      case 1: // 3D Swirling particle vortex (spatial depth)
        {
          const vortexCenterX = 256 + rng.range(-80, 80);
          const vortexCenterY = 256 + rng.range(-80, 80);
          const numSpirals = rng.int(4, 8);
          const numDepthLayers = 5; // Multiple depth layers for 3D effect
          
          for (let depthLayer = 0; depthLayer < numDepthLayers; depthLayer++) {
            const zDepth = depthLayer / numDepthLayers; // 0 = front, 1 = back
            const perspectiveScale = 1 - zDepth * 0.6; // Objects get smaller with distance
            const depthOpacity = 1 - zDepth * 0.7; // Objects get fainter with distance
            
            for (let spiral = 0; spiral < numSpirals; spiral++) {
              const spiralAngle = (spiral / numSpirals) * Math.PI * 2 + depthLayer * 0.3;
              let spiralPath = '';
              
              // Create 3D spiral with perspective
              for (let step = 0; step < 100; step++) {
                const radius = step * 1.8 * perspectiveScale;
                const angle = spiralAngle + step * 0.12;
                
                // Add 3D rotation effect - simulate spiral going into/out of screen
                const zRotation = Math.sin(angle * 0.5 + depthLayer) * 0.4;
                const perspectiveY = Math.cos(angle * 0.5 + depthLayer) * 0.3;
                
                const turbulence = shaderFunctions.fluidTurbulence(vortexCenterX, vortexCenterY, tokenId * 0.1 + spiral + depthLayer, 0.4);
                
                // Apply 3D transformations
                const baseX = vortexCenterX + Math.cos(angle + turbulence) * radius;
                const baseY = vortexCenterY + Math.sin(angle + turbulence) * radius;
                
                // Add perspective distortion
                const x = baseX + zRotation * radius * 0.3;
                const y = baseY + perspectiveY * radius * 0.2;
                
                if (step === 0) {
                  spiralPath = `M ${x} ${y}`;
                } else {
                  spiralPath += ` L ${x} ${y}`;
                }
                
                // Stop if we go out of bounds
                if (x < 20 || x > 492 || y < 20 || y > 492) break;
              }
              
              const spiralId = `vortex_3d_${depthLayer}_${spiral}`;
              const baseIntensity = rng.range(0.3, 0.7);
              const depthIntensity = baseIntensity * depthOpacity;
                const strokeWidth = rng.range(0.5, 2) * perspectiveScale;
                
                // Color shifts based on depth for atmospheric perspective
                const depthHue = depthLayer * 20; // Shift hue for depth
                
                pattern += `
                  <defs>
                    <linearGradient id="${spiralId}">
                      <stop offset="0%" style="stop-color:${palette.primary};stop-opacity:${depthIntensity}" />
                      <stop offset="40%" style="stop-color:${palette.energy};stop-opacity:${depthIntensity * 0.9}" />
                      <stop offset="80%" style="stop-color:${palette.secondary};stop-opacity:${depthIntensity * 0.6}" />
                      <stop offset="100%" style="stop-color:${palette.accent};stop-opacity:0" />
                    </linearGradient>
                  </defs>
                  <path d="${spiralPath}" fill="none" stroke="url(#${spiralId})" 
                        stroke-width="${strokeWidth}" stroke-linecap="round" 
                        opacity="${depthIntensity}" filter="url(#glow)" />`;
            }
          }
        }
        break;
        
      case 2: // Particle field interactions (pure fluid)
        {
          const numParticleCenters = rng.int(3, 6);
          const particleCenters = [];
          
          // Create particle centers
          for (let i = 0; i < numParticleCenters; i++) {
            particleCenters.push({
              x: rng.range(100, 412),
              y: rng.range(100, 412),
              intensity: rng.range(0.4, 0.9)
            });
          }
          
          // Create particle field based on interactions between centers
          for (let field = 0; field < 200; field++) {
            const x = rng.range(50, 462);
            const y = rng.range(50, 462);
            
            // Calculate field strength from all centers
            let totalField = 0;
            for (const center of particleCenters) {
              const dx = x - center.x;
              const dy = y - center.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const fieldContribution = center.intensity / (distance * 0.01 + 0.1);
              totalField += fieldContribution;
            }
            
            // Only render particles above threshold
            if (totalField > 0.5) {
              const turbulence = shaderFunctions.fluidTurbulence(x, y, tokenId * 0.1, 0.3);
              const particleX = x + turbulence * 15;
              const particleY = y + turbulence * 15;
              const particleSize = Math.min(totalField * 2, 8);
              const opacity = Math.min(totalField * 0.3, 0.8);
              
              const particleId = `field_particle_${field}`;
              pattern += `
                <defs>
                  <radialGradient id="${particleId}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:${palette.energy};stop-opacity:${opacity}" />
                    <stop offset="70%" style="stop-color:${palette.primary};stop-opacity:${opacity * 0.6}" />
                    <stop offset="100%" style="stop-color:${palette.secondary};stop-opacity:0" />
                  </radialGradient>
                </defs>
                <circle cx="${particleX}" cy="${particleY}" r="${particleSize}" 
                        fill="url(#${particleId})" opacity="${opacity}" 
                        filter="url(#glow)" />`;
            }
          }
        }
        break;
        
      case 3: // Flowing particle ribbons (pure fluid)
        {
          const numRibbons = rng.int(3, 6);
          
          for (let ribbon = 0; ribbon < numRibbons; ribbon++) {
            const startX = rng.range(50, 462);
            const startY = rng.range(50, 462);
            let ribbonPath = `M ${startX} ${startY}`;
            
            let currentX = startX;
            let currentY = startY;
            
            // Create flowing ribbon path
            for (let step = 0; step < 60; step++) {
              const turbulence = shaderFunctions.fluidTurbulence(currentX, currentY, tokenId * 0.1 + ribbon, 0.7);
              const flowAngle = turbulence * Math.PI * 6 + step * 0.12;
              
              currentX += Math.cos(flowAngle) * 8;
              currentY += Math.sin(flowAngle) * 8;
              
              // Keep within bounds with soft reflection
              if (currentX < 50) currentX = 50 + (50 - currentX);
              if (currentX > 462) currentX = 462 - (currentX - 462);
              if (currentY < 50) currentY = 50 + (50 - currentY);
              if (currentY > 462) currentY = 462 - (currentY - 462);
              
              // Add smooth curve points
              if (step % 2 === 0) {
                const controlX = currentX + rng.range(-15, 15);
                const controlY = currentY + rng.range(-15, 15);
                ribbonPath += ` Q ${controlX} ${controlY} ${currentX} ${currentY}`;
              }
            }
            
            const ribbonId = `ribbon_${ribbon}`;
            const intensity = rng.range(0.4, 0.8);
            
            pattern += `
              <defs>
                <linearGradient id="${ribbonId}">
                  <stop offset="0%" style="stop-color:${palette.accent};stop-opacity:0" />
                  <stop offset="30%" style="stop-color:${palette.primary};stop-opacity:${intensity}" />
                  <stop offset="70%" style="stop-color:${palette.energy};stop-opacity:${intensity * 0.9}" />
                  <stop offset="100%" style="stop-color:${palette.secondary};stop-opacity:0" />
                </linearGradient>
              </defs>
              <path d="${ribbonPath}" fill="none" stroke="url(#${ribbonId})" 
                    stroke-width="${rng.range(1.2, 3.5)}" stroke-linecap="round" 
                    opacity="${intensity}" filter="url(#plasma-glow)" />`;
          }
        }
        break;
        
      case 4: // Radial particle burst (pure fluid)
        {
          const burstCenterX = 256 + rng.range(-100, 100);
          const burstCenterY = 256 + rng.range(-100, 100);
          const numRays = rng.int(6, 12);
          
          for (let ray = 0; ray < numRays; ray++) {
            const rayAngle = (ray / numRays) * Math.PI * 2;
            const rayLength = rng.range(80, 180);
            
            // Create particle stream along ray
            let rayPath = `M ${burstCenterX} ${burstCenterY}`;
            
            for (let step = 0; step < 40; step++) {
              const distance = (step / 40) * rayLength;
              const turbulence = shaderFunctions.fluidTurbulence(burstCenterX, burstCenterY, tokenId * 0.1 + ray, 0.5);
              
              const x = burstCenterX + Math.cos(rayAngle + turbulence * 0.5) * distance;
              const y = burstCenterY + Math.sin(rayAngle + turbulence * 0.5) * distance;
              
              // Add some organic variation
              const offsetX = x + Math.sin(step * 0.3 + turbulence) * 10;
              const offsetY = y + Math.cos(step * 0.3 + turbulence) * 10;
              
              if (step % 3 === 0) {
                rayPath += ` Q ${offsetX} ${offsetY} ${x} ${y}`;
              } else {
                rayPath += ` L ${x} ${y}`;
              }
            }
            
            const rayId = `burst_ray_${ray}`;
            const intensity = rng.range(0.3, 0.7);
            
            pattern += `
              <defs>
                <linearGradient id="${rayId}">
                  <stop offset="0%" style="stop-color:${palette.energy};stop-opacity:${intensity}" />
                  <stop offset="60%" style="stop-color:${palette.primary};stop-opacity:${intensity * 0.7}" />
                  <stop offset="100%" style="stop-color:${palette.secondary};stop-opacity:0" />
                </linearGradient>
              </defs>
              <path d="${rayPath}" fill="none" stroke="url(#${rayId})" 
                    stroke-width="${rng.range(0.8, 2.2)}" stroke-linecap="round" 
                    opacity="${intensity}" filter="url(#glow)" />`;
          }
        }
        break;
        
      case 5: // True fluid energy field (smooth flowing plasma)
        {
          // Create flowing energy streams using path elements
          const numStreams = rng.int(3, 6);
          
          for (let stream = 0; stream < numStreams; stream++) {
            let path = '';
            const startX = rng.range(50, 462);
            const startY = rng.range(50, 462);
            
            // Create smooth flowing path using turbulence
            let currentX = startX;
            let currentY = startY;
            path = `M ${currentX} ${currentY}`;
            
            for (let step = 0; step < 100; step++) {
              const turbulence = shaderFunctions.fluidTurbulence(currentX, currentY, tokenId * 0.1 + stream, 0.8);
              const flowAngle = turbulence * Math.PI * 2 + step * 0.1;
              
              currentX += Math.cos(flowAngle) * 8;
              currentY += Math.sin(flowAngle) * 8;
              
              // Keep within bounds
              currentX = Math.max(20, Math.min(492, currentX));
              currentY = Math.max(20, Math.min(492, currentY));
              
              if (step % 3 === 0) {
                path += ` Q ${currentX + rng.range(-10, 10)} ${currentY + rng.range(-10, 10)} ${currentX} ${currentY}`;
              }
            }
            
            // Create gradient for this stream
            const streamId = `stream_${stream}`;
            const intensity = rng.range(0.4, 0.9);
            
            pattern += `
              <defs>
                <linearGradient id="${streamId}" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:${palette.energy};stop-opacity:0" />
                  <stop offset="30%" style="stop-color:${palette.primary};stop-opacity:${intensity}" />
                  <stop offset="70%" style="stop-color:${palette.secondary};stop-opacity:${intensity * 0.8}" />
                  <stop offset="100%" style="stop-color:${palette.accent};stop-opacity:0" />
                </linearGradient>
              </defs>
              <path d="${path}" fill="none" stroke="url(#${streamId})" 
                    stroke-width="${rng.range(2.5, 6)}" stroke-linecap="round" 
                    opacity="${intensity}" filter="url(#plasma-glow)" />
              <path d="${path}" fill="none" stroke="${palette.energy}" 
                    stroke-width="${rng.range(1.2, 3.5)}" stroke-linecap="round" 
                    opacity="${intensity * 1.2}" filter="url(#glow)" />`;
          }
        }
        break;
        
      case 6: // Volumetric energy cloud (smooth density field)
        {
          // Create smooth volumetric cloud using radial gradients
          const numClouds = rng.int(2, 4);
          
          for (let cloud = 0; cloud < numClouds; cloud++) {
            const centerX = 256 + rng.range(-150, 150);
            const centerY = 256 + rng.range(-150, 150);
            const cloudSize = rng.range(80, 200);
            
            // Create multiple overlapping radial gradients for smooth volumetric effect
            for (let layer = 0; layer < 5; layer++) {
              const layerOffset = layer * 20;
              const layerX = centerX + Math.cos(tokenId * 0.1 + cloud + layer) * layerOffset;
              const layerY = centerY + Math.sin(tokenId * 0.1 + cloud + layer) * layerOffset;
              const layerSize = cloudSize * (1 - layer * 0.15);
              const layerId = `cloud_${cloud}_${layer}`;
              
              // Apply turbulence to the gradient center
              const turbulence = shaderFunctions.fluidTurbulence(layerX, layerY, tokenId * 0.1 + cloud, 0.6);
              const turbX = layerX + turbulence * 30;
              const turbY = layerY + turbulence * 30;
              
              const intensity = rng.range(0.3, 0.7) * (1 - layer * 0.2);
              
              pattern += `
                <defs>
                  <radialGradient id="${layerId}" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style="stop-color:${palette.energy};stop-opacity:${intensity}" />
                    <stop offset="40%" style="stop-color:${palette.primary};stop-opacity:${intensity * 0.8}" />
                    <stop offset="70%" style="stop-color:${palette.secondary};stop-opacity:${intensity * 0.4}" />
                    <stop offset="100%" style="stop-color:${palette.accent};stop-opacity:0" />
                  </radialGradient>
                </defs>
                <ellipse cx="${turbX}" cy="${turbY}" rx="${layerSize}" ry="${layerSize * 0.8}" 
                         fill="url(#${layerId})" opacity="${intensity}" 
                         filter="url(#plasma-glow)" 
                         transform="rotate(${turbulence * 45 + tokenId * 0.5} ${turbX} ${turbY})" />`;
            }
          }
        }
        break;
    }
    
    return pattern;
  };
  
  // Generate fluid energy core (replaces geometric center)
  const generateFluidCore = (): string => {
    const coreType = tokenId % 3;
    let core = '';
    
    switch (coreType) {
      case 0: // 3D Swirling energy vortex (spatial depth)
        {
          const numLayers = 12; // More layers for better 3D effect
          for (let layer = 0; layer < numLayers; layer++) {
            const zDepth = layer / numLayers; // 0 = front, 1 = back
            const baseRadius = 90 - layer * 6;
            const perspectiveScale = 1 - zDepth * 0.5;
            const radius = baseRadius * perspectiveScale;
            
            // 3D rotation with perspective
            const rotation = (tokenId * 0.1 + layer * 0.7) * 25;
            const tiltAngle = Math.sin(layer * 0.5) * 15; // Tilt for 3D effect
            
            const opacity = (1 - layer / numLayers) * 0.7 * (1 - zDepth * 0.4);
            const coreId = `vortex_3d_${layer}`;
            
            // Add perspective distortion
            const ellipseRx = radius;
            const ellipseRy = radius * (0.4 + zDepth * 0.4); // Varies with depth
            
            // Offset for 3D perspective
            const offsetX = Math.sin(rotation * Math.PI / 180) * zDepth * 15;
            const offsetY = Math.cos(rotation * Math.PI / 180) * zDepth * 8;
            
            core += `
              <defs>
                <radialGradient id="${coreId}" cx="${30 + zDepth * 20}%" cy="${30 + zDepth * 15}%" r="70%">
                  <stop offset="0%" style="stop-color:${palette.energy};stop-opacity:${opacity}" />
                  <stop offset="40%" style="stop-color:${palette.primary};stop-opacity:${opacity * 0.8}" />
                  <stop offset="80%" style="stop-color:${palette.secondary};stop-opacity:${opacity * 0.4}" />
                  <stop offset="100%" style="stop-color:${palette.accent};stop-opacity:0" />
                </radialGradient>
              </defs>
              <ellipse cx="${256 + offsetX}" cy="${256 + offsetY}" rx="${ellipseRx}" ry="${ellipseRy}" 
                       fill="url(#${coreId})" opacity="${opacity}" 
                       filter="url(#plasma-glow)" 
                       transform="rotate(${rotation + tiltAngle} ${256 + offsetX} ${256 + offsetY})" />`;
          }
        }
        break;
        
      case 1: // Pulsing energy sphere
        {
          const pulseIntensity = 0.7 + 0.3 * Math.sin(tokenId * 0.02);
          const numRings = 6;
          
          for (let ring = 0; ring < numRings; ring++) {
            const radius = 30 + ring * 12;
            const opacity = (1 - ring / numRings) * pulseIntensity * 0.8;
            const ringId = `pulse_${ring}`;
            
            core += `
              <defs>
                <radialGradient id="${ringId}" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" style="stop-color:${palette.energy};stop-opacity:${opacity}" />
                  <stop offset="70%" style="stop-color:${palette.primary};stop-opacity:${opacity * 0.5}" />
                  <stop offset="100%" style="stop-color:${palette.accent};stop-opacity:0" />
                </radialGradient>
              </defs>
              <circle cx="256" cy="256" r="${radius}" 
                      fill="url(#${ringId})" opacity="${opacity}" 
                      filter="url(#plasma-glow)" />`;
          }
        }
        break;
        
      case 2: // 3D Flowing energy streams converging (spatial depth)
        {
          const numStreams = 8;
          const numDepthLayers = 4;
          
          for (let depthLayer = 0; depthLayer < numDepthLayers; depthLayer++) {
            const zDepth = depthLayer / numDepthLayers;
            const perspectiveScale = 1 - zDepth * 0.4;
            const depthOpacity = 1 - zDepth * 0.6;
            
            for (let stream = 0; stream < numStreams; stream++) {
              const angle = (stream / numStreams) * Math.PI * 2 + depthLayer * 0.2;
              const streamLength = 140 * perspectiveScale;
              
              // 3D positioning with perspective
              const baseStartX = 256 + Math.cos(angle) * streamLength;
              const baseStartY = 256 + Math.sin(angle) * streamLength;
              
              // Add 3D depth offset
              const depthOffsetX = Math.sin(angle + depthLayer) * zDepth * 30;
              const depthOffsetY = Math.cos(angle + depthLayer) * zDepth * 20;
              
              const startX = baseStartX + depthOffsetX;
              const startY = baseStartY + depthOffsetY;
              
              // Create curved path with 3D perspective
              const controlDistance = streamLength * 0.7;
              const controlX = 256 + Math.cos(angle + Math.PI / 3) * controlDistance + depthOffsetX * 0.5;
              const controlY = 256 + Math.sin(angle + Math.PI / 3) * controlDistance + depthOffsetY * 0.5;
              
              const streamId = `flow_3d_${depthLayer}_${stream}`;
              const baseIntensity = rng.range(0.4, 0.8);
              const intensity = baseIntensity * depthOpacity;
              const strokeWidth = rng.range(1.5, 4) * perspectiveScale;
              
              core += `
                <defs>
                  <linearGradient id="${streamId}" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:${palette.accent};stop-opacity:0" />
                    <stop offset="30%" style="stop-color:${palette.secondary};stop-opacity:${intensity * 0.6}" />
                    <stop offset="70%" style="stop-color:${palette.primary};stop-opacity:${intensity}" />
                    <stop offset="100%" style="stop-color:${palette.energy};stop-opacity:${intensity * 1.3}" />
                  </linearGradient>
                </defs>
                <path d="M ${startX} ${startY} Q ${controlX} ${controlY} ${256 + depthOffsetX * 0.3} ${256 + depthOffsetY * 0.3}" 
                      fill="none" stroke="url(#${streamId})" 
                      stroke-width="${strokeWidth}" stroke-linecap="round" 
                      opacity="${intensity}" filter="url(#plasma-glow)" />`;
            }
          }
        }
        break;
    }
    
    return core;
  };

  // Generate SVG filters for shader-like effects
  const generateSVGFilters = (): string => {
    return `
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="plasma-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
          <feColorMatrix in="coloredBlur" values="1 0 1 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
    `;
  };
  
  // Generate unique background gradient
  const generateBackground = (): string => {
    const gradientType = tokenId % 3;
    
    switch (gradientType) {
      case 0: // Radial gradient
        return `
          <defs>
            <radialGradient id="bg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" style="stop-color:${palette.background1};stop-opacity:1" />
              <stop offset="100%" style="stop-color:${palette.background2};stop-opacity:1" />
            </radialGradient>
          </defs>
          <rect width="512" height="512" fill="url(#bg)" />
        `;
      case 1: // Linear gradient
        const angle = (tokenId * 73) % 360;
        return `
          <defs>
            <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle})">
              <stop offset="0%" style="stop-color:${palette.background1};stop-opacity:1" />
              <stop offset="50%" style="stop-color:${palette.primary};stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:${palette.background2};stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" fill="url(#bg)" />
        `;
      default: // Conic gradient simulation
        return `
          <defs>
            <radialGradient id="bg" cx="50%" cy="50%" r="100%">
              <stop offset="0%" style="stop-color:${palette.background1};stop-opacity:1" />
              <stop offset="30%" style="stop-color:${palette.primary};stop-opacity:0.5" />
              <stop offset="70%" style="stop-color:${palette.secondary};stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:${palette.background2};stop-opacity:1" />
            </radialGradient>
          </defs>
          <rect width="512" height="512" fill="url(#bg)" />
        `;
    }
  };
  
  return `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      ${generateSVGFilters()}
      ${generateBackground()}
      ${generatePlasmaPattern()}
      ${generateFluidCore()}
    </svg>
  `;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tokenId } = req.query;
  
  if (!tokenId || Array.isArray(tokenId)) {
    return res.status(400).json({ error: "Invalid token ID" });
  }

  const tokenIdNum = parseInt(tokenId);
  
  if (isNaN(tokenIdNum) || tokenIdNum < 1 || tokenIdNum > 10000) {
    return res.status(400).json({ error: "Token ID must be between 1 and 10000" });
  }

  try {
    console.log(`Generating image for tokenId: ${tokenIdNum}`);
    const svgContent = generateNFTImageSVG(tokenIdNum);
    
    if (!svgContent || svgContent.length === 0) {
      throw new Error('Generated SVG content is empty');
    }
    
    // Set headers for proper SVG serving with reduced cache for development
    res.setHeader('Content-Type', 'image/svg+xml');
    
    // Check if this is a preview request (has version parameter)
    const isPreview = req.query.v !== undefined;
    if (isPreview) {
      // Shorter cache for preview images to allow refreshing
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    } else {
      // Longer cache for production images
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
    
    console.log(`Successfully generated image for tokenId: ${tokenIdNum}, length: ${svgContent.length}`);
    return res.status(200).send(svgContent);
  } catch (error) {
    console.error(`Error generating image for tokenId ${tokenIdNum}:`, error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return res.status(500).json({ 
      error: "Failed to generate image", 
      tokenId: tokenIdNum, 
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
