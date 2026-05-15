const canvas = document.getElementById('glCanvas');

const imageInput = document.getElementById('imageInput');
const effectSelect = document.getElementById('effectSelect');
const paramsPanel = document.getElementById('paramsPanel');
const resetParamsButton = document.getElementById('resetParamsButton');

const effectConfigs = {
  wave: {
    label: 'Wave',
    params: {
      frequency: {
        label: 'Frequency',
        min: 1,
        max: 60,
        step: 1,
        value: 20,
      },
      amplitude: {
        label: 'Amplitude',
        min: 0,
        max: 0.1,
        step: 0.001,
        value: 0.02,
      },
      speed: {
        label: 'Speed',
        min: 0,
        max: 5,
        step: 0.1,
        value: 1,
      },
    },
  },
};

const paramState = {};
const paramInputs = {};

function resetParams(effectName) {
  const config = effectConfigs[effectName];

  paramState[effectName] = {};

  Object.entries(config.params).forEach(([name, param]) => {
    paramState[effectName][name] = param.value;
  });
}

function renderParamsPanel(effectName) {
  const config = effectConfigs[effectName];
  paramsPanel.innerHTML = '';
  paramInputs[effectName] = {};

  Object.entries(config.params).forEach(([name, param]) => {
    const row = document.createElement('div');
    row.className = 'param-row';

    const inputId = `${effectName}-${name}Input`;

    const label = document.createElement('label');
    label.htmlFor = inputId;
    label.textContent = param.label;

    const input = document.createElement('input');
    input.id = inputId;
    input.type = 'range';
    input.min = param.min;
    input.max = param.max;
    input.step = param.step;
    input.value = paramState[effectName][name];

    const value = document.createElement('span');
    value.textContent = input.value;

    input.addEventListener('input', function () {
      paramState[effectName][name] = Number(input.value);
      value.textContent = input.value;
    });

    row.appendChild(label);
    row.appendChild(input);
    row.appendChild(value);
    paramsPanel.appendChild(row);

    paramInputs[effectName][name] = input;
  });
}

resetParams('wave');
renderParamsPanel('wave');

resetParamsButton.addEventListener('click', function () {
  const effectName = effectSelect.value;
  resetParams(effectName);
  renderParamsPanel(effectName);
});

const gl = canvas.getContext('webgl');

if (!gl) {
  throw new Error('WebGL is not supported');
}

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);

const vertexShaderSource = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

varying vec2 v_texCoord;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
}
`;

const fragmentShaderSource = `
precision mediump float;

varying vec2 v_texCoord;
uniform sampler2D u_image;
uniform float u_time;

uniform float u_frequency;
uniform float u_amplitude;
uniform float u_speed;

void main() {
    vec2 uv = v_texCoord;

    float wave = sin(uv.y * u_frequency + u_time * u_speed);
    uv.x = uv.x + wave * u_amplitude;
    gl_FragColor = texture2D(u_image, uv);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(info);
  }

  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(info);
  }

  return program;
}

const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = compileShader(
  gl,
  gl.FRAGMENT_SHADER,
  fragmentShaderSource,
);

const program = createProgram(gl, vertexShader, fragmentShader);
gl.useProgram(program);

const imageLocation = gl.getUniformLocation(program, 'u_image');
const timeLocation = gl.getUniformLocation(program, 'u_time');

const frequencyLocation = gl.getUniformLocation(program, 'u_frequency');
const amplitudeLocation = gl.getUniformLocation(program, 'u_amplitude');
const speedLocation = gl.getUniformLocation(program, 'u_speed');

const positions = new Float32Array([
  -1, -1, 1, -1, -1, 1,

  -1, 1, 1, -1, 1, 1,
]);
const texCoords = new Float32Array([
  0, 1, 1, 1, 0, 0,

  0, 0, 1, 1, 1, 0,
]);
// const texCoords = new Float32Array([
//   1, 0, 0, 0, 1, 1,

//   1, 1, 0, 0, 0, 1,
// ]);

const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);

gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const texCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
gl.enableVertexAttribArray(texCoordLocation);

gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

let texture = null;
let animationStarted = false;
const image = new Image();
image.src = './assets/test.png';

function getWaveParams() {
  return paramState.wave;
}

function render(time) {
  const params = getWaveParams();

  gl.uniform1f(timeLocation, time * 0.001);
  gl.uniform1f(frequencyLocation, params.frequency);
  gl.uniform1f(amplitudeLocation, params.amplitude);
  gl.uniform1f(speedLocation, params.speed);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  requestAnimationFrame(render);
}

imageInput.addEventListener('change', function () {
  const file = imageInput.files[0];

  if (!file) {
    return;
  }

  const url = URL.createObjectURL(file);
  image.src = url;
});

image.onload = function () {
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(imageLocation, 0);

  if (!animationStarted) {
    animationStarted = true;
    requestAnimationFrame(render);
  }
};
