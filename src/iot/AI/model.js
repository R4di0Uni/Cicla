const fs = require("fs");
const { RandomForestClassifier } = require("ml-random-forest");
const extractFeatures = require("./features");
const path = require("path");


const modelData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../Ai/model.json"), "utf8")
);
const model = RandomForestClassifier.load(modelData);

function predict(samples) {
  const features = extractFeatures(samples);
  const prediction = model.predict([features])[0];
  return prediction === 1 ? "intrusion" : "normal";
}

module.exports = predict;
