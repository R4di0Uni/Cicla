function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function std(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, x) => s + (x - m) ** 2, 0) / arr.length);
}

function maxAbs(arr) {
  return Math.max(...arr.map(v => Math.abs(v)));
}

function extractFeatures(samples) {
  const features = [];

  ["ax", "ay", "az", "gx", "gy", "gz"].forEach(key => {
    const v = samples.map(s => s[key]);
    features.push(mean(v));
    features.push(std(v));
    features.push(maxAbs(v));
  });

  const accMag = samples.map(s =>
    Math.sqrt(s.ax ** 2 + s.ay ** 2 + s.az ** 2)
  );
  const gyroMag = samples.map(s =>
    Math.sqrt(s.gx ** 2 + s.gy ** 2 + s.gz ** 2)
  );

  features.push(mean(accMag));
  features.push(std(accMag));
  features.push(mean(gyroMag));
  features.push(std(gyroMag));

  return features;
}

module.exports = extractFeatures;
