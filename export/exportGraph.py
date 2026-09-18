"""Glue script: run the existing logic-layer graph-generation algorithm and
dump its result as a static JSON file for the rendering layer to consume.
"""
import argparse
import json
import os
import random
import sys

_REPO_ROOT = os.path.join(os.path.dirname(__file__), "..")
sys.path.insert(0, os.path.join(_REPO_ROOT, "logic"))
sys.path.insert(0, os.path.join(_REPO_ROOT, "empirical"))

import algorithm  # noqa: E402
import trialRunner  # noqa: E402
import vertices  # noqa: E402

DEFAULT_VERTEX_COUNT = 40
DEFAULT_GRID_SIZE = 20
DEFAULT_SPECIAL_SUBSET_SIZE = 4
DEFAULT_SPARSITY = 3.0
DEFAULT_SEED = 42
DEFAULT_OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "graph.json")


# ===== HELPER FUNCTIONS - GRAPH GENERATION =====

def _generateGraph(n: int, L: int, k: int, r: float, rng: random.Random) -> tuple[list, set, list]:
    """Run the logic-layer algorithm and return (allVertices, specialSubset, edgeSequence)."""
    allVertices = vertices.sampleVertices(n, L, rng)
    specialSubset = vertices.selectSpecialSubset(allVertices, k, rng)
    sigma = L / trialRunner.SIGMA_DIVISOR

    edgeSequence = list(algorithm.growEdgesStepwise(allVertices, specialSubset, r, sigma))
    return allVertices, specialSubset, edgeSequence


def _toExportShape(allVertices: list, specialSubset: set, edgeSequence: list) -> dict:
    """Convert vertices/edges into the exported JSON shape, resolving each
    edge's endpoint vertices to their positional indices in allVertices.
    """
    vertexIndex = {vertex: index for index, vertex in enumerate(allVertices)}

    indexedEdges = []
    for edge in edgeSequence:
        startVertex, endVertex = sorted(edge, key = vertexIndex.get)
        indexedEdges.append([vertexIndex[startVertex], vertexIndex[endVertex]])

    return {
        "vertices": [
            [*vertex, vertex in specialSubset] for vertex in allVertices
        ],
        "edgeSequence": indexedEdges,
    }


# ===== PUBLIC INTERFACE =====

def parseArguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description = __doc__)
    parser.add_argument("--n", type = int, default = DEFAULT_VERTEX_COUNT, help = "vertex count")
    parser.add_argument("--L", type = int, default = DEFAULT_GRID_SIZE, help = "grid size")
    parser.add_argument("--k", type = int, default = DEFAULT_SPECIAL_SUBSET_SIZE, help = "special-subset size")
    parser.add_argument("--r", type = float, default = DEFAULT_SPARSITY, help = "sparsity")
    parser.add_argument("--seed", type = int, default = DEFAULT_SEED, help = "RNG seed")
    parser.add_argument("--output", type = str, default = DEFAULT_OUTPUT_PATH, help = "output JSON path")
    return parser.parse_args()


def exportGraph(n: int, L: int, k: int, r: float, seed: int, outputPath: str) -> None:
    """Generate a graph via the logic layer and write it as JSON to outputPath."""
    rng = random.Random(seed)
    allVertices, specialSubset, edgeSequence = _generateGraph(n, L, k, r, rng)
    exportedGraph = _toExportShape(allVertices, specialSubset, edgeSequence)

    with open(outputPath, "w") as outputFile:
        json.dump(exportedGraph, outputFile, indent = 2)


if __name__ == "__main__":
    arguments = parseArguments()
    exportGraph(arguments.n, arguments.L, arguments.k, arguments.r, arguments.seed, arguments.output)
