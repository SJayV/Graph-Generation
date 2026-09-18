"""Hand-rolled Newton-Raphson fit of a sigmoid to (r, proportion) data."""
import math

MAX_ITERATIONS = 200
GRADIENT_TOLERANCE = 1e-8
MINIMUM_K = 1e-6
FINITE_DIFFERENCE_STEP = 1e-5
SINGULAR_HESSIAN_THRESHOLD = 1e-12
FALLBACK_STEP_SCALE = 1e-3

HessianMatrix = tuple[tuple[float, float], tuple[float, float]]


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


def _hessian(dataPoints: list[tuple[float, float]], k: float, r0: float) -> HessianMatrix:
    """Hessian of the squared-error loss, via central finite differences of the analytic gradient."""
    gradientKPlus, gradientR0AtKPlus = _gradient(dataPoints, k + FINITE_DIFFERENCE_STEP, r0)
    gradientKMinus, gradientR0AtKMinus = _gradient(dataPoints, k - FINITE_DIFFERENCE_STEP, r0)
    secondDerivativeKK = (gradientKPlus - gradientKMinus) / (2.0 * FINITE_DIFFERENCE_STEP)
    crossDerivativeR0K = (gradientR0AtKPlus - gradientR0AtKMinus) / (2.0 * FINITE_DIFFERENCE_STEP)

    gradientKAtR0Plus, gradientR0Plus = _gradient(dataPoints, k, r0 + FINITE_DIFFERENCE_STEP)
    gradientKAtR0Minus, gradientR0Minus = _gradient(dataPoints, k, r0 - FINITE_DIFFERENCE_STEP)
    crossDerivativeKR0 = (gradientKAtR0Plus - gradientKAtR0Minus) / (2.0 * FINITE_DIFFERENCE_STEP)
    secondDerivativeR0R0 = (gradientR0Plus - gradientR0Minus) / (2.0 * FINITE_DIFFERENCE_STEP)

    crossDerivative = (crossDerivativeR0K + crossDerivativeKR0) / 2.0
    return (secondDerivativeKK, crossDerivative), (crossDerivative, secondDerivativeR0R0)


# ===== HELPER FUNCTIONS - NEWTON STEP =====

def _newtonStep(
    hessian: HessianMatrix,
    gradientWithRespectToK: float,
    gradientWithRespectToR0: float,
) -> tuple[float, float]:
    (hessianKK, hessianKR0), (hessianR0K, hessianR0R0) = hessian
    determinant = hessianKK * hessianR0R0 - hessianKR0 * hessianR0K
    if abs(determinant) < SINGULAR_HESSIAN_THRESHOLD:
        return gradientWithRespectToK * FALLBACK_STEP_SCALE, gradientWithRespectToR0 * FALLBACK_STEP_SCALE

    inverseKK = hessianR0R0 / determinant
    inverseKR0 = -hessianKR0 / determinant
    inverseR0K = -hessianR0K / determinant
    inverseR0R0 = hessianKK / determinant

    deltaK = inverseKK * gradientWithRespectToK + inverseKR0 * gradientWithRespectToR0
    deltaR0 = inverseR0K * gradientWithRespectToK + inverseR0R0 * gradientWithRespectToR0
    return deltaK, deltaR0


# ===== PUBLIC INTERFACE =====

def fitSigmoid(dataPoints: list[tuple[float, float]]) -> tuple[float, float]:
    """Fit p(r) = 1 / (1 + exp(-k * (r - r0))) to dataPoints via Newton-Raphson
    minimization of the squared-error loss, starting from k=1.0 and r0 at the
    midpoint of the observed r-values.
    """
    rValues = [r for r, _ in dataPoints]
    r0 = (min(rValues) + max(rValues)) / 2.0
    k = 1.0

    for _ in range(MAX_ITERATIONS):
        gradientWithRespectToK, gradientWithRespectToR0 = _gradient(dataPoints, k, r0)
        gradientNorm = math.hypot(gradientWithRespectToK, gradientWithRespectToR0)
        if gradientNorm < GRADIENT_TOLERANCE:
            break

        hessian = _hessian(dataPoints, k, r0)
        deltaK, deltaR0 = _newtonStep(hessian, gradientWithRespectToK, gradientWithRespectToR0)

        candidateK = k - deltaK
        k = candidateK if candidateK > 0 else MINIMUM_K
        r0 = r0 - deltaR0

    return float(k), float(r0)
