attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;
attribute vec3 aVertexNormal;


uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uCameraMatrix;

varying highp vec4 vertPos; 
varying highp vec2 vTextureCoord;
varying highp vec4 vVertexNormal;

void main(void) {
    vertPos = uCameraMatrix * uModelViewMatrix * aVertexPosition;
    gl_Position = uProjectionMatrix * vertPos;
    vTextureCoord = aTextureCoord;
    vec4 correctedNormal = vec4(normalize(aVertexNormal),0.0);
    vVertexNormal =   uCameraMatrix * uModelViewMatrix * correctedNormal;

}
