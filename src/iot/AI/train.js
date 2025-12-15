const fs = require("fs");
const { RandomForestClassifier } = require("ml-random-forest");
const extractFeatures = require("./features.js");


const dataset = JSON.parse(fs.readFileSync("./data/dataset.json"));

let X = [];
let y = [];

dataset.forEach(doc => {
  if (!doc.label) return;

  X.push(extractFeatures(doc.samples));
  y.push(doc.label === "intrusion" ? 1 : 0);
});

const numFeatures = X[0].length;

const rf = new RandomForestClassifier({
  nEstimators: 300,
  maxFeatures: Math.floor(Math.sqrt(numFeatures)), 
  replacement: true,
  seed: 42,
  treeOptions: {
    maxDepth: 12,
    minNumSamples: 3
  }
});

rf.train(X, y);



rf.train(X, y);

// Save model
fs.writeFileSync("model.json", JSON.stringify(rf.toJSON()));

console.log("✅ Model trained and saved");
