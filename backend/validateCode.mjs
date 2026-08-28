const CODE = process.env.CODE;

const validateCode = (code) => {
  return CODE === code;
};

export default validateCode;