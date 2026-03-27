#version 300 es
precision highp float;
in vec3 position;
in vec2 textureCoords;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

out highp vec2 vTextureCoord;

void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(position.xyz,1.0);
    vTextureCoord = textureCoords;
}
