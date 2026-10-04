/** Imperative-shell parameter panel: stages edits in DOM inputs and commits them to parameters.js only on apply. */
import { getParameters, setParameters } from "./parameters.js";
import { fitsGridCapacity, isValidVertexSelection } from "./logic/construction/vertices.js";

// CONSTANTS

const PARAMETER_FIELDS = {
  vertexCount: {
    label: "Vertex count",
    isValid: (value, staged) => _isPositiveInteger(value) && (!_isPositiveInteger(staged.gridSize) || fitsGridCapacity(value, staged.gridSize)),
  },
  gridSize: {
    label: "Grid size",
    isValid: _isPositiveInteger,
  },
  specialSubsetSize: {
    label: "Special subset size",
    isValid: (value, staged) => Number.isInteger(value) && isValidVertexSelection(value, staged.vertexCount),
  },
  sparsity: {
    label: "Sparsity",
    isValid: (value) => value > 0 && Number.isFinite(value),
  },
  nearestNeighborCount: {
    label: "Nearest neighbor count",
    isValid: (value, staged) => _isPositiveInteger(value) && isValidVertexSelection(value, staged.vertexCount - 1),
  },
  dampeningFactor: {
    label: "Dampening - components",
    isValid: (value) => value > 0 && value <= 1,
  },
  strengtheningFactor: {
    label: "Strengthening - vertices",
    isValid: (value) => value >= 1 && Number.isFinite(value),
  },
  edgePacingMilliseconds: {
    label: "Edge reveal pace",
    isValid: _isPositiveInteger,
  },
  screenMarginFraction: {
    label: "Screen margin",
    isValid: (value) => value >= 0 && value < 0.5,
  },
};

// HELPER FUNCTIONS - VALIDATION

function _isPositiveInteger(value) {
  return Number.isInteger(value) && value >= 1;
}

// HELPER FUNCTIONS - DOM CONSTRUCTION

function _createField(key) {
  const label = document.createElement("label");
  label.append(PARAMETER_FIELDS[key].label);
  const input = document.createElement("input");
  input.type = "number";
  input.step = "any";
  label.append(input);
  return { label, input };
}

function _createFields(containerElement) {
  const fields = {};
  for (const key of Object.keys(PARAMETER_FIELDS)) {
    fields[key] = _createField(key);
    containerElement.append(fields[key].label);
  }
  return fields;
}

// HELPER FUNCTIONS - DOM STATE

function _fillFields(fields) {
  const currentValues = getParameters();
  for (const [key, { input }] of Object.entries(fields)) {
    input.value = currentValues[key];
  }
}

function _readStagedValues(fields) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, { input }]) => [key, input.valueAsNumber]),
  );
}

function _markRejected(fields, rejectedKeys) {
  for (const [key, { label }] of Object.entries(fields)) {
    label.classList.toggle("rejected", rejectedKeys.includes(key));
  }
}

// PUBLIC INTERFACE

export function validateStagedParameters(stagedValues) {
  return Object.keys(PARAMETER_FIELDS).filter((key) => !PARAMETER_FIELDS[key].isValid(stagedValues[key], stagedValues));
}

export function createPanel(containerElement) {
  const fields = _createFields(containerElement);

  function isOpen() {
    return containerElement.classList.contains("open");
  }

  function open() {
    _fillFields(fields);
    _markRejected(fields, []);
    containerElement.classList.add("open");
  }

  function tryApply() {
    const stagedValues = _readStagedValues(fields);
    const rejectedKeys = validateStagedParameters(stagedValues);
    _markRejected(fields, rejectedKeys);
    if (rejectedKeys.length > 0) {
      return false;
    }
    setParameters(stagedValues);
    containerElement.classList.remove("open");
    return true;
  }

  return { isOpen, open, tryApply };
}
