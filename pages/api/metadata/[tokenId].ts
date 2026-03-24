import { NextApiRequest, NextApiResponse } from 'next';

// Plasma-themed shader art metadata generator
const generateMetadata = (tokenId: number) => {
  // Seeded random for consistent traits
  class SeededRandom {
    private seed: number;
    
    constructor(seed: number) {
      this.seed = seed;
    }
    
    next(): number {
      this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
      return this.seed / 0x7fffffff;
    }
    
    choice<T>(array: T[]): T {
      return array[Math.floor(this.next() * array.length)];
    }
  }
  
  const rng = new SeededRandom(tokenId);
  
  // Plasma-themed names inspired by energy, physics, and celestial bodies
  const plasmaNames = [
    // Energy & Plasma Physics
    "Helios", "Fusion", "Aurora", "Corona", "Magnetron", "Ionosphere", "Synchrotron", "Tokamak",
    "Stellarator", "Cyclotron", "Photon", "Quasar", "Pulsar", "Nebula", "Supernova", "Plasma",
    
    // Mathematical & Shader Terms
    "Fractal", "Vortex", "Tessellation", "Mandelbrot", "Julia", "Perlin", "Simplex", "Voronoi",
    "Bezier", "Spline", "Matrix", "Vector", "Scalar", "Gradient", "Derivative", "Integral",
    
    // Colors & Light
    "Chromatic", "Spectral", "Radiant", "Luminous", "Prismatic", "Iridescent", "Phosphor", "Neon",
    "Laser", "Hologram", "Refraction", "Diffraction", "Interference", "Resonance", "Harmonic", "Wave",
    
    // Geometric & Crystal
    "Crystalline", "Geometric", "Polygonal", "Hexagonal", "Octahedral", "Dodecahedral", "Icosahedral", "Tetrahedral",
    "Cubic", "Spherical", "Torus", "Helix", "Spiral", "Fibonacci", "Golden", "Symmetry"
  ];
  
  // Color variation suffixes
  const colorVariations = [
    "Emerald", "Jade", "Mint", "Forest", "Sage", "Olive", "Lime", "Chartreuse",
    "Viridian", "Malachite", "Verdant", "Pine", "Moss", "Fern", "Basil", "Clover",
    "Seafoam", "Teal", "Aqua", "Cyan", "Turquoise", "Azure", "Cerulean", "Cobalt"
  ];
  
  // Pattern algorithm names (matching image generation)
  const algorithmTypes = [
    "Flowing Particle Streams",
    "3D Swirling Vortex", 
    "Particle Field Interactions", 
    "Flowing Particle Ribbons", 
    "Radial Particle Burst",
    "True Fluid Energy Field",
    "Volumetric Energy Cloud"
  ];
  
  const patternType = algorithmTypes[tokenId % 7];
  
  // Generate unique name
  const baseName = rng.choice(plasmaNames);
  const colorVariation = rng.choice(colorVariations);
  const uniqueName = `${baseName} ${colorVariation}`;
  
  // Determine background type
  const backgroundTypes = ["Radial Field", "Linear Gradient", "Conic Distortion"];
  const backgroundType = backgroundTypes[tokenId % 3];
  
  // Calculate color characteristics based on Plasma theme
  const baseHue = (tokenId * 137.508) % 360; // Golden angle distribution
  const plasmaHue = ((baseHue + 120) % 120) + 80; // Bias toward green spectrum (80-200)
  
  const colorTemperatures = ["Cool Plasma", "Warm Fusion", "Neutral Ion"];
  const colorTemp = colorTemperatures[Math.floor(plasmaHue / 120) % 3];
  
  // Shader complexity levels
  const complexityLevels = ["Minimal", "Standard", "Complex", "Ultra", "Legendary"];
  const complexity = complexityLevels[tokenId % 7 < 1 ? 0 : tokenId % 7 < 3 ? 1 : tokenId % 7 < 5 ? 2 : tokenId % 7 < 6 ? 3 : 4];
  
  // Energy levels (Plasma-themed rarity)
  const energyLevels = ["Low Energy", "Medium Energy", "High Energy", "Plasma State", "Fusion Core"];
  let energyLevel;
  
  // Calculate energy based on mathematical properties
  const rarityFactors = [
    patternType === "Fractal Recursion" ? 0.15 : 1,
    complexity === "Legendary" ? 0.1 : complexity === "Ultra" ? 0.2 : 1,
    backgroundType === "Conic Distortion" ? 0.3 : 1,
    baseName === "Helios" || baseName === "Fusion" || baseName === "Plasma" ? 0.2 : 1,
  ];
  
  const rarityScore = rarityFactors.reduce((a, b) => a * b, 1);
  
  if (rarityScore < 0.05) energyLevel = "Fusion Core";
  else if (rarityScore < 0.15) energyLevel = "Plasma State";
  else if (rarityScore < 0.4) energyLevel = "High Energy";
  else if (rarityScore < 0.7) energyLevel = "Medium Energy";
  else energyLevel = "Low Energy";
  
  // Mathematical properties for shader enthusiasts
  const mathProperties = {
    frequency: Math.round((rng.next() * 10 + 1) * 100) / 100,
    amplitude: Math.round((rng.next() * 2 + 0.5) * 100) / 100,
    phase: Math.round((rng.next() * Math.PI * 2) * 100) / 100,
    octaves: Math.floor(rng.next() * 6) + 2,
    lacunarity: Math.round((rng.next() * 1.5 + 1.5) * 100) / 100,
    persistence: Math.round((rng.next() * 0.6 + 0.2) * 100) / 100
  };
  
  const traits = [
    { trait_type: "Pattern Type", value: patternType },
    { trait_type: "Background Field", value: backgroundType },
    { trait_type: "Color Spectrum", value: colorTemp },
    { trait_type: "Complexity", value: complexity },
    { trait_type: "Energy Level", value: energyLevel },
    { trait_type: "Base Element", value: baseName },
    { trait_type: "Color Variant", value: colorVariation },
    { trait_type: "Frequency", value: mathProperties.frequency.toString() },
    { trait_type: "Octaves", value: mathProperties.octaves.toString() },
  ];

  // Shader-inspired description
  const shaderDescription = `${uniqueName} is a plasma-state digital artifact generated through advanced shader mathematics. This piece employs ${patternType.toLowerCase()} algorithms with ${complexity.toLowerCase()} mathematical functions, achieving ${energyLevel.toLowerCase()} resonance. The generative process uses frequency modulation (${mathProperties.frequency}Hz) across ${mathProperties.octaves} octaves, creating unique interference patterns that exist only on the Plasma blockchain.`;

  return {
    name: uniqueName,
    description: shaderDescription,
    image: `${process.env.NEXT_PUBLIC_BASE_URL}/api/image/${tokenId}`,
    external_url: `${process.env.NEXT_PUBLIC_BASE_URL}/nft/${tokenId}`,
    attributes: traits,
    properties: {
      category: "Plasma Shader Art",
      creators: [
        {
          address: "your-wallet-address-here",
          share: 100
        }
      ],
      shader_properties: {
        seed: tokenId,
        algorithm: patternType,
        frequency: mathProperties.frequency,
        amplitude: mathProperties.amplitude,
        phase: mathProperties.phase,
        octaves: mathProperties.octaves,
        lacunarity: mathProperties.lacunarity,
        persistence: mathProperties.persistence,
        energy_score: Math.round(rarityScore * 1000) / 1000,
        plasma_resonance: plasmaHue
      }
    }
  };
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tokenId } = req.query;
  
  if (!tokenId || Array.isArray(tokenId)) {
    return res.status(400).json({ error: "Invalid token ID" });
  }

  const tokenIdNum = parseInt(tokenId);
  
  if (isNaN(tokenIdNum) || tokenIdNum < 1 || tokenIdNum > 10000) {
    return res.status(400).json({ error: "Token ID must be between 1 and 10000" });
  }

  try {
    const metadata = generateMetadata(tokenIdNum);
    
    // Set headers for proper NFT metadata serving
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    return res.status(200).json(metadata);
  } catch (error) {
    console.error('Error generating metadata:', error);
    return res.status(500).json({ error: "Failed to generate metadata" });
  }
}
