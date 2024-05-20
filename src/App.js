import React, { useState } from "react";
import Papa from "papaparse";

function App() {
  const [quizData, setQuizData] = useState([]);
  const [fileContent, setFileContent] = useState("");
  const [mondai, setMondai] = useState("");
  const [sentaku, setSentaku] = useState([]);
  const [id, setId] = useState(0);
  const [ans, setAns] = useState([]);
  const[correct, setCorrect] = useState([]);

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
    setCorrect([]);

  };

  function ChangeNumberToAlphabets(number){
    const alphabet = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z";
    const alphabets = alphabet.split(",");

    return alphabets[number];
}

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
          // A. to  1. convert
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
        for (let i = 0; i < newQuizData.length; i++) {
          for (let j = 0; j < newQuizData[i].selectData.length; j++) {
            newQuizData[i].selectData[j] = newQuizData[i].selectData[j].replace( ChangeNumberToAlphabets(j) + ".", (j + 1) + ". ");

          }
        }
        setQuizData(newQuizData);
        setId(0); // Reset quiz to first question
        setMondai(newQuizData[0].keyWord);
        setSentaku(newQuizData[0].selectData);
        setAns(newQuizData[0].marubatuData);
        setCorrect([])
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
        for (let i = 0; i < newQuizData.length; i++) {
          for (let j = 0; j < newQuizData[i].selectData.length; j++) {
            newQuizData[i].selectData[j] = newQuizData[i].selectData[j].replace( ChangeNumberToAlphabets(j) + ".", (j + 1) + ".  ");

          }
        }
        newQuizData = shuffleArray(newQuizData);
        setQuizData(newQuizData);
        setId(0); // Reset quiz to first question
        setMondai(newQuizData[0].keyWord);
        setSentaku(newQuizData[0].selectData);
        setAns(newQuizData[0].marubatuData);
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((checkbox) => {
          checkbox.checked = false;
        });
      },
    });
  };
  function countAndPercentage(array) {
    const trueCount = array.filter(value => value === true).length;
    const totalCount = array.length;
    const truePercentage = (trueCount / totalCount) * 100;
    return {
        trueCount: trueCount,
        truePercentage: truePercentage
    };
}

  const nextQuestion = () => {
    if (id + 1 < quizData.length) {
      const nextId = id + 1;
      setId(nextId);
      setMondai(quizData[nextId].keyWord);
      setSentaku(quizData[nextId].selectData);
      setAns(quizData[nextId].marubatuData);
    } else {
      const result = countAndPercentage(correct);
      alert(`終了！正解数: ${result.trueCount} / ${correct.length} (${Math.round(result.truePercentage)}%)`);
      setId(0);
      setMondai(quizData[0].keyWord);
      setSentaku(quizData[0].selectData);
      setAns(quizData[0].marubatuData);
      setCorrect([])
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
      let verCorrect = [...correct];
      verCorrect[id] = true;
      setCorrect([...verCorrect])
    } else {
      const correctAnswerIndexes = correctAnswers.map((index) => index + 1); // +1 to make it 1-based index
      alert(`不正解！答えは ${correctAnswerIndexes.join(", ")} 番です`);
      let verCorrect = [...correct];
      verCorrect[id] = false;
      setCorrect([...verCorrect])
    }
  };

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={startQuiz}>問題を順番に表示</button>
      <button onClick={randomQuiz}>ランダムに問題を表示</button>
      <h1>{id + 1}問目</h1>
      <p>正解数：{countAndPercentage(correct).trueCount} / {correct.length}</p>
      <p>正解率：{Math.round(countAndPercentage(correct).truePercentage)}%</p>
      <h2>問題文</h2>
      <p>{mondai}</p>
      <h2>選択肢</h2>
      {sentaku.map((option, index) => (
        <div key={index}>
          <input type="checkbox" id={`option${index}`} name="quiz" value={option} />
          <label htmlFor={`option${index}`}>{option}</label>
        </div>
      ))}
      <br />
      <button onClick={answerShow} style={{margin:30,padding:5}}>答え確認</button>
      <button onClick={nextQuestion} style={{margin:30,padding:5}}>次の問題</button>

    </div>
  );
}
//      <pre>{JSON.stringify(quizData, null, 2)}</pre>

export default App;
