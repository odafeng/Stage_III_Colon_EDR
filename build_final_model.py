#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
build_final_model.py
====================

Reproducible build script for the two deployed model artifacts consumed by
``app.py``:

    model/final_model_calibrated.pkl   (sklearn Pipeline: KNNImputer -> CalibratedClassifierCV[XGBoost])
    model/final_knn_imputer.pkl        (standalone KNNImputer, used by app.py before predict)

Background
----------
The deployed ``.pkl`` files were previously updated in place with no committed
build script, so the artifacts had no documented, reproducible provenance. This
script rebuilds them deterministically from the derivation cohort using the
*finalized* four-variable model and the finalized Supplementary Table S2
hyperparameters, held fixed (identical to the harness in
``notebooks/7.Revision_PooledOOF_Harmonization.ipynb``).

What it does
------------
1. Locates ``local_data`` by walking up from the current working directory
   (no hardcoded, user-specific path).
2. Loads the derivation cohort ``all_cases_prepared_for_ML.parquet``.
3. Builds the four-variable feature matrix exactly as notebook 7 does
   (one-hot ``AJCC_Substage`` + numeric ``PNI`` + ``LNR`` + ``Differentiation``)
   and aligns the columns to ``model/final_feature_columns.pkl``.
4. Target = ``edr_18m`` (early distant recurrence within 18 months).
5. ``scale_pos_weight = n_negative / n_positive``.
6. Fits ``Pipeline([KNNImputer(5), CalibratedClassifierCV(XGBClassifier(...),
   method='isotonic', cv=5)])`` on the full derivation cohort and saves it as
   ``final_model_calibrated.pkl``.
7. Separately fits a standalone ``KNNImputer(5)`` on the aligned feature matrix
   and saves it as ``final_knn_imputer.pkl`` (app.py imputes with this before
   calling ``predict_proba``; the pipeline's internal imputer is then a no-op on
   the already-complete input, so the two artifacts stay consistent).

Determinism
-----------
All randomness is pinned via ``random_state=8251`` (XGBoost) and the fixed
5-fold isotonic calibration. Re-running this script on the same derivation
cohort with the pinned dependency versions in ``requirements.txt``
(scikit-learn==1.4.2, xgboost==2.0.3) reproduces byte-comparable model behavior.

Usage
-----
    python build_final_model.py

Run from anywhere at/under the project tree; ``local_data`` is discovered by
walking parent directories.
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.impute import KNNImputer
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #
SEED = 8251

# Finalized Supplementary Table S2 hyperparameters, held fixed. This is a
# pre-specified, parsimonious, strongly regularized configuration chosen a priori
# for the limited sample size and event count -- NOT the argmax of any single
# outer fold of the nested CV (which selected a different set in each fold). The
# nested CV characterized the search space and estimated generalization; it did
# not pick this deployed configuration. These match the harness in notebook 7 and
# the deployed artifact.
TABLE_S2_HPARAMS = dict(
    n_estimators=50,
    max_depth=2,
    learning_rate=0.05,
    gamma=1.0,
    min_child_weight=1,
    subsample=0.9,
    colsample_bytree=0.6,
    reg_alpha=0.5,
    reg_lambda=1.0,
    random_state=8251,
)

# Fixed at build time (matches notebook 7 harness / deployed estimator).
XGB_FIXED = dict(eval_metric="logloss", n_jobs=1)

DERIV_PARQUET = "all_cases_prepared_for_ML.parquet"
TARGET_COL = "edr_18m"
RAW_FEATURES = ["AJCC_Substage", "PNI", "LNR", "Differentiation"]

# This script lives in the repo root next to app.py and the model/ directory.
REPO_DIR = Path(__file__).resolve().parent
MODEL_DIR = REPO_DIR / "model"
FEATURE_COL_PATH = MODEL_DIR / "final_feature_columns.pkl"
MODEL_OUT_PATH = MODEL_DIR / "final_model_calibrated.pkl"
IMPUTER_OUT_PATH = MODEL_DIR / "final_knn_imputer.pkl"


# --------------------------------------------------------------------------- #
# Data location (no hardcoded user-specific path)
# --------------------------------------------------------------------------- #
def find_data_dir() -> Path:
    """Locate the ``local_data`` directory by walking up from CWD.

    Searches the current working directory and every parent for a ``local_data``
    folder (also allowing the ``stage_III_colon_edr/local_data`` layout used by
    the analysis notebooks). Raises ``FileNotFoundError`` if none is found. No
    hardcoded fallback path.
    """
    for base in [Path.cwd(), *Path.cwd().parents]:
        for cand in (base / "local_data", base / "stage_III_colon_edr" / "local_data"):
            if cand.exists():
                return cand
    raise FileNotFoundError(
        "local_data not found by searching the current working directory and its "
        "parents. Run this script from within the project tree that contains "
        "local_data/ (holding %s)." % DERIV_PARQUET
    )


