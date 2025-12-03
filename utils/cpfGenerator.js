function _calculateVerificationDigit(digits) {
  let sumVal = 0;
  // The weight starts from (len(digits) + 1) and goes down to 2
  for (let i = 0; i < digits.length; i++) {
    sumVal += digits[i] * ((digits.length + 1) - i);
  }

  const remainder = sumVal % 11;
  if (remainder < 2) {
    return 0;
  } else {
    return 11 - remainder;
  }
}

function generateValidCpf(formatted = true) {
  // Generate 9 random digits for the CPF base
  const randomDigits = [];
  for (let i = 0; i < 9; i++) {
    randomDigits.push(Math.floor(Math.random() * 10));
  }

  // Calculate first verification digit
  const firstDigit = _calculateVerificationDigit(randomDigits);
  randomDigits.push(firstDigit);

  // Calculate second verification digit
  const secondDigit = _calculateVerificationDigit(randomDigits);
  randomDigits.push(secondDigit);

  // Convert to string
  const cpf = randomDigits.join('');

  if (formatted) {
    return `${cpf.substring(0, 3)}.${cpf.substring(3, 6)}.${cpf.substring(6, 9)}-${cpf.substring(9)}`;
  } else {
    return cpf;
  }
}

module.exports = { generateValidCpf };
