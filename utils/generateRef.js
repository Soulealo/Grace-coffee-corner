function generateRef() {
  const year = new Date().getFullYear();
  const code = Math.floor(10000 + Math.random() * 90000);
  return `GC-${year}-${code}`;
}

module.exports = generateRef;
