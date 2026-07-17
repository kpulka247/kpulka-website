precision highp float;

uniform float uTime;
uniform sampler2D uTrailTexture;
uniform vec2 uViewSize;
uniform vec2 uViewOffset;
uniform vec2 uTexelSize;
varying vec2 vUv;

const vec3 COLOR_BACKGROUND = vec3(1.0);
const vec3 COLOR_SMOKE_DARK = vec3(0.09);
const vec3 COLOR_SMOKE_LIGHT = vec3(0.49, 0.51, 0.53);
const vec3 COLOR_BACKGROUND_NOISE = vec3(0.85, 0.86, 0.89);
const vec3 COLOR_STREAK = vec3(0.73, 0.77, 0.81);

const mat2 ROTATION_MATRIX = mat2(0.9553, 0.2955, -0.2955, 0.9553);
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
}
float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    v += a * noise(p);
    p = ROTATION_MATRIX * p * 2.0;
    a *= 0.5;
    v += a * noise(p);
    p = ROTATION_MATRIX * p * 2.0;
    a *= 0.5;
    v += a * noise(p);
    return v;
}

void main() {
    vec2 textureUv = vUv * uViewSize + uViewOffset;

    float SMOKEDensity = texture2D(uTrailTexture, textureUv).r;

    float deepBackgroundNoise = fbm(textureUv * 2.0 + uTime * 0.02);
    vec3 backgroundColor = mix(COLOR_BACKGROUND_NOISE, COLOR_BACKGROUND, deepBackgroundNoise);

    float densityRight = texture2D(uTrailTexture, textureUv + vec2(uTexelSize.x, 0.0)).r;
    float densityUp = texture2D(uTrailTexture, textureUv + vec2(0.0, uTexelSize.y)).r;
    vec2 smokeFlow = vec2(densityRight - SMOKEDensity, densityUp - SMOKEDensity);

    vec2 colorMaskUv = textureUv * 5.0;
    colorMaskUv.x += uTime * 0.05;
    colorMaskUv += smokeFlow * 30.0;
    float colorMask = fbm(colorMaskUv);

    vec3 twoToneSMOKEColor = mix(COLOR_SMOKE_DARK, COLOR_SMOKE_LIGHT, colorMask);

    vec2 streakUv = textureUv * vec2(10.0, 90.0);
    streakUv.y += uTime * 0.1;
    streakUv += smokeFlow * 50.0;
    float streakNoise = fbm(streakUv);
    float streakMask = smoothstep(0.55, 0.75, streakNoise);
    vec3 smokeColor = mix(twoToneSMOKEColor, COLOR_STREAK, streakMask);

    float remappedDensity = smoothstep(0.1, 0.4, SMOKEDensity);
    vec3 finalColor = mix(backgroundColor, smokeColor, remappedDensity);

    float grain = (hash(vUv * 1000.0) - 0.5) * 0.1;
    finalColor += grain;
    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
}
