"""Hand-rolled gradient-descent fit of a sigmoid to (r, proportion) data."""
import math

MAX_ITERATIONS = 20000
GRADIENT_TOLERANCE = 1e-8
LEARNING_RATE = 1.0


# ===== HELPER FUNCTIONS - SIGMOID =====

def _sigmoidValue(r: float, k: float, r0: float) -> float:
    exponent = -k * (r - r0)
    if exponent >= 0:
        shrunkExponential = math.exp(-exponent)
        return shrunkExponential / (1.0 + shrunkExponential)
    return 1.0 / (1.0 + math.exp(exponent))


# ===== HELPER FUNCTIONS - LOSS DERIVATIVES =====

def _gradient(dataPoints: list[tuple[float, float]], k: float, r0: float) -> tuple[float, float]:
    gradientWithRespectToK = 0.0
    gradientWithRespectToR0 = 0.0
    for r, proportion in dataPoints:
        predicted = _sigmoidValue(r, k, r0)
        errorTimesSlope = 2.0 * (predicted - proportion) * predicted * (1.0 - predicted)
        gradientWithRespectToK += errorTimesSlope * (r - r0)
        gradientWithRespectToR0 += errorTimesSlope * (-k)
    return gradientWithRespectToK, gradientWithRespectToR0


# ===== PUBLIC INTERFACE =====

def fitSigmoid(dataPoints: list[tuple[float, float]]) -> tuple[float, float]:
    """Fit p(r) = 1 / (1 + exp(-k * (r - r0))) to dataPoints via vanilla
    gradient descent minimization of the squared-error loss, starting from
    k=1.0 and r0 at the midpoint of the observed r-values. kFit is
    unconstrained in sign.
    """
    rValues = [r for r, _ in dataPoints]
    r0 = (min(rValues) + max(rValues)) / 2.0
    k = 1.0

    pointCount = len(dataPoints)

    for _ in range(MAX_ITERATIONS):
        gradientWithRespectToK, gradientWithRespectToR0 = _gradient(dataPoints, k, r0)
        gradientNorm = math.hypot(gradientWithRespectToK, gradientWithRespectToR0)
        if gradientNorm < GRADIENT_TOLERANCE:
            break

        stepScale = LEARNING_RATE / pointCount
        k -= stepScale * gradientWithRespectToK
        r0 -= stepScale * gradientWithRespectToR0

    return float(k), float(r0)
