export const OrbVertexShader = `
uniform float uTime;
uniform float uEnergy;
uniform float uFractureActivity;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vWorldPosition;

// Simplex 3D Noise 
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
  float n_ = 0.142857142857; 
  vec3  ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z); 
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  
  // 1. PHYSICAL VERTEX DISTORTION
  // Organic liquid distortion based on energy state
  float noiseVal = snoise(position * 2.0 + uTime * 0.8);
  
  // The displacement scales heavily with the AI's energy state
  float displacement = noiseVal * (uEnergy * 0.12) * uFractureActivity;
  vec3 newPosition = position + normal * displacement;
  
  vPosition = newPosition;
  
  vec4 worldPosition = modelMatrix * vec4(newPosition, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

export const OrbFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
uniform float uEnergy;
uniform float uFractureActivity;
uniform float uLightSpeed;
uniform vec3 uMovingLight;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

// Hash function
vec3 hash33(vec3 p) { 
    float n = sin(dot(p, vec3(7.0, 157.0, 113.0)));    
    return fract(vec3(2097152.0, 262144.0, 32768.0) * n); 
}

// 3D Voronoi/Cellular noise function for the fractures
float voronoi(vec3 p) {
    vec3 b, r, g = floor(p);
    p = fract(p);
    float d = 1.0;
    for(int j = -1; j <= 1; j++) {
        for(int i = -1; i <= 1; i++) {
            for(int k = -1; k <= 1; k++) {
                b = vec3(float(i), float(j), float(k));
                r = b - p + hash33(g + b);
                d = min(d, dot(r, r));
            }
        }
    }
    return d;
}

void main() {
    // Outer Shell: Almost black
    vec3 baseColor = vec3(0.02, 0.02, 0.02);
    
    // View direction for Fresnel and Ray Marching
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    
    // Fresnel Rim (Outer white/glowing edge)
    float fresnelFactor = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 6.0);
    vec3 rimColor = mix(vec3(1.0), uColor, 0.5) * fresnelFactor * (0.5 + uEnergy * 0.5);
    
    // 2. RAY-MARCHED INFINITE DEPTH
    vec3 rayDir = -viewDirection; // March into the sphere
    vec3 marchPos = vPosition * 4.0;
    
    // Internal movement based on state
    vec3 noiseOffset = vec3(sin(uTime * 0.2), cos(uTime * 0.3), sin(uTime * 0.1)) * uFractureActivity;
    
    vec3 totalFractureGlow = vec3(0.0);
    vec3 totalAmbientGlow = vec3(0.0);
    
    // Moving Light Source
    vec3 lightDir = normalize(uMovingLight - vPosition);
    
    // Ray-march loop (4 steps deep)
    float stepSize = 0.5;
    for (int i = 0; i < 4; i++) {
        vec3 p = marchPos + rayDir * (float(i) * stepSize) + noiseOffset;
        
        // Generate fracture pattern for this depth layer
        float v1 = voronoi(p);
        float v2 = voronoi(p * 2.0 + vec3(uTime * 0.1));
        float fracture = (v1 * 0.6 + v2 * 0.4);
        
        // Make fractures mostly invisible unless they catch light
        float fractureVis = smoothstep(0.3, 0.8, fracture);
        
        // Depth attenuation (layers deeper inside are dimmer)
        float depthFade = 1.0 - (float(i) * 0.2);
        
        // Perturb normal using fracture noise gradient to simulate facet normals
        vec3 facetNormal = normalize(vNormal + vec3(fracture - 0.5) * 2.0);
        
        // Calculate lighting intersection
        float lighting = max(dot(facetNormal, lightDir), 0.0);
        
        // 3. VOLUMETRIC GOD RAYS (Ultra-high specular intensity for Bloom)
        // We use pow(lighting, 40) for extremely sharp reflections
        // We multiply the result by a massive amount (e.g. 15.0) so the Bloom engine goes crazy
        float specular = pow(lighting, 40.0) * (uEnergy * 15.0);
        
        // Flare coloring
        vec3 layerGlow = mix(vec3(1.0), uColor, 0.3) * specular * fractureVis * depthFade;
        totalFractureGlow += layerGlow;
        
        // Ambient base shards
        vec3 ambientLayer = uColor * fractureVis * 0.02 * uEnergy * depthFade;
        totalAmbientGlow += ambientLayer;
    }
    
    // Combine everything
    vec3 finalColor = baseColor + rimColor + totalAmbientGlow + totalFractureGlow;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`;