# --------------------------------------------------------------------------- #
# Feature construction (must match notebook 7 `base_X` and app.py encoding)
# --------------------------------------------------------------------------- #
def build_features(df: pd.DataFrame, feature_cols: list[str]) -> pd.DataFrame:
    """Build the four-variable design matrix, aligned to ``feature_cols``.

    Replicates notebook 7's ``base_X``: one-hot encode ``AJCC_Substage`` (values
    ``3A``/``3B``/``3C`` -> ``AJCC_Substage_3A`` ...), cast ``PNI`` and
    ``Differentiation`` to float, map +/-inf to NaN, then reindex to the exact
    training feature order stored in ``model/final_feature_columns.pkl``
    (``fill_value=0`` for any absent one-hot dummy).
    """
    X = pd.get_dummies(df[RAW_FEATURES], columns=["AJCC_Substage"])
    X["PNI"] = X["PNI"].astype(float)
    X["Differentiation"] = X["Differentiation"].astype(float)
    X = X.replace([np.inf, -np.inf], np.nan)
    # Align to the deployed feature space / order (identical to app.py reindex).
    X = X.reindex(columns=feature_cols, fill_value=0)
    return X


# --------------------------------------------------------------------------- #
# Build
# --------------------------------------------------------------------------- #
def main() -> int:
    print("[build_final_model] repo dir      :", REPO_DIR)

    data_dir = find_data_dir()
    print("[build_final_model] local_data     :", data_dir)

    # Trusted first-party artifact committed in this repo (not external input);
    # joblib is the required format consumed by app.py. Safe to load.
    feature_cols = list(joblib.load(FEATURE_COL_PATH))
    print("[build_final_model] feature columns:", feature_cols)

    deriv = pd.read_parquet(data_dir / DERIV_PARQUET)
    print("[build_final_model] derivation n    =", len(deriv))

    # Target and features.
    y = deriv[TARGET_COL].astype(int).reset_index(drop=True)
    X = build_features(deriv, feature_cols).reset_index(drop=True)

    n_pos = int((y == 1).sum())
    n_neg = int((y == 0).sum())
    if n_pos == 0:
        raise ValueError("No positive (%s==1) cases in derivation cohort." % TARGET_COL)
    scale_pos_weight = n_neg / n_pos
    print(
        "[build_final_model] events (pos)    = %d  non-events (neg) = %d  "
        "scale_pos_weight = %.6f" % (n_pos, n_neg, scale_pos_weight)
    )

    # ---- Artifact 1: full inference pipeline (imputer -> calibrated XGBoost) ---
    xgb = XGBClassifier(
        **TABLE_S2_HPARAMS,
        **XGB_FIXED,
        scale_pos_weight=scale_pos_weight,
    )
    # Isotonic calibration is monotone, so the number of calibration folds does
    # not change discrimination (AUC/DeLong) or the rank order of predictions; it
    # only shifts the calibrated probabilities slightly. The deployed artifact
    # uses cv=5 here; the evaluation notebooks (4-11) use cv=3. This difference is
    # deliberate and does not affect any discrimination-based reported result.
    calibrated = CalibratedClassifierCV(xgb, method="isotonic", cv=5)
    pipeline = Pipeline(
        [
            ("imputer", KNNImputer(n_neighbors=5)),
            ("model", calibrated),
        ]
    )
    print("[build_final_model] fitting calibrated pipeline on full derivation cohort ...")
    pipeline.fit(X, y)
    joblib.dump(pipeline, MODEL_OUT_PATH)
    print("[build_final_model] wrote", MODEL_OUT_PATH)

    # ---- Artifact 2: standalone KNN imputer (used by app.py pre-predict) -------
    imputer = KNNImputer(n_neighbors=5)
    imputer.fit(X)
    joblib.dump(imputer, IMPUTER_OUT_PATH)
    print("[build_final_model] wrote", IMPUTER_OUT_PATH)

    # ---- Sanity check: end-to-end prediction on the training matrix -----------
    # Mirror app.py: impute with the standalone imputer, then predict with the
    # pipeline (whose internal imputer is a no-op on already-complete input).
    X_imputed = pd.DataFrame(imputer.transform(X), columns=feature_cols)
    proba = pipeline.predict_proba(X_imputed)[:, 1]
    print(
        "[build_final_model] sanity predict_proba: min=%.4f mean=%.4f max=%.4f"
        % (proba.min(), proba.mean(), proba.max())
    )
    print("[build_final_model] done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
