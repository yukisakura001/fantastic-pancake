import React, { useState, useRef } from "react";
import Papa from "papaparse";

function App() {
  const [quizData, setQuizData] = useState([]);
  const [fileContent, setFileContent] = useState("");
  const [mondai, setMondai] = useState("");
  const [sanko1, setSanko] = useState("");
  const [sentaku, setSentaku] = useState([]);
  const [id, setId] = useState(0);
  const [ans, setAns] = useState([]);
  const [correct, setCorrect] = useState([]);
  const checkboxRefs = useRef([]);
  const [jump, setJump] = useState(1);
  const [sanko_check, setSankoCheck] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target.result);
      };
      reader.readAsText(file);
    }
    setQuizData([]);
    setMondai("");
    setSanko("");
    setSentaku([]);
    setId(0);
    setAns([]);
    setCorrect([]);
  };

  function ChangeNumberToAlphabets(number) {
    const alphabet = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z";
    const alphabets = alphabet.split(",");

    return alphabets[number];
  }

  const startQuiz = () => {
    resetCheckboxes();
    Papa.parse(fileContent, {
      header: true,
      complete: (results) => {
        const originData = results.data;
        let keyWord = originData[0]["設問"];
        let sanko = originData[0]["参考"];
        let newQuizData = [];
        let selectData = [];
        let marubatuData = [];

        for (let i = 0; i < originData.length; i++) {
          // A. to  1. convert
          if (i === 0) {
            keyWord = originData[i]["設問"];
            sanko = originData[i]["参考"];
            selectData.push(originData[i]["選択肢"]);
            marubatuData.push(originData[i]["解答"]);
          } else if (i === originData.length - 1) {
            newQuizData.push({
              keyWord: keyWord,
              sanko: sanko,
              selectData: selectData,
              marubatuData: marubatuData,
            });
          } else if (originData[i]["選択肢"] === "") {
            continue;
          } else if (originData[i]["設問"] === "") {
            selectData.push(originData[i]["選択肢"]);
            marubatuData.push(originData[i]["解答"]);
          } else if (originData[i]["設問"] !== "") {
            newQuizData.push({
              keyWord: keyWord,
              sanko: sanko,
              selectData: selectData,
              marubatuData: marubatuData,
            });
            keyWord = originData[i]["設問"];
            sanko = originData[i]["参考"];
            selectData = [];
            marubatuData = [];
            selectData.push(originData[i]["選択肢"]);
            marubatuData.push(originData[i]["解答"]);
          }
        }
        for (let i = 0; i < newQuizData.length; i++) {
          for (let j = 0; j < newQuizData[i].selectData.length; j++) {
            newQuizData[i].selectData[j] = newQuizData[i].selectData[j].replace(
              ChangeNumberToAlphabets(j) + ".",
              //j + 1 + ". "
              ""
            );
          }
        }
        setQuizData(newQuizData);
        setId(0); // Reset quiz to first question
        setMondai(newQuizData[0].keyWord);
        setSanko(newQuizData[0].sanko);
        setSentaku(newQuizData[0].selectData);
        setAns(newQuizData[0].marubatuData);
        setCorrect([]);
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
          checkbox.checked = false;
        });
      },
    });
  };

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  const randomQuiz = () => {
    resetCheckboxes();
    Papa.parse(fileContent, {
      header: true,
      complete: (results) => {
        const originData = results.data;
        let keyWord = originData[0]["設問"];
        let sanko = originData[0]["参考"];
        let newQuizData = [];
        let selectData = [];
        let marubatuData = [];

        for (let i = 0; i < originData.length; i++) {
          if (i === 0) {
            keyWord = originData[i]["設問"];
            sanko = originData[i]["参考"];
            selectData.push(originData[i]["選択肢"]);
            marubatuData.push(originData[i]["解答"]);
          } else if (i === originData.length - 1) {
            newQuizData.push({
              keyWord: keyWord,
              sanko: sanko,
              selectData: selectData,
              marubatuData: marubatuData,
            });
          } else if (originData[i]["選択肢"] === "") {
            continue;
          } else if (originData[i]["設問"] === "") {
            selectData.push(originData[i]["選択肢"]);
            marubatuData.push(originData[i]["解答"]);
          } else if (originData[i]["設問"] !== "") {
            newQuizData.push({
              keyWord: keyWord,
              sanko: sanko,
              selectData: selectData,
              marubatuData: marubatuData,
            });
            keyWord = originData[i]["設問"];
            sanko = originData[i]["参考"];
            selectData = [];
            marubatuData = [];
            selectData.push(originData[i]["選択肢"]);
            marubatuData.push(originData[i]["解答"]);
          }
        }
        for (let i = 0; i < newQuizData.length; i++) {
          for (let j = 0; j < newQuizData[i].selectData.length; j++) {
            newQuizData[i].selectData[j] = newQuizData[i].selectData[j].replace(
              ChangeNumberToAlphabets(j) + ".",
              //j + 1 + ".  "
              ""
            );
          }
        }
        newQuizData = shuffleArray(newQuizData);
        for (let i = 0; i < newQuizData.length; i++) {
          [newQuizData[i].selectData, newQuizData[i].marubatuData] =
            shuffleAndSwapArrays(
              newQuizData[i].selectData,
              newQuizData[i].marubatuData
            );
        }
        setQuizData(newQuizData);
        setId(0); // Reset quiz to first question
        setMondai(newQuizData[0].keyWord);
        setSanko(newQuizData[0].sanko);
        setSentaku(newQuizData[0].selectData);
        setAns(newQuizData[0].marubatuData);
        setCorrect([]);
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
          checkbox.checked = false;
        });
      },
    });
  };
  function countAndPercentage(array) {
    const trueCount = array.filter((value) => value === true).length;
    const falseCount = array.filter((value) => value === false).length;
    const totalCount = trueCount + falseCount;
    const truePercentage = (trueCount / totalCount) * 100;
    return {
      trueCount: trueCount,
      truePercentage: truePercentage,
      totalCount: totalCount,
    };
  }

  const nextQuestion = () => {
    if (id + 1 < quizData.length) {
      resetCheckboxes();
      const nextId = id + 1;
      setId(nextId);
      setMondai(quizData[nextId].keyWord);
      setSanko(quizData[nextId].sanko);
      setSentaku(quizData[nextId].selectData);
      setAns(quizData[nextId].marubatuData);
    } else {
      const result = countAndPercentage(correct);
      let hantei = window.confirm(
        `終了！正解数: ${result.trueCount} / ${result.totalCount} (${Math.round(
          result.truePercentage
        )}%)\nもう一度最初から始めますか？`
      );
      if (hantei === true) {
        resetCheckboxes();
        setId(0);
        setMondai(quizData[0].keyWord);
        setSanko(quizData[0].sanko);
        setSentaku(quizData[0].selectData);
        setAns(quizData[0].marubatuData);
        setCorrect([]);
      }
    }
  };

  const answerShow = () => {
    setSankoCheck(true);
    const userAnswers = [];
    checkboxRefs.current.forEach((checkbox, index) => {
      if (checkbox && checkbox.checked) {
        // checkbox が null でないことを確認
        userAnswers.push(index);
      }
    });

    const correctAnswers = ans
      .map((answer, index) => (answer === "〇" ? index : null))
      .filter((index) => index !== null);

    const isCorrect =
      userAnswers.length === correctAnswers.length &&
      userAnswers.every((answer) => correctAnswers.includes(answer));

    checkboxRefs.current.forEach((checkbox, index) => {
      if (checkbox) {
        // checkbox が null でないことを再確認
        checkbox.nextSibling.style.color = correctAnswers.includes(index)
          ? "red"
          : "black";
      }
    });

    if (isCorrect) {
      alert("正解！");
      let verCorrect = [...correct];
      verCorrect[id] = true;
      setCorrect([...verCorrect]);
    } else {
      const correctAnswerIndexes = correctAnswers.map((index) => index + 1);
      alert(`不正解！答えは ${correctAnswerIndexes.join(", ")} 番です`);
      let verCorrect = [...correct];
      verCorrect[id] = false;
      setCorrect([...verCorrect]);
    }
  };

  const resetCheckboxes = () => {
    checkboxRefs.current.forEach((checkbox) => {
      if (checkbox) {
        checkbox.checked = false;
        checkbox.nextSibling.style.color = "black";
      }
    });
    setSankoCheck(false);
  };

  const jumpQuiz = () => {
    resetCheckboxes();
    let jump_num = parseInt(jump);
    if (0 > jump_num) {
      alert("問題番号が不正です");
    } else if (jump_num === 0) {
      alert("問題番号が不正です");
    } else if (jump_num < quizData.length + 1) {
      jump_num = jump_num - 1;
      setId(jump_num);
      setMondai(quizData[jump_num].keyWord);
      setSanko(quizData[jump_num].sanko);
      setSentaku(quizData[jump_num].selectData);
      setAns(quizData[jump_num].marubatuData);
    } else {
      alert("問題番号が不正です");
    }
  };

  const jumpQuiz2 = (num) => {
    resetCheckboxes();
    if (0 > num) {
      alert("問題番号が不正です");
    } else if (num === 0) {
      alert("問題番号が不正です");
    } else if (num < quizData.length + 1) {
      num = num - 1;
      setId(num);
      setMondai(quizData[num].keyWord);
      setSanko(quizData[num].sanko);
      setSentaku(quizData[num].selectData);
      setAns(quizData[num].marubatuData);
      window.scroll({
        top: 0,
        behavior: "smooth",
      });
    } else {
      alert("問題番号が不正です");
    }
  };

  const jumpQuiz1 = (e) => {
    if (e.key === "Enter") {
      jumpQuiz();
    }
  };

  function shuffleAndSwapArrays(array1, array2) {
    if (array1.length !== array2.length) {
      throw new Error("Both arrays must have the same length.");
    }

    const length = array1.length;
    const indices = Array.from({ length }, (_, i) => i);

    // Shuffle the indices array
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    // Create new arrays based on the shuffled indices
    const newArray1 = indices.map((index) => array1[index]);
    const newArray2 = indices.map((index) => array2[index]);

    return [newArray1, newArray2];
  }
  const handleClick = (event, num) => {
    event.preventDefault(); // ページ遷移を防ぐ
    setJump(num);
    jumpQuiz2(num);
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={startQuiz}>問題を順番に表示</button>
      <button onClick={randomQuiz}>ランダムに問題を表示</button>
      <h1>{id + 1}問目</h1>
      <p>
        正解数：{countAndPercentage(correct).trueCount} /{" "}
        {countAndPercentage(correct).totalCount}
      </p>
      <p>正解率：{Math.round(countAndPercentage(correct).truePercentage)}%</p>
      <h2>問題文</h2>
      <p>{mondai}</p>
      <h2>選択肢</h2>
      {sentaku.map((option, index) => (
        <div key={index}>
          <input
            type="checkbox"
            id={`option${index}`}
            name="quiz"
            value={option}
            ref={(el) => (checkboxRefs.current[index] = el)} // Ref を各チェックボックスに割り当て
          />
          <label htmlFor={`option${index}`}>{option}</label>
        </div>
      ))}
      <div>
        <button onClick={answerShow} style={{ margin: 30, padding: 5 }}>
          答え確認
        </button>
        <button onClick={nextQuestion} style={{ margin: 30, padding: 5 }}>
          次の問題
        </button>
      </div>
      <div>
        <h2>参考</h2>
        <pre>{sanko_check ? sanko1 : ""}</pre>
      </div>
      <div>
        <label>問題番号指定：</label>
        <input
          type="number"
          onChange={(e) => setJump(e.target.value)}
          style={{ padding: 5 }}
          value={jump}
          onKeyDown={jumpQuiz1}
        />
        <button onClick={jumpQuiz} style={{ margin: 30, padding: 5 }}>
          ジャンプする
        </button>
      </div>
      <h2 style={{ marginTop: 30 }}>結果</h2>
      <table border="2" width="100%" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th width="30%">問題番号</th>
            <th>結果</th>
          </tr>
        </thead>
        <tbody>
          {quizData.map((quiz, index) => (
            <tr key={index}>
              <td align="center">
                <a
                  href="#"
                  onClick={(event) => {
                    handleClick(event, index + 1);
                  }}
                >
                  {index + 1}問目
                </a>
              </td>
              <td align="center">
                {correct[index] === true ? (
                  <font color="red">正解</font>
                ) : correct[index] === false ? (
                  <font color="blue">不正解</font>
                ) : (
                  <font color="green">未回答</font>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
//      <pre>{JSON.stringify(quizData, null, 2)}</pre>

export default App;
