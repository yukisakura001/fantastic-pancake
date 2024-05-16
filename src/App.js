import React, { useState } from "react";
import Papa from "papaparse";

function App() {
  const [quizData, setQuizData] = useState([]);
  const [fileContent, setFileContent] = useState("");
  const [mondai, setMondai] = useState("");
  const [sentaku, setSentaku] = useState([]);
  const [id, setId] = useState(0);
  const [ans, setAns] = useState([]);

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
    setSentaku([]);
    setId(0);
    setAns([]);

  };

  const startQuiz = () => {
    Papa.parse(fileContent, {
      header: true,
      complete: (results) => {
        const originData = results.data;
        let keyWord = originData[0]["設問"];
        let newQuizData = [];
        let selectData = [];
        let marubatuData = [];

        for (let i = 0; i < originData.length; i++) {
          if (i === 0) {
            keyWord = originData[i]["設問"];
            selectData.push(originData[i]["選択肢"]);
            marubatuData.push(originData[i]["解答"]);
          } else if (i === originData.length - 1) {
            newQuizData.push({ keyWord: keyWord, selectData: selectData, marubatuData: marubatuData });
          } else if (originData[i]["設問"] === "") {
            selectData.push(originData[i]["選択肢"]);
            marubatuData.push(originData[i]["解答"]);
          } else if (originData[i]["設問"] !== "") {
            newQuizData.push({ keyWord: keyWord, selectData: selectData, marubatuData: marubatuData });
            keyWord = originData[i]["設問"];
            selectData = [];
            marubatuData = [];
            selectData.push(originData[i]["選択肢"]);
            marubatuData.push(originData[i]["解答"]);
          }
        }

        setQuizData(newQuizData);
        setId(0); // Reset quiz to first question
        setMondai(newQuizData[0].keyWord);
        setSentaku(newQuizData[0].selectData);
        setAns(newQuizData[0].marubatuData);
      },
    });
  };

  const nextQuestion = () => {
    if (id + 1 < quizData.length) {
      const nextId = id + 1;
      setId(nextId);
      setMondai(quizData[nextId].keyWord);
      setSentaku(quizData[nextId].selectData);
      setAns(quizData[nextId].marubatuData);
    } else {
      alert("終了です！");
      setId(0);
      setMondai(quizData[0].keyWord);
      setSentaku(quizData[0].selectData);
      setAns(quizData[0].marubatuData);
    }

    // Uncheck all checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      checkbox.checked = false;
    });
  };

  const answerShow = () => {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    const userAnswers = [];
    checkboxes.forEach((checkbox, index) => {
      if (checkbox.checked) {
        userAnswers.push(index);
      }
    });

    const correctAnswers = ans.map((answer, index) => (answer === "〇" ? index : null)).filter((index) => index !== null);

    const isCorrect = userAnswers.length === correctAnswers.length && userAnswers.every((answer) => correctAnswers.includes(answer));

    if (isCorrect) {
      alert("正解！");
    } else {
      const correctAnswerIndexes = correctAnswers.map((index) => index + 1); // +1 to make it 1-based index
      alert(`不正解！答えは ${correctAnswerIndexes.join(", ")} 番です`);
    }
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={startQuiz}>問題を表示</button>
      <h1>問題</h1>
      <p>{mondai}</p>
      {sentaku.map((option, index) => (
        <div key={index}>
          <input type="checkbox" id={`option${index}`} name="quiz" value={option} />
          <label htmlFor={`option${index}`}>{option}</label>
        </div>
      ))}
      <button onClick={answerShow}>答え確認</button>
      <button onClick={nextQuestion}>次の問題</button>
      <pre>{JSON.stringify(quizData, null, 2)}</pre>
    </div>
  );
}

export default App;
