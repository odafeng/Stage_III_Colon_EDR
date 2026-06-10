"""
make_synthetic_data.py
------------------------------------------------------------------
為「教學示範」產生 *完全虛構* 的資料集，模擬 Stage III 大腸癌
18 個月早期遠端復發 (EDR-18) 的研究情境。

⚠️  這裡沒有任何真實病人資料。所有數字都是用亂數產生的，
    僅供教學影片示範「結構化資料夾 + Notebook 工作流程」之用。

四個示範特徵（對應原始研究的精簡模型）：
  - AJCC_Substage : 分期 (1=IIIA, 2=IIIB, 3=IIIC)，序數
  - LNR           : 淋巴結比例 Lymph Node Ratio (0~1)，連續
  - Differentiation: 分化程度 (1=well, 2=moderate, 3=poor)
  - PNI           : 神經侵犯 Perineural Invasion (0/1)

結果變項：
  - edr_18m       : 18 個月內是否早期遠端復發 (0/1)
  - DFS_Months    : 無病存活時間（月）
  - DFS_Events    : 事件 (1=復發/死亡, 0=censored)
"""
import numpy as np
import pandas as pd

def make_cohort(n, seed, shift=0.0):
    rng = np.random.default_rng(seed)
    ajcc = rng.choice([1, 2, 3], size=n, p=[0.35, 0.45, 0.20])
    lnr = np.clip(rng.beta(1.6, 6.0, size=n) + 0.03 * (ajcc - 2), 0, 1)
    diff = rng.choice([1, 2, 3], size=n, p=[0.25, 0.55, 0.20])
    pni = rng.binomial(1, p=np.clip(0.12 + 0.10 * (ajcc - 1) + 0.08 * pni_diff(diff), 0.02, 0.8))

    # 線性預測子（虛構係數），加上 shift 模擬外部世代分布差異
    lin = (-2.6 + shift
           + 0.55 * (ajcc - 1)
           + 2.4 * lnr
           + 0.45 * (diff - 1)
           + 0.7 * pni
           + rng.normal(0, 0.5, size=n))
    p_edr = 1 / (1 + np.exp(-lin))
    edr = rng.binomial(1, p_edr)

    # 存活時間：風險越高，越早復發
    base = rng.exponential(scale=40.0, size=n)
    time = base / (1 + 1.8 * p_edr)
    time = np.clip(time, 1, 60)
    event = ((edr == 1) | (rng.random(n) < 0.15)).astype(int)
    # EDR-18 與 18 個月內事件一致化
    time = np.where(edr == 1, np.minimum(time, rng.uniform(3, 18, size=n)), time)

    return pd.DataFrame({
        "PatientID": [f"DEMO-{seed%100:02d}-{i:04d}" for i in range(n)],
        "AJCC_Substage": ajcc,
        "LNR": np.round(lnr, 3),
        "Differentiation": diff,
        "PNI": pni,
        "edr_18m": edr,
        "DFS_Months": np.round(time, 1),
        "DFS_Events": event,
    })

def pni_diff(diff):
    return (diff - 1) / 2.0

if __name__ == "__main__":
    deriv = make_cohort(n=620, seed=20260601, shift=0.0)
    ext = make_cohort(n=300, seed=19990307, shift=0.25)
    deriv.to_csv("synthetic_derivation.csv", index=False)
    ext.to_csv("synthetic_external.csv", index=False)
    print("Derivation cohort:", deriv.shape, "EDR-18 rate:", round(deriv.edr_18m.mean(), 3))
    print("External cohort:  ", ext.shape, "EDR-18 rate:", round(ext.edr_18m.mean(), 3))
    print("\n[demo only — 100% synthetic, no real patient data]")
