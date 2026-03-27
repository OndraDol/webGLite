#version 300 es
in highp vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform lowp float uAlpha;
out lowp vec4 outputColor;

void main(void) {
    lowp vec4 color = texture(uSampler, vTextureCoord);
    if (color.xyz != vec3(0,0,0)) {
      outputColor = vec4(color.xyz, uAlpha);
    }
}
