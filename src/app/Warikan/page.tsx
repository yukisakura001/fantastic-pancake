/* app/page.tsx */
"use client";

import React, { useState, useEffect } from "react";
import Modal from "../components/Modal";
import CircleIconButton from "../components/CircleIconButton";

/**
 * カスタムの NumericInput コンポーネント
 * - 文字列入力を都度保持し、blur したタイミングで数値変換
 * - parse に失敗したらアラート表示＆元値にロールバック
 */
function NumericInput({
  value,
  onChange,
  min,
  max,
  step,
  className,
  ...props
}: {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  const [innerValue, setInnerValue] = useState(String(value));

  // 親から value が更新された場合に追従
  useEffect(() => {
    setInnerValue(String(value));
  }, [value]);

  // 初回レンダリング時にのみ実行
  useEffect(() => {
    document.title = "傾斜計算";
  }, []);

  const handleBlur = () => {
    let parsed = parseInt(innerValue, 10);

    // parse 失敗時はアラート＋元値に戻す
    if (isNaN(parsed)) {
      alert("不正な入力です");
      setInnerValue(String(value));
      return;
    }

    // min/max がある場合のクリップ
    if (typeof min === "number" && parsed < min) parsed = min;
    if (typeof max === "number" && parsed > max) parsed = max;

    // 確定
    setInnerValue(String(parsed));
    onChange(parsed);
  };

  return (
    <input
      type="text"
      value={innerValue}
      onChange={(e) => setInnerValue(e.target.value)}
      onBlur={handleBlur}
      step={step}
      className={`border border-gray-400 rounded p-2 ${className ?? ""}`}
      {...props}
    />
  );
}

/**
 * 元の傾斜計算関数
 */
function calc_inclined_payment(
  roles: string[],
  num_people: number[],
  total_amount: number,
  default_tilt: number = 50,
  max_tilt: number = 100,
  user_role: string | null = null,
  usage_flag: boolean = false
) {
  const n_roles = roles.length;
  if (num_people.length !== n_roles) {
    throw new Error("roles と num_people の長さが合っていません。");
  }
  if (user_role !== null && !roles.includes(user_role)) {
    throw new Error(`user_role='${user_role}' は roles に存在しません。`);
  }

  let best_tilt: number | null = null;
  let best_payments: number[] | null = null;
  let best_diff = Infinity;
  let best_sum_payments: number | null = null;

  // -----------------------------
  // 1) デフォルト傾斜度付近から探索順を作成
  // -----------------------------
  for (let offset = 0; offset <= max_tilt; offset++) {
    const candidates: number[] = [];

    const lower = default_tilt - offset;
    const higher = default_tilt + offset;

    if (0 <= lower && lower <= max_tilt) {
      candidates.push(lower);
    }
    if (0 <= higher && higher <= max_tilt && higher !== lower) {
      candidates.push(higher);
    }

    // -----------------------------
    // 2) 候補の傾斜度を試し計算
    // -----------------------------
    for (const candidate_tilt of candidates) {
      const alpha = candidate_tilt / 100.0;

      // 役職ごとのウェイト計算
      const weights: number[] = [];
      for (let i = 0; i < n_roles; i++) {
        // i=0(上位) → i=n_roles-1(下位)
        // "上位ほどウェイト大" になるように
        const w = 1 + alpha * (n_roles - 1 - i);
        weights.push(w);
      }

      // ウェイトの総和
      let total_weight = 0;
      for (let i = 0; i < n_roles; i++) {
        total_weight += weights[i] * num_people[i];
      }

      // 役職ごとの「1人あたりのベース支払額」(1000円単位に丸め)
      const payments_per_role: number[] = [];
      for (let i = 0; i < n_roles; i++) {
        const ideal_per_person = (weights[i] / total_weight) * total_amount;
        const rounded_per_person = Math.round(ideal_per_person / 1000) * 1000;
        payments_per_role.push(rounded_per_person);
      }

      // この時点での合計金額 (調整前)
      let sum_payments = 0;
      for (let i = 0; i < n_roles; i++) {
        sum_payments += payments_per_role[i] * num_people[i];
      }

      // usage_flag=true かつ sum_payments < total_amount の場合はスキップ
      if (usage_flag && sum_payments < total_amount) {
        continue;
      }

      // 誤差 (端数)
      const diff = Math.abs(total_amount - sum_payments);

      // 誤差がより小さい場合のみ更新
      if (diff < best_diff) {
        best_diff = diff;
        best_tilt = candidate_tilt;
        best_payments = payments_per_role;
        best_sum_payments = sum_payments;
      }
    }
  }

  // -----------------------------
  // 3) 最小誤差パターンで最終調整
  //    (usage_flag=false の時のみ、不足分を計算者が負担)
  // -----------------------------
  if (best_sum_payments === null) {
    return {
      best_tilt: null,
      payments_per_role: null,
      user_role,
      user_payment: null,
      final_sum: null,
      initial_diff: null,
    };
  }

  const initial_diff = best_sum_payments - total_amount;
  let user_payment: number | null = null;
  let final_sum: number = best_sum_payments;

  if (user_role !== null && best_payments !== null) {
    const user_idx = roles.indexOf(user_role);
    const base_user_cost = best_payments[user_idx];

    if (initial_diff === 0) {
      // ピッタリ
      user_payment = base_user_cost;
      final_sum = best_sum_payments;
    } else if (initial_diff > 0) {
      // 合計が多い → 計算者を安くして吸収
      const adjusted_user_cost = base_user_cost - initial_diff;
      user_payment = adjusted_user_cost;
      final_sum = total_amount;
    } else {
      // initial_diff < 0 → 合計が不足
      // usage_flag=true なら既にスキップ済みなはず
      const adjusted_user_cost = base_user_cost - initial_diff; // diff は負なので加算
      user_payment = adjusted_user_cost;
      final_sum = total_amount;
    }
  } else {
    // 計算者なしの場合は合計値そのまま
    user_payment = null;
    final_sum = best_sum_payments;
  }

  return {
    best_tilt,
    payments_per_role: best_payments,
    user_role,
    user_payment,
    final_sum,
    initial_diff,
  };
}

export default function Page() {
  // デフォルトで「奴隷」を抜いたリスト
  const initialRolePeopleList = [
    { role: "部長", num: 7 },
    { role: "課長", num: 5 },
    { role: "課長代理", num: 7 },
    { role: "部下", num: 5 },
  ];

  // 役職・人数のリスト
  const [rolePeopleList, setRolePeopleList] = useState<
    { role: string; num: number }[]
  >(initialRolePeopleList);

  const [ModalOpen, setModalOpen] = useState(false);

  // 合計金額、デフォルト傾斜度など
  const [totalAmount, setTotalAmount] = useState(97560);
  const [defaultTilt, setDefaultTilt] = useState(50);
  // maxTilt は固定で 100
  // const [maxTilt, setMaxTilt] = useState(100); // 不要

  const [usageFlag, setUsageFlag] = useState(false);

  // 計算者の役職は「一番下の役職」を標準にする
  const [userRole, setUserRole] = useState(
    initialRolePeopleList[initialRolePeopleList.length - 1].role
  );

  // 計算結果表示用
  const [result, setResult] = useState<{
    best_tilt: number | null;
    payments_per_role: number[] | null;
    user_role: string | null;
    user_payment: number | null;
    final_sum: number | null;
    initial_diff: number | null;
  } | null>(null);

  // 計算者の役職候補は、rolePeopleList から取得してプルダウン表示
  const userRoleOptions = rolePeopleList.map((item) => item.role);

  /**
   * 指定した行の直下に新しい行を追加する
   */
  const handleAddRowBelow = (index: number) => {
    setRolePeopleList((prev) => {
      const newRow = { role: "", num: 1 };
      const newList = [...prev];
      // index+1 の位置に挿入
      newList.splice(index + 1, 0, newRow);
      return newList;
    });
  };

  // 役職・人数行を削除
  const handleRemoveRow = (index: number) => {
    setRolePeopleList((prev) => prev.filter((_, i) => i !== index));
  };

  // 役職・人数の変更
  const handleChangeRole = (index: number, newRole: string) => {
    setRolePeopleList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, role: newRole } : item))
    );
  };
  const handleChangeNum = (index: number, newNum: number) => {
    setRolePeopleList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, num: newNum } : item))
    );
  };

  // 計算実行
  const handleCalculate = () => {
    try {
      // 役職と人数をそれぞれ配列に分解
      const roles = rolePeopleList.map((item) => item.role);
      const num_people = rolePeopleList.map((item) => item.num);

      // 簡易バリデーション (役職が空欄ならエラー)
      if (roles.some((r) => !r.trim())) {
        throw new Error("役職が空欄の行があります。");
      }

      // 傾斜計算 (maxTilt を 100 に固定)
      const calcResult = calc_inclined_payment(
        roles,
        num_people,
        totalAmount,
        defaultTilt,
        100, // ← 固定
        userRole,
        usageFlag
      );
      setResult(calcResult);
    } catch (e) {
      alert("計算エラー: " + (e as Error).message);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      {/* 入力フォーム */}
      <section className="p-4">
        <CircleIconButton onClick={() => setModalOpen(true)} />
        <Modal isOpen={ModalOpen} onClose={() => setModalOpen(false)}>
          <div className=" mx-auto p-4 bg-white">
            <h1 className="text-2xl font-bold text-amber-800 mb-4">
              飲み会傾斜計算トッピングの使い方
            </h1>

            <div className="space-y-4">
              {/* その1 */}
              <div className="flex items-start space-x-2">
                <span className="text-amber-700 font-bold whitespace-nowrap flex-shrink-0">
                  その1
                </span>
                <p className="text-gray-700">
                  役職名・人数・合計金額・傾斜度・計算者の役職を入力してください。
                </p>
              </div>

              {/* その2 */}
              <div className="flex items-start space-x-2">
                <span className="text-amber-700 font-bold whitespace-nowrap flex-shrink-0">
                  その2
                </span>
                <p className="text-gray-700">
                  もし計算者が役職以上の金額を調整しなくても良い時（優遇されるとき）は、チェックボックスにチェックを付けてください。
                </p>
              </div>

              {/* その3 */}
              <div className="flex items-start space-x-2">
                <span className="text-amber-700 font-bold whitespace-nowrap flex-shrink-0">
                  その3
                </span>
                <p className="text-gray-700">
                  計算するボタンを押すと、各役職と計算者の最適な費用が表示されます。もし問題があれば傾斜などを調整してもう一度計算してください。
                </p>
              </div>
            </div>
          </div>
        </Modal>
        <h2 className="text-xl font-semibold my-4">入力フォーム</h2>

        {/* 役職・人数リスト */}
        <div className="space-y-4 mb-6">
          {rolePeopleList.map((row, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-2">
              {/* 役職名 */}
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  役職 {index + 1}
                </label>
                <input
                  type="text"
                  value={row.role}
                  onChange={(e) => handleChangeRole(index, e.target.value)}
                  className="border border-gray-400 rounded p-2 w-full"
                  placeholder="例: 部長"
                />
              </div>

              {/* 人数 */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  人数 {index + 1}
                </label>
                <NumericInput
                  value={row.num}
                  onChange={(val) => handleChangeNum(index, val)}
                  min={0}
                  className="w-32"
                />
              </div>

              {/* 削除ボタン */}
              <button
                type="button"
                onClick={() => handleRemoveRow(index)}
                className="mt-6 md:mt-auto bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                削除
              </button>

              {/* 追加ボタン */}
              <button
                type="button"
                onClick={() => handleAddRowBelow(index)}
                className="mt-6 md:mt-auto bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                追加
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 合計金額 */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">合計金額(円)</label>
            <NumericInput
              value={totalAmount}
              onChange={(val) => setTotalAmount(val)}
              min={0}
              className="w-full"
            />
          </div>

          {/* デフォルト傾斜度: スライダー */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">
              デフォルト傾斜度(%) : {defaultTilt}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={defaultTilt}
              onChange={(e) => setDefaultTilt(Number(e.target.value))}
            />
          </div>

          {/* 計算者の役職 (プルダウン) */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">計算者の役職</label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="border border-gray-400 rounded p-2"
            >
              {userRoleOptions.map((roleOpt, idx) => (
                <option key={idx} value={roleOpt}>
                  {roleOpt}
                </option>
              ))}
            </select>
          </div>

          {/* 不足案スキップ */}
          <label className="flex items-center gap-2 mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={usageFlag}
              onChange={(e) => setUsageFlag(e.target.checked)}
              className="h-6 w-6"
            />
            <span className="font-medium text-sm">計算者優遇モード</span>
          </label>
        </div>

        <div className="mt-6">
          <button
            onClick={handleCalculate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            計算する
          </button>
        </div>
      </section>

      {/* 計算結果 (モダンなカードデザイン) */}
      <section>
        <h2 className="text-xl font-semibold mb-4">計算結果</h2>
        {result ? (
          <div className="bg-white rounded shadow p-6 space-y-4">
            {/* グリッドで結果を表示 */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="text-gray-600 text-sm">最適傾斜度</div>
              <div className="text-gray-900 font-semibold">
                {result.best_tilt !== null ? `${result.best_tilt}%` : "なし"}
              </div>

              <div className="text-gray-600 text-sm">過不足額（調整前）</div>
              <div className="text-gray-900 font-semibold">
                {result.initial_diff !== null
                  ? `${result.initial_diff} 円`
                  : "-"}
              </div>

              <div className="text-gray-600 text-sm">合計支払額</div>
              <div className="text-gray-900 font-semibold">
                {result.final_sum !== null ? `${result.final_sum} 円` : "-"}
              </div>

              <div className="text-gray-600 text-sm">計算者の役職</div>
              <div className="text-gray-900 font-semibold">
                {result.user_role || "なし"}
              </div>

              <div className="text-gray-600 text-sm">計算者の支払額</div>
              <div className="text-gray-900 font-semibold">
                {result.user_payment !== null
                  ? `${result.user_payment} 円`
                  : "－"}
              </div>
            </div>

            {/* 役職ごとのベース単価 */}
            {result.payments_per_role && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold mb-2 text-gray-700">
                  役職別ごとの支払い額
                </h4>
                <div className="space-y-2">
                  {rolePeopleList.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-sm"
                    >
                      <span className="text-gray-700">{item.role}</span>
                      <span className="font-semibold">
                        {result.payments_per_role?.[i]} 円
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p>まだ計算していません。</p>
        )}
      </section>
    </div>
  );
}
