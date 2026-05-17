const charset = "😀😎";
console.log("charset.length:", charset.length); // Should be 4
for (let i = 0; i < charset.length; i++) {
console.log(`Char at ${i}:`, charset[i], "Hex:", charset[i].charCodeAt(0).toString(16));
}
