"use client";
import React, {
  ChangeEvent,
  KeyboardEvent,
  MouseEvent,
  useState,
  useRef,
  useEffect,
} from "react";
import Papa from "papaparse";
import CircleIconButton from "../components/CircleIconButton";
import Modal from "../components/Modal";

/**
 * CSVファイルの各行の型（空文字も入り得るので一応 ? を付ける）
 */
interface CsvRow {
  設問?: string;
  選択肢?: string;
  解答?: string;
  参考?: string;
}

/**
 * 本アプリケーションが扱うクイズデータの型
 */
interface QuizItem {
  keyWord: string;
  sanko: string;
  selectData: string[];
  marubatuData: string[];
}

export default function ToolAPage() {
  useEffect(() => {
    document.title = "選択問題";
  }, []); // 空配列で初回レンダリング時のみ実行

  // ------------------------ State 定義 ------------------------ //
  const [quizData, setQuizData] = useState<QuizItem[]>([]); // CSV加工後のクイズデータ
  const [fileContent, setFileContent] = useState<string>(""); // CSVファイル内容

  const [mondai, setMondai] = useState<string>(""); // 設問
  const [sanko1, setSanko] = useState<string>(""); // 参考
  const [sentaku, setSentaku] = useState<string[]>([]); // 選択肢
  const [ans, setAns] = useState<string[]>([]); // 解答 (〇 or "")
  const [id, setId] = useState<number>(0); // 現在の問題ID（配列のindex）
  const [correct, setCorrect] = useState<boolean[]>([]); // 正解／不正解を配列で管理
  const [ModalOpen, setModalOpen] = useState<boolean>(false);

  // 参考表示用
  const [sanko_check, setSankoCheck] = useState<boolean>(false);

  // チェックボックスの参照を複数管理
  const checkboxRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 問題ジャンプ用
  const [jump, setJump] = useState<number>(1);

  // 追加：文字コード選択用
  const [csvEncoding, setCsvEncoding] = useState<"UTF-8" | "Shift_JIS">(
    "Shift_JIS"
  );

  // ------------------------ イベントハンドラ ------------------------ //

  /**
   * CSVファイルが変更された時の処理
   */
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      // ArrayBuffer で読み込み → TextDecoder(選択されたエンコーディング) で文字列に変換
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const result = ev.target?.result;
        if (result instanceof ArrayBuffer) {
          // ここで選択された文字コードを適用
          const decoder = new TextDecoder(csvEncoding);
          const decodedStr = decoder.decode(new Uint8Array(result));
          setFileContent(decodedStr);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // 状態リセット
    resetQuiz();
  };

  /**
   * CSVをパースして QuizData を生成する共通関数
   * @param {string} fileStr CSVファイルの内容
   * @returns {Promise<QuizItem[]>} 整形後のクイズデータ配列
   */
  const parseAndGenerateQuizData = (fileStr: string): Promise<QuizItem[]> => {
    return new Promise((resolve) => {
      Papa.parse<CsvRow>(fileStr, {
        header: true,
        complete: (results) => {
          const originData = results.data;
          let keyWord = originData[0]?.["設問"] || "";
          let sanko = originData[0]?.["参考"] || "";
          const newQuizData: QuizItem[] = [];
          let selectData: string[] = [];
          let marubatuData: string[] = [];

          for (let i = 0; i < originData.length; i++) {
            const currentRow = originData[i];
            const current設問 = currentRow["設問"] || "";
            const current選択肢 = currentRow["選択肢"] || "";
            const current解答 = currentRow["解答"] || "";
            const current参考 = currentRow["参考"] || "";

            // i=0 のときの初期セット
            if (i === 0) {
              keyWord = current設問;
              sanko = current参考;
              selectData.push(current選択肢);
              marubatuData.push(current解答);
            }
            // ファイル最後の要素（次の設問が現れなかった場合も push）
            else if (i === originData.length - 1) {
              // もし空行のような場合は処理をスキップ（ただし、最後に必ずpushするなら要検討）
              if (current選択肢 === "" && current設問 === "") {
                newQuizData.push({
                  keyWord,
                  sanko,
                  selectData,
                  marubatuData,
                });
              } else {
                // 最後に何か選択肢があればpush
                if (current選択肢 !== "") {
                  selectData.push(current選択肢);
                  marubatuData.push(current解答);
                }
                newQuizData.push({
                  keyWord,
                  sanko,
                  selectData,
                  marubatuData,
                });
              }
            }
            // 選択肢が空行の場合はスキップ
            else if (current選択肢 === "") {
              continue;
            }
            // 設問が空なら同じ設問継続
            else if (current設問 === "") {
              selectData.push(current選択肢);
              marubatuData.push(current解答);
            }
            // 新しい設問の開始
            else if (current設問 !== "") {
              newQuizData.push({
                keyWord,
                sanko,
                selectData,
                marubatuData,
              });
              keyWord = current設問;
              sanko = current参考;
              selectData = [];
              marubatuData = [];
              selectData.push(current選択肢);
              marubatuData.push(current解答);
            }
          }

          // A. を削除する処理
          for (let i = 0; i < newQuizData.length; i++) {
            for (let j = 0; j < newQuizData[i].selectData.length; j++) {
              newQuizData[i].selectData[j] = newQuizData[i].selectData[
                j
              ].replace(ChangeNumberToAlphabets(j) + ".", "");
            }
          }
          resolve(newQuizData);
        },
      });
    });
  };

  /**
   * 問題を順番に表示する
   */
  const startQuiz = async (): Promise<void> => {
    if (!fileContent) {
      alert("ファイルをアップロードしてください");
      return;
    }
    resetCheckboxes();
    const newQuizData = await parseAndGenerateQuizData(fileContent);
    setQuizData(newQuizData);
    // 最初の問題表示
    showQuestion(newQuizData, 0);
    setCorrect([]);
    uncheckAll();
  };

  /**
   * ランダムに問題を表示する
   */
  const randomQuiz = async (): Promise<void> => {
    if (!fileContent) {
      alert("ファイルをアップロードしてください");
      return;
    }
    resetCheckboxes();
    let newQuizData = await parseAndGenerateQuizData(fileContent);

    // 全体をシャッフル & 選択肢も合わせてシャッフル
    newQuizData = shuffleArray<QuizItem>(newQuizData);
    for (let i = 0; i < newQuizData.length; i++) {
      const [shuffledSelects, shuffledMaruBatsu] = shuffleAndSwapArrays(
        newQuizData[i].selectData,
        newQuizData[i].marubatuData
      );
      newQuizData[i].selectData = shuffledSelects;
      newQuizData[i].marubatuData = shuffledMaruBatsu;
    }

    setQuizData(newQuizData);
    // 最初の問題を表示
    showQuestion(newQuizData, 0);
    setCorrect([]);
    uncheckAll();
  };

  /**
   * 次の問題へ進む
   */
  const nextQuestion = (): void => {
    if (!fileContent) {
      alert("ファイルをアップロードしてください");
      return;
    }
    if (id + 1 < quizData.length) {
      resetCheckboxes();
      const nextId = id + 1;
      showQuestion(quizData, nextId);
    } else {
      // 最終問題の場合は結果表示
      const result = countAndPercentage(correct);
      const hantei = window.confirm(
        `終了！正解数: ${result.trueCount} / ${result.totalCount} (${Math.round(
          result.truePercentage
        )}%)\nもう一度最初から始めますか？`
      );
      if (hantei) {
        resetCheckboxes();
        showQuestion(quizData, 0);
        setCorrect([]);
      }
    }
  };

  /**
   * 答え合わせ
   */
  const answerShow = (): void => {
    if (!fileContent) {
      alert("ファイルをアップロードしてください");
      return;
    }
    setSankoCheck(true);

    // ユーザ回答インデックス
    const userAnswers = checkboxRefs.current
      .map((checkbox, index) => (checkbox && checkbox.checked ? index : null))
      .filter((index) => index !== null) as number[];

    // 正解インデックス
    const correctAnswers = ans
      .map((answer, index) => (answer === "〇" ? index : null))
      .filter((index) => index !== null) as number[];

    // 正誤判定
    const isCorrect =
      userAnswers.length === correctAnswers.length &&
      userAnswers.every((answer) => correctAnswers.includes(answer));

    // チェックボックスのラベル色を結果に合わせて変化
    checkboxRefs.current.forEach((checkbox, index) => {
      if (!checkbox) return;
      if (checkbox.nextSibling instanceof HTMLLabelElement) {
        checkbox.nextSibling.classList.remove("text-red-500", "text-black");
        checkbox.nextSibling.classList.add(
          correctAnswers.includes(index) ? "text-red-500" : "text-black"
        );
      }
    });

    if (isCorrect) {
      alert("正解！");
      const updatedCorrect = [...correct];
      updatedCorrect[id] = true;
      setCorrect(updatedCorrect);
    } else {
      const correctAnswerIndexes = correctAnswers.map((index) => index + 1);
      alert(`不正解！答えは ${correctAnswerIndexes.join(", ")} 番です`);
      const updatedCorrect = [...correct];
      updatedCorrect[id] = false;
      setCorrect(updatedCorrect);
    }
  };

  /**
   * 任意の問題番号へジャンプ
   */
  const jumpQuiz = (): void => {
    resetCheckboxes();
    const jump_num = parseInt(String(jump), 10);
    if (isNaN(jump_num) || jump_num <= 0 || jump_num > quizData.length) {
      alert("問題番号が不正です");
      return;
    }
    showQuestion(quizData, jump_num - 1);
  };

  /**
   * Enterキー押下で jumpQuiz 実行
   */
  const jumpQuiz1 = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      jumpQuiz();
    }
  };

  /**
   * テーブル内リンクのクリックで指定問題へ飛ぶ
   */
  const handleClick = (event: MouseEvent<HTMLAnchorElement>, num: number) => {
    event.preventDefault(); // ページ遷移を防ぐ
    setJump(num);
    jumpQuiz2(num);
  };

  /**
   * handleClick で使うジャンプ処理
   */
  const jumpQuiz2 = (num: number): void => {
    resetCheckboxes();
    if (num <= 0 || num > quizData.length) {
      alert("問題番号が不正です");
      return;
    }
    showQuestion(quizData, num - 1);
    window.scroll({ top: 0, behavior: "smooth" });
  };

  // ------------------------ Helper 関数群 ------------------------ //

  /**
   * A -> 0, B -> 1 ... に対応させるためのアルファベットリスト
   */
  function ChangeNumberToAlphabets(number: number): string {
    const alphabet = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z";
    const alphabets = alphabet.split(",");
    return alphabets[number] || "";
  }

  /**
   * 配列をシャッフル
   */
  function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  }

  /**
   * 選択肢配列と 〇×配列を同じ順番でシャッフル
   */
  function shuffleAndSwapArrays(
    array1: string[],
    array2: string[]
  ): [string[], string[]] {
    if (array1.length !== array2.length) {
      throw new Error("Both arrays must have the same length.");
    }
    const length = array1.length;
    const indices = Array.from({ length }, (_, i) => i);

    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const newArray1 = indices.map((index) => array1[index]);
    const newArray2 = indices.map((index) => array2[index]);
    return [newArray1, newArray2];
  }

  /**
   * 正解数/不正解数/正解率を返す
   */
  function countAndPercentage(array: boolean[]): {
    trueCount: number;
    truePercentage: number;
    totalCount: number;
  } {
    const trueCount = array.filter((value) => value === true).length;
    const falseCount = array.filter((value) => value === false).length;
    const totalCount = trueCount + falseCount;
    const truePercentage =
      totalCount === 0 ? 0 : (trueCount / totalCount) * 100;
    return {
      trueCount,
      truePercentage,
      totalCount,
    };
  }

  /**
   * 現在の問題番号（index）を指定してステートを更新し、問題文を表示
   */
  const showQuestion = (data: QuizItem[], idx: number): void => {
    setId(idx);
    setMondai(data[idx].keyWord);
    setSanko(data[idx].sanko);
    setSentaku(data[idx].selectData);
    setAns(data[idx].marubatuData);
  };

  /**
   * チェックボックスと参考表示のリセット
   */
  const resetCheckboxes = (): void => {
    checkboxRefs.current.forEach((checkbox) => {
      if (checkbox) {
        checkbox.checked = false;
        if (checkbox.nextSibling instanceof HTMLLabelElement) {
          checkbox.nextSibling.classList.remove("text-red-500", "text-black");
          checkbox.nextSibling.classList.add("text-black");
        }
      }
    });
    setSankoCheck(false);
  };

  /**
   * 全チェックを外す（初期化）
   */
  const uncheckAll = (): void => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
  };

  /**
   * 全ステートリセット
   */
  const resetQuiz = (): void => {
    setQuizData([]);
    setMondai("");
    setSanko("");
    setSentaku([]);
    setId(0);
    setAns([]);
    setCorrect([]);
  };

  // ------------------------ JSX ------------------------ //
  return (
    <div className="container mx-auto p-4">
      {/* CSVファイルの読み込み + エンコーディング選択 + ダウンロードボタン */}
      <CircleIconButton onClick={() => setModalOpen(true)} />
      <Modal isOpen={ModalOpen} onClose={() => setModalOpen(false)}>
        <div className=" mx-auto p-4 bg-white">
          <h1 className="text-2xl font-bold text-amber-900 mb-4">
            選択問題トッピングの使い方
          </h1>

          <div className="space-y-4">
            {/* その1 */}
            <div className="flex items-start space-x-2">
              <span className="text-amber-700 font-bold whitespace-nowrap flex-shrink-0">
                その1
              </span>
              <p className="text-gray-700">
                文字コードを指定してください。ExcelでそのままCSV出力した場合は
                「Shift_JIS」になります。
              </p>
            </div>

            {/* その2 */}
            <div className="flex items-start space-x-2">
              <span className="text-amber-700 font-bold whitespace-nowrap flex-shrink-0">
                その2
              </span>
              <p className="text-gray-700">
                問題ファイルをアップロードしてください。問題ファイルの形式は
                以下のテンプレをダウンロードしてご利用ください。
              </p>
            </div>

            {/* その3 */}
            <div className="flex items-start space-x-2">
              <span className="text-amber-700 font-bold whitespace-nowrap flex-shrink-0">
                その3
              </span>
              <p className="text-gray-700">
                「順番に表示」または「ランダム表示」ボタンを押して問題を表示します。
              </p>
            </div>

            {/* その4 */}
            <div className="flex items-start space-x-2">
              <span className="text-amber-700 font-bold whitespace-nowrap flex-shrink-0">
                その4
              </span>
              <p className="text-gray-700">
                ジャンプ機能を使って任意の問題番号に移動できます。
              </p>
            </div>
          </div>

          <div className="mt-6">
            <a href="/template.csv" download>
              <button className="w-full px-4 py-2 bg-amber-600 text-white font-semibold rounded-md shadow hover:bg-amber-800 transition-colors">
                問題ファイルテンプレをダウンロード
              </button>
            </a>
          </div>
        </div>
      </Modal>
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 sm:space-x-4 space-y-2 sm:space-y-0">
        {/* 文字コード選択用セレクトボックス */}
        <div className="mb-2 sm:mb-0">
          <label htmlFor="encodingSelect" className="mr-2">
            文字コード:
          </label>
          <select
            id="encodingSelect"
            value={csvEncoding}
            onChange={(e) =>
              setCsvEncoding(e.target.value as "Shift_JIS" | "UTF-8")
            }
            className="p-1 border border-gray-300 rounded"
          >
            <option value="Shift_JIS">Shift_JIS</option>
            <option value="UTF-8">UTF-8</option>
          </select>
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="cursor-pointer p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        />

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={startQuiz}
            className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition-colors"
          >
            順番に表示
          </button>
          <button
            onClick={randomQuiz}
            className="px-4 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600 transition-colors"
          >
            ランダム表示
          </button>
        </div>
      </div>

      {/* 現在の問題番号と成績表示 */}
      <h1 className="text-xl font-bold mb-2">{id + 1}問目</h1>
      <p className="mb-1">
        正解数：{countAndPercentage(correct).trueCount} /{" "}
        {countAndPercentage(correct).totalCount}
      </p>
      <p className="mb-4">
        正解率：{Math.round(countAndPercentage(correct).truePercentage)}%
      </p>

      {/* 問題文と選択肢 */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">問題文</h2>
        <p className="mt-2">{mondai}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">選択肢</h2>
        <div className="mt-2 space-y-2">
          {sentaku.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                type="checkbox"
                id={`option${index}`}
                name="quiz"
                value={option}
                ref={(el) => {
                  checkboxRefs.current[index] = el;
                }}
                className="mr-2 h-4 w-4"
              />
              <label htmlFor={`option${index}`} className="text-black">
                {option}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* ボタン群 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 sm:space-x-4 space-y-2 sm:space-y-0">
        <button
          onClick={answerShow}
          className="px-4 py-2 bg-purple-500 text-white rounded shadow hover:bg-purple-600 transition-colors"
        >
          答え確認
        </button>
        <button
          onClick={nextQuestion}
          className="px-4 py-2 bg-indigo-500 text-white rounded shadow hover:bg-indigo-600 transition-colors"
        >
          次の問題
        </button>
      </div>

      {/* 参考表示 */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">参考</h2>
        <pre className="mt-2 bg-gray-100 p-2 rounded">
          {sanko_check ? sanko1 : ""}
        </pre>
      </div>

      {/* ジャンプ機能 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-4">
        <label className="whitespace-nowrap">問題番号指定：</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            onChange={(e) => setJump(Number(e.target.value))}
            value={jump}
            onKeyDown={jumpQuiz1}
            className="w-20 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={jumpQuiz}
            className="px-4 py-2 bg-teal-500 text-white rounded shadow hover:bg-teal-600 transition-colors"
          >
            ジャンプ
          </button>
        </div>
      </div>

      {/* 結果テーブル */}
      <h2 className="text-lg font-semibold mb-2">結果</h2>
      <table className="table-auto border-collapse border-2 w-full">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2 w-1/3">問題番号</th>
            <th className="border px-4 py-2">結果</th>
          </tr>
        </thead>
        <tbody>
          {quizData.map((quiz, index) => (
            <tr key={index}>
              <td className="border px-4 py-2 text-center">
                <a
                  href="#"
                  className="text-blue-600 underline hover:text-blue-800 cursor-pointer"
                  onClick={(event) => {
                    handleClick(event, index + 1);
                  }}
                >
                  {index + 1}問目
                </a>
              </td>
              <td className="border px-4 py-2 text-center">
                {correct[index] === true ? (
                  <span className="text-red-500">正解</span>
                ) : correct[index] === false ? (
                  <span className="text-blue-500">不正解</span>
                ) : (
                  <span className="text-green-500">未回答</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
