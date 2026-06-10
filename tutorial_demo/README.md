# 教學示範專案 · Reproducible Research Workflow (Demo)

> 這是搭配教學影片的**示範專案**。所有資料皆為 **100% 虛構（synthetic）**，
> 不含任何真實病人資料，僅用來展示「結構化資料夾 ＋ Notebook 工作流程」。

本示範重現了一個臨床機器學習研究的骨架：預測 Stage III 大腸癌
**18 個月早期遠端復發 (EDR-18)**，使用四個精簡變項
（AJCC 分期、淋巴結比例 LNR、分化程度、神經侵犯 PNI）。

## 📁 結構化資料夾

```text
tutorial_demo/
├── Data/        # 資料（這裡放虛構資料 + 產生腳本）
│   ├── make_synthetic_data.py
│   ├── synthetic_derivation.csv
│   └── synthetic_external.csv
├── Notebooks/   # ⭐ 分析過程都寫成 .ipynb → 可重現、好修改
│   ├── 1_Feature_Selection.ipynb
│   ├── 2_Model_Development.ipynb
│   └── 3_External_Validation.ipynb
├── Figures/     # 由 Notebook 自動產生的圖（程式碼留在 Notebook）
└── Tables/      # 由 Notebook 自動產生的表
```

> 💡 影片提到的 `Report/` 資料夾在本示範中先省略。

## ▶️ 重現步驟

```bash
# 1) 安裝套件
pip install numpy pandas scikit-learn xgboost matplotlib jupyterlab

# 2) 產生虛構示範資料
cd Data && python make_synthetic_data.py && cd ..

# 3) 依序執行 Notebooks（或在 JupyterLab 逐格執行）
cd Notebooks
jupyter nbconvert --to notebook --execute --inplace 1_Feature_Selection.ipynb
jupyter nbconvert --to notebook --execute --inplace 2_Model_Development.ipynb
jupyter nbconvert --to notebook --execute --inplace 3_External_Validation.ipynb
```

## 🔁 為什麼把分析寫成 Notebook？

1. **可重現性**：Reviewer 要求修改時，只要改 Notebook 裡那一格 Script、重跑，
   就能得到一致、可重現的結果。
2. **方便修正**：連「圖表」也用 Notebook 產生 —— 之後要改字、改顏色、調細節，
   重現與修改都很容易。

## ⚠️ 重要提醒：Reference Hallucination（文獻幻覺）

AI 很適合協助「分析與寫程式」，但**引用文獻時務必逐篇查證**。
在沒有高階 harness（評估框架）支援下，目前的 AI 仍可能編造看似真實、
實則不存在的參考文獻。撰寫 Manuscript 時，每一篇 reference 都要親自核對。
