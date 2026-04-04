const elements = {
  word: document.getElementById("word"),
  feedback: document.getElementById("feedback"),
  btnMasc: document.getElementById("btn-masc"),
  btnFem: document.getElementById("btn-fem"),
  btnNext: document.getElementById("btn-next"),
  totalAttempts: document.getElementById("total-attempts"),
  pctCorrect: document.getElementById("pct-correct"),
  attemptsMasc: document.getElementById("attempts-masc"),
  pctMasc: document.getElementById("pct-masc"),
  attemptsFem: document.getElementById("attempts-fem"),
  pctFem: document.getElementById("pct-fem"),
};

const gameState = {
  nouns: [],
  bothGenders: [],
  current: null,
  totalAttempts: 0,
  correctTotal: 0,
  attemptsMasc: 0,
  correctMasc: 0,
  attemptsFem: 0,
  correctFem: 0,
};

function parseCsv(text, columns = null) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length)
    .map((row) => row.split(",").map((cell) => cell.trim()));

  if (!columns) return rows;

  return rows
    .filter((row) => row.length >= columns.length && row[0])
    .map((row) => {
      const obj = {};
      columns.forEach((colName, index) => {
        obj[colName] = row[index];
      });
      return obj;
    });
}

function chooseRandomNoun() {
  if (!gameState.nouns.length) return null;
  const index = Math.floor(Math.random() * gameState.nouns.length);
  return gameState.nouns[index];
}

function refreshStats() {
  elements.totalAttempts.textContent = String(gameState.totalAttempts);
  elements.pctCorrect.textContent =
    gameState.totalAttempts > 0
      ? `${((gameState.correctTotal / gameState.totalAttempts) * 100).toFixed(1)}%`
      : "0%";
  elements.attemptsMasc.textContent = String(gameState.attemptsMasc);
  elements.pctMasc.textContent =
    gameState.attemptsMasc > 0
      ? `${((gameState.correctMasc / gameState.attemptsMasc) * 100).toFixed(1)}%`
      : "N/A";
  elements.attemptsFem.textContent = String(gameState.attemptsFem);
  elements.pctFem.textContent =
    gameState.attemptsFem > 0
      ? `${((gameState.correctFem / gameState.attemptsFem) * 100).toFixed(1)}%`
      : "N/A";
}

function showCurrentWord() {
  if (!gameState.current) {
    elements.word.textContent = "";
    elements.btnMasc.disabled = true;
    elements.btnFem.disabled = true;
    return;
  }
  elements.word.textContent = gameState.current.noun;
  elements.word.style.color = "";
  elements.word.style.textDecoration = "";
  elements.word.style.cursor = "default";
  elements.word.removeAttribute("data-url");
  elements.btnMasc.disabled = false;
  elements.btnFem.disabled = false;
  elements.btnNext.style.display = "none";
  elements.feedback.textContent = "";
}

function setFeedback(correct) {
  if (correct) {
    elements.feedback.textContent = t("correct");
    elements.feedback.style.color = "green";
  } else {
    const wrongKey =
      gameState.current.gender === "fem" ? "wrong_fem" : "wrong_masc";
    elements.feedback.textContent = t(wrongKey);
    elements.feedback.style.color = "red";
  }

  if (gameState.current && gameState.current.noun) {
    const slug = encodeURIComponent(gameState.current.noun);
    const url = `https://www.teanglann.ie/en/fgb/${slug}`;
    elements.word.style.color = "blue";
    elements.word.style.textDecoration = "underline";
    elements.word.style.cursor = "pointer";
    elements.word.setAttribute("data-url", url);
  }
}

function answer(genderGuess) {
  if (!gameState.current) return;
  gameState.totalAttempts += 1;

  if (gameState.bothGenders.some((item) => item.noun === gameState.current.noun)) {
    // This noun can be both masculine and feminine given the definition,
    // so I'm counting it as correct regardless of the guess
    gameState.attemptsMasc += 1;
    gameState.attemptsFem += 1;
    gameState.correctTotal += 1;
    gameState.correctMasc += 1;
    gameState.correctFem += 1;
    setFeedback(true);
  } else if (gameState.current.gender === "masc") {
    gameState.attemptsMasc += 1;
    if (genderGuess === "masc") {
      gameState.correctTotal += 1;
      gameState.correctMasc += 1;
      setFeedback(true);
    } else {
      setFeedback(false);
    }
  } else {
    gameState.attemptsFem += 1;
    if (genderGuess === "fem") {
      gameState.correctTotal += 1;
      gameState.correctFem += 1;
      setFeedback(true);
    } else {
      setFeedback(false);
    }
  }
  refreshStats();
  elements.btnMasc.disabled = true;
  elements.btnFem.disabled = true;
  elements.btnNext.style.display = "inline-block";
}

function onKeyDown(event) {
  if (event.key === "ArrowLeft") {
    if (!elements.btnMasc.disabled) answer("masc");
    return;
  }
  if (event.key === "ArrowRight") {
    if (!elements.btnFem.disabled) answer("fem");
    return;
  }
  if (event.key === "Enter" && elements.btnNext.style.display !== "none") {
    gameState.current = chooseRandomNoun();
    showCurrentWord();
    return;
  }
}

elements.word.addEventListener("click", () => {
  const targetUrl = elements.word.getAttribute("data-url");
  if (targetUrl) {
    window.open(targetUrl, "_blank");
  }
});

document.addEventListener("keydown", onKeyDown);

function loadCSV(path, columns = null) {
  return fetch(path)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load ${path}`);
      return response.text();
    })
    .then((text) => {
      return parseCsv(text, columns);
    })
    .catch((error) => {
      elements.word.textContent = "";
      elements.feedback.textContent = error.message;
      elements.feedback.style.color = "red";
      return [];
    });
}

function loadAndStart() {
  const BOTH_GENDERS_CSV_PATH = "data/both_genders.csv";
  const NOUNS_CSV_PATH = "data/nouns.csv";

  Promise.all([
    loadCSV(NOUNS_CSV_PATH, ["noun", "gender"]),
    loadCSV(BOTH_GENDERS_CSV_PATH, ["noun"]),
  ]).then(([nouns, bothGenders]) => {
    gameState.nouns = nouns;
    gameState.bothGenders = bothGenders;

    const allLoaded = [gameState.nouns, gameState.bothGenders].every(
      (arr) => arr.length > 0
    );
    if (allLoaded) {
      gameState.current = chooseRandomNoun();
      showCurrentWord();
      refreshStats();
    } else {
      console.error("Failed to load necessary data.");
    }
  });
}

window.addEventListener("languageChanged", () => {
  if (elements.feedback.textContent) {
    const feedbackColor = elements.feedback.style.color;
    if (feedbackColor === "green") {
      elements.feedback.textContent = t("correct");
    } else if (feedbackColor === "red" && gameState.current) {
      const wrongKey =
        gameState.current.gender === "fem" ? "wrong_fem" : "wrong_masc";
      elements.feedback.textContent = t(wrongKey);
    }
  }
});

elements.btnMasc.addEventListener("click", () => answer("masc"));
elements.btnFem.addEventListener("click", () => answer("fem"));
elements.btnNext.addEventListener("click", () => {
  gameState.current = chooseRandomNoun();
  showCurrentWord();
});

document.addEventListener("DOMContentLoaded", loadAndStart);
