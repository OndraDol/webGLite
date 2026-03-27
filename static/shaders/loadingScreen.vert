#version 300 es
in vec3 position;
uniform mat4 uProjectionMatrix;
uniform mat4 uModelMatrix;

void main() {
    gl_PointSize = 2.0;
    gl_Position = uProjectionMatrix * uModelMatrix * vec4(position.xyz,1.0);
}
