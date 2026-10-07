/** Feeds per-vertex attributes and uniforms into a linked shader program. */
// PUBLIC INTERFACE

/** Uploads one value (or vector of `itemSize` floats) per drawn vertex into `buffer` and binds it to the named attribute. */
export function uploadVertexAttribute(gl, program, buffer, attributeName, values, itemSize) {
  const attributeLocation = gl.getAttribLocation(program, attributeName);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values.flat()), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(attributeLocation);
  gl.vertexAttribPointer(attributeLocation, itemSize, gl.FLOAT, false, 0, 0);
}

export function setFloatUniform(gl, program, uniformName, value) {
  const uniformLocation = gl.getUniformLocation(program, uniformName);
  gl.uniform1f(uniformLocation, value);
}

export function setColorUniform(gl, program, color) {
  const colorUniformLocation = gl.getUniformLocation(program, "uColor");
  gl.uniform4fv(colorUniformLocation, color);
}
