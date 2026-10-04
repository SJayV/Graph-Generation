/** Imperative-shell parameter panel: stages edits in DOM inputs and commits them to parameters.js only on apply. */
import { getParameters, setParameters } from "./parameters.js";

// CONSTANTS

const FIELD_LABELS = {
  vertexCount: "Vertex count",
  gridSize: "Grid size",
  specialSubsetSize: "Special subset size",
  sparsity: "Sparsity (edges per vertex)",
  nearestNeighborCount: "Nearest neighbors per vertex",
  dampeningFactor: "Dampening of connected areas (0 to 1)",
  strengtheningFactor: "Strengthening of special vertices (at least 1)",
  edgePacingMilliseconds: "Edge reveal pace (milliseconds)",
  screenMarginFraction: "Screen margin (fraction)",
};

const IS_POSITIVE_INTEGER = (value) => Number.isInteger(value) && value >= 1;

const BOUND_CHECKS = {
  vertexCount: (value, staged) => IS_POSITIVE_INTEGER(value) && (!IS_POSITIVE_INTEGER(staged.gridSize) || value <= (staged.gridSize + 1) ** 2),
  gridSize: IS_POSITIVE_INTEGER,
  specialSubsetSize: (value, staged) => Number.isInteger(value) && value >= 0 && value <= staged.vertexCount,
  sparsity: (value) => value > 0 && Number.isFinite(value),
  nearestNeighborCount: (value, staged) => Number.isInteger(value) && value >= 1 && value <= staged.vertexCount - 1,
  dampeningFactor: (value) => value > 0 && value <= 1,
  strengtheningFactor: (value) => value >= 1 && Number.isFinite(value),
  edgePacingMilliseconds: IS_POSITIVE_INTEGER,
  screenMarginFraction: (value) => value >= 0 && value < 0.5,
};

// HELPER FUNCTIONS - DOM CONSTRUCTION

function _createField(key) {
  const label = document.createElement("label");
  label.append(FIELD_LABELS[key]);
  const input = document.createElement("input");
  input.type = "number";
  input.step = "any";
  label.append(input);
  return { label, input };
}

function _createFields(containerElement) {
  const fields = {};
  for (const key of Object.keys(FIELD_LABELS)) {
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
  return Object.keys(BOUND_CHECKS).filter((key) => !BOUND_CHECKS[key](stagedValues[key], stagedValues));
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
