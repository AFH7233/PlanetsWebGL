precision highp float;
varying vec2 vTextureCoord;
varying vec4 vVertexNormal;
varying vec4 vertPos; 

uniform sampler2D uSampler;
uniform vec4 lightPos;
uniform float ka;
uniform float kd;

void main(void) {
    vec3 N = normalize(vVertexNormal.xyz);
    vec3 L = normalize(lightPos.xyz - vertPos.xyz);
    vec3 diffuseColor = vec3(1.0, 1.0, 1.0);
    vec3 ambientColor = vec3(1.0, 1.0, 1.0);

    // Lambert's cosine law
    float lambertian = max(dot(N, L), 0.0);
    vec3 finalColor = ka*ambientColor  + (kd * lambertian * diffuseColor);
    vec4 texelColor = texture2D(uSampler, vTextureCoord);
    gl_FragColor = vec4(texelColor.rgb * finalColor.rgb, texelColor.a);
}