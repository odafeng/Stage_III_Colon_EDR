"""
build_notebooks.py
Construct the three teaching notebooks (clean, beginner-friendly) and
write them into ./Notebooks. Run with nbconvert afterwards to execute.

All analysis runs on the *synthetic* demo data in ./Data — no real patients.
"""
import nbformat as nbf
from nbformat.v4 import new_notebook, new_markdown_cell, new_code_cell
import os

os.makedirs("Notebooks", exist_ok=True)

PLOT_STYLE = """import matplotlib.pyplot as plt
plt.rcParams.update({
    'figure.dpi': 110, 'savefig.dpi': 140, 'font.size': 12,
    'axes.spines.top': False, 'axes.spines.right': False,
    'axes.grid': True, 'grid.alpha': 0.25, 'figure.facecolor': 'white',
})
ACCENT = '#2f6df6'; ACCENT2 = '#f6862f'; GREY = '#9aa3b2'
"""

# ----------------------------------------------------------------------
# Notebook 1 — Feature Selection
# ----------------------------------------------------------------------
nb1 = new_notebook()
nb1.cells = [
    new_markdown_cell(
        "# 1 · Feature Selection（特徵選擇）\n"
        "**目標 Outcome：** 從候選變項中，挑出能預測「Stage III 大腸癌 18 個月早期遠端復發 (EDR-18)」的精簡特徵。\n\n"
        "**方法 Methods：** LASSO logistic regression ＋ XGBoost feature importance。\n\n"
        "> 🧪 本 Notebook 使用 `./Data/synthetic_derivation.csv`（**完全虛構**的示範資料，無真實病人）。"
    ),
    new_markdown_cell("## 1. 載入套件與資料"),
    new_code_cell(
        "import numpy as np, pandas as pd\n" + PLOT_STYLE +
        "\ndf = pd.read_csv('../Data/synthetic_derivation.csv')\n"
        "print('資料維度 shape:', df.shape)\n"
        "df.head()"
    ),
    new_code_cell(
        "features = ['AJCC_Substage', 'LNR', 'Differentiation', 'PNI']\n"
        "X = df[features].astype(float)\n"
        "y = df['edr_18m'].astype(int)\n"
        "print('EDR-18 盛行率:', round(y.mean(), 3))\n"
        "df[features + ['edr_18m']].describe().round(2)"
    ),
    new_markdown_cell("## 2. LASSO Logistic Regression\n以 L1 懲罰找出稀疏（精簡）的預測子集合。"),
    new_code_cell(
        "from sklearn.linear_model import LogisticRegressionCV\n"
        "from sklearn.preprocessing import StandardScaler\n"
        "Xs = StandardScaler().fit_transform(X)\n"
        "lasso = LogisticRegressionCV(Cs=20, cv=5, penalty='l1', solver='liblinear',\n"
        "                             scoring='roc_auc', max_iter=2000, random_state=42)\n"
        "lasso.fit(Xs, y)\n"
        "coef = pd.Series(lasso.coef_[0], index=features).sort_values()\n"
        "print('最佳 C:', round(float(lasso.C_[0]), 4))\n"
        "coef"
    ),
    new_markdown_cell("## 3. XGBoost Feature Importance"),
    new_code_cell(
        "from xgboost import XGBClassifier\n"
        "xgb = XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.05,\n"
        "                    subsample=0.9, colsample_bytree=0.9, eval_metric='logloss',\n"
        "                    random_state=42)\n"
        "xgb.fit(X, y)\n"
        "imp = pd.Series(xgb.feature_importances_, index=features).sort_values()\n"
        "imp"
    ),
    new_markdown_cell("## 4. 視覺化並存檔到 `../Figures/`\n> 📌 重點：圖表的程式碼留在 Notebook → 之後要改字、改顏色，只要改這格、重跑即可。"),
    new_code_cell(
        "fig, axes = plt.subplots(1, 2, figsize=(11, 4.2))\n"
        "coef.plot.barh(ax=axes[0], color=ACCENT)\n"
        "axes[0].set_title('LASSO coefficients'); axes[0].axvline(0, color=GREY, lw=1)\n"
        "imp.plot.barh(ax=axes[1], color=ACCENT2)\n"
        "axes[1].set_title('XGBoost feature importance')\n"
        "fig.suptitle('Feature selection — derivation cohort (synthetic)', fontweight='bold')\n"
        "fig.tight_layout()\n"
        "import os; os.makedirs('../Figures', exist_ok=True)\n"
        "fig.savefig('../Figures/fig1_feature_selection.png', bbox_inches='tight')\n"
        "print('已存檔 → ../Figures/fig1_feature_selection.png')"
    ),
    new_markdown_cell(
        "## ✅ 小結\n"
        "兩種方法都指向同一組精簡特徵：**AJCC_Substage、LNR、Differentiation、PNI**。\n"
        "下一個 Notebook 用這四個變項建立並校準最終模型。"
    ),
]

# ----------------------------------------------------------------------
# Notebook 2 — Model Development
# ----------------------------------------------------------------------
nb2 = new_notebook()
nb2.cells = [
    new_markdown_cell(
        "# 2 · Model Development（模型開發）\n"
        "**Outcome：** 用四個變項建立 EDR-18 的 XGBoost 模型，並做機率校準與風險分層。\n\n"
        "**Methods：** Cross-validated predictions → ROC / Calibration → Youden 閾值 → Kaplan–Meier。\n\n"
        "> 🧪 一樣使用虛構示範資料。"
    ),
    new_markdown_cell("## 1. 載入資料與套件"),
    new_code_cell(
        "import numpy as np, pandas as pd, os\n" + PLOT_STYLE +
        "\ndf = pd.read_csv('../Data/synthetic_derivation.csv')\n"
        "features = ['AJCC_Substage', 'LNR', 'Differentiation', 'PNI']\n"
        "X, y = df[features].astype(float), df['edr_18m'].astype(int)\n"
        "df.head()"
    ),
    new_markdown_cell("## 2. 交叉驗證的預測機率（避免過度樂觀）"),
    new_code_cell(
        "from xgboost import XGBClassifier\n"
        "from sklearn.model_selection import cross_val_predict, StratifiedKFold\n"
        "from sklearn.calibration import CalibratedClassifierCV\n"
        "base = XGBClassifier(n_estimators=200, max_depth=3, learning_rate=0.05,\n"
        "                     subsample=0.9, colsample_bytree=0.9, eval_metric='logloss', random_state=42)\n"
        "clf = CalibratedClassifierCV(base, method='isotonic', cv=3)\n"
        "cv = StratifiedKFold(5, shuffle=True, random_state=42)\n"
        "oof = cross_val_predict(clf, X, y, cv=cv, method='predict_proba')[:, 1]\n"
        "print('out-of-fold 預測完成，n =', len(oof))"
    ),
    new_markdown_cell("## 3. ROC 曲線 + AUC → 存檔"),
    new_code_cell(
        "from sklearn.metrics import roc_curve, roc_auc_score, brier_score_loss\n"
        "fpr, tpr, thr = roc_curve(y, oof)\n"
        "auc = roc_auc_score(y, oof)\n"
        "j = np.argmax(tpr - fpr); cutoff = thr[j]\n"
        "fig, ax = plt.subplots(figsize=(5.2, 5))\n"
        "ax.plot(fpr, tpr, color=ACCENT, lw=2.5, label=f'XGBoost (AUC = {auc:.3f})')\n"
        "ax.plot([0,1],[0,1], '--', color=GREY)\n"
        "ax.scatter(fpr[j], tpr[j], color=ACCENT2, zorder=5, label=f'Youden cutoff = {cutoff:.2f}')\n"
        "ax.set_xlabel('1 − Specificity'); ax.set_ylabel('Sensitivity')\n"
        "ax.set_title('ROC — cross-validated (synthetic)', fontweight='bold'); ax.legend(loc='lower right')\n"
        "os.makedirs('../Figures', exist_ok=True)\n"
        "fig.savefig('../Figures/fig2_roc.png', bbox_inches='tight')\n"
        "print(f'AUC={auc:.3f}  Brier={brier_score_loss(y, oof):.3f}  cutoff={cutoff:.3f}')"
    ),
    new_markdown_cell("## 4. 校準曲線（預測機率 vs 實際）→ 存檔"),
    new_code_cell(
        "from sklearn.calibration import calibration_curve\n"
        "frac_pos, mean_pred = calibration_curve(y, oof, n_bins=8, strategy='quantile')\n"
        "fig, ax = plt.subplots(figsize=(5.2, 5))\n"
        "ax.plot([0,1],[0,1], '--', color=GREY, label='Perfect')\n"
        "ax.plot(mean_pred, frac_pos, 'o-', color=ACCENT, lw=2, label='Model')\n"
        "ax.set_xlabel('Predicted probability'); ax.set_ylabel('Observed frequency')\n"
        "ax.set_title('Calibration (synthetic)', fontweight='bold'); ax.legend(loc='upper left')\n"
        "fig.savefig('../Figures/fig3_calibration.png', bbox_inches='tight')\n"
        "print('已存檔 → ../Figures/fig3_calibration.png')"
    ),
    new_markdown_cell("## 5. 風險分層 + Kaplan–Meier（DFS）→ 存檔\n用 Youden 閾值把病人分成高 / 低風險，畫無病存活曲線。"),
    new_code_cell(
        "def km_curve(time, event):\n"
        "    order = np.argsort(time); t = np.asarray(time)[order]; e = np.asarray(event)[order]\n"
        "    uniq = np.unique(t); surv = 1.0; xs=[0]; ys=[1.0]; n = len(t)\n"
        "    at_risk = n\n"
        "    for ut in uniq:\n"
        "        d = np.sum((t == ut) & (e == 1)); atr = np.sum(t >= ut)\n"
        "        if atr > 0: surv *= (1 - d/atr)\n"
        "        xs.append(ut); ys.append(surv)\n"
        "    return np.array(xs), np.array(ys)\n"
        "\n"
        "df['risk'] = np.where(oof >= cutoff, 'High risk', 'Low risk')\n"
        "fig, ax = plt.subplots(figsize=(6.2, 5))\n"
        "for grp, col in [('Low risk', ACCENT), ('High risk', ACCENT2)]:\n"
        "    sub = df[df.risk == grp]\n"
        "    xs, ys = km_curve(sub['DFS_Months'], sub['DFS_Events'])\n"
        "    ax.step(xs, ys, where='post', color=col, lw=2.5, label=f'{grp} (n={len(sub)})')\n"
        "ax.set_xlabel('Months'); ax.set_ylabel('Disease-free survival'); ax.set_ylim(0, 1.02)\n"
        "ax.set_title('Risk-stratified KM — derivation (synthetic)', fontweight='bold'); ax.legend()\n"
        "fig.savefig('../Figures/fig4_km_derivation.png', bbox_inches='tight')\n"
        "print('已存檔 → ../Figures/fig4_km_derivation.png')"
    ),
    new_markdown_cell("## 6. 匯出績效表到 `../Tables/` 並存模型"),
    new_code_cell(
        "from sklearn.metrics import confusion_matrix\n"
        "pred = (oof >= cutoff).astype(int)\n"
        "tn, fp, fn, tp = confusion_matrix(y, pred).ravel()\n"
        "metrics = pd.DataFrame({'Metric': ['AUC','Brier','Sensitivity','Specificity','PPV','NPV','Cutoff'],\n"
        "    'Value': [round(auc,3), round(brier_score_loss(y,oof),3), round(tp/(tp+fn),3),\n"
        "              round(tn/(tn+fp),3), round(tp/(tp+fp),3), round(tn/(tn+fn),3), round(cutoff,3)]})\n"
        "os.makedirs('../Tables', exist_ok=True)\n"
        "metrics.to_csv('../Tables/table1_performance.csv', index=False)\n"
        "import joblib; clf.fit(X, y); joblib.dump({'model': clf, 'features': features, 'cutoff': float(cutoff)},\n"
        "    '../Data/demo_model.joblib')\n"
        "print('已存檔 → ../Tables/table1_performance.csv  與  ../Data/demo_model.joblib')\n"
        "metrics"
    ),
    new_markdown_cell("## ✅ 小結\n模型、閾值、所有圖表的「產生程式碼」都留在 Notebook 裡。\nReviewer 要求修改時 → 改一格、重跑、結果就重現了。"),
]

# ----------------------------------------------------------------------
# Notebook 3 — External Validation
# ----------------------------------------------------------------------
nb3 = new_notebook()
nb3.cells = [
    new_markdown_cell(
        "# 3 · External Validation（外部驗證）\n"
        "**Outcome：** 把第 2 個 Notebook 建好的模型，原封不動套用到「獨立的外部世代」。\n\n"
        "**Methods：** 不重新訓練，直接預測 → ROC / Brier / KM。\n\n"
        "> 🧪 使用虛構的 `./Data/synthetic_external.csv`。"
    ),
    new_markdown_cell("## 1. 載入外部世代與已存模型"),
    new_code_cell(
        "import numpy as np, pandas as pd, joblib, os\n" + PLOT_STYLE +
        "\next = pd.read_csv('../Data/synthetic_external.csv')\n"
        "bundle = joblib.load('../Data/demo_model.joblib')\n"
        "model, features, cutoff = bundle['model'], bundle['features'], bundle['cutoff']\n"
        "print('外部世代 shape:', ext.shape, '| 使用閾值:', round(cutoff,3))\n"
        "ext.head()"
    ),
    new_markdown_cell("## 2. 套用模型（**不重新訓練**）"),
    new_code_cell(
        "Xe = ext[features].astype(float)\n"
        "ye = ext['edr_18m'].astype(int)\n"
        "prob = model.predict_proba(Xe)[:, 1]\n"
        "ext['risk'] = np.where(prob >= cutoff, 'High risk', 'Low risk')\n"
        "ext['risk'].value_counts()"
    ),
    new_markdown_cell("## 3. 外部 ROC + Brier → 存檔"),
    new_code_cell(
        "from sklearn.metrics import roc_curve, roc_auc_score, brier_score_loss\n"
        "fpr, tpr, _ = roc_curve(ye, prob); auc = roc_auc_score(ye, prob)\n"
        "fig, ax = plt.subplots(figsize=(5.2, 5))\n"
        "ax.plot(fpr, tpr, color='#2f6df6', lw=2.5, label=f'External (AUC = {auc:.3f})')\n"
        "ax.plot([0,1],[0,1],'--', color=GREY)\n"
        "ax.set_xlabel('1 − Specificity'); ax.set_ylabel('Sensitivity')\n"
        "ax.set_title('External validation ROC (synthetic)', fontweight='bold'); ax.legend(loc='lower right')\n"
        "os.makedirs('../Figures', exist_ok=True)\n"
        "fig.savefig('../Figures/fig5_roc_external.png', bbox_inches='tight')\n"
        "print(f'External AUC = {auc:.3f} | Brier = {brier_score_loss(ye, prob):.3f}')"
    ),
    new_markdown_cell("## 4. 外部 Kaplan–Meier → 存檔"),
    new_code_cell(
        "def km_curve(time, event):\n"
        "    t = np.asarray(time); e = np.asarray(event); uniq = np.unique(t)\n"
        "    surv = 1.0; xs=[0]; ys=[1.0]\n"
        "    for ut in uniq:\n"
        "        d = np.sum((t == ut) & (e == 1)); atr = np.sum(t >= ut)\n"
        "        if atr > 0: surv *= (1 - d/atr)\n"
        "        xs.append(ut); ys.append(surv)\n"
        "    return np.array(xs), np.array(ys)\n"
        "fig, ax = plt.subplots(figsize=(6.2, 5))\n"
        "for grp, col in [('Low risk', '#2f6df6'), ('High risk', '#f6862f')]:\n"
        "    sub = ext[ext.risk == grp]; xs, ys = km_curve(sub['DFS_Months'], sub['DFS_Events'])\n"
        "    ax.step(xs, ys, where='post', color=col, lw=2.5, label=f'{grp} (n={len(sub)})')\n"
        "ax.set_xlabel('Months'); ax.set_ylabel('Disease-free survival'); ax.set_ylim(0,1.02)\n"
        "ax.set_title('External KM (synthetic)', fontweight='bold'); ax.legend()\n"
        "fig.savefig('../Figures/fig6_km_external.png', bbox_inches='tight')\n"
        "print('已存檔 → ../Figures/fig6_km_external.png')"
    ),
    new_markdown_cell(
        "## ✅ 全流程完成\n"
        "`Data → Notebooks → Figures / Tables`，每一步都可重現。\n\n"
        "這就是用 AI Agent 協助、但**結果完全由你掌控、可重現**的研究工作流程。"
    ),
]

for name, nb in [("1_Feature_Selection.ipynb", nb1),
                 ("2_Model_Development.ipynb", nb2),
                 ("3_External_Validation.ipynb", nb3)]:
    nb.metadata = {"kernelspec": {"name": "python3", "display_name": "Python 3"},
                   "language_info": {"name": "python"}}
    with open(f"Notebooks/{name}", "w", encoding="utf-8") as f:
        nbf.write(nb, f)
    print("written:", name)
