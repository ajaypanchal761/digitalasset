import otpGenerator from 'otp-generator';

export const generateOTP = (length = 6) => {
  return otpGenerator.generate(length, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

export const verifyOTP = (otp, storedOTP) => {
  return otp === storedOTP;
};



