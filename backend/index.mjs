import validateCode from "./validateCode.mjs";
import listFolders from "./listFolders.mjs";
import getItem from "./getItem.mjs";
import isCodeValid from "./isCodeValid.mjs";

const VALID_ROUTES = {
  listFolders,
  getItem,
  isCodeValid,
};

export const handler = async (event) => {
  console.log("RAW EVENT:", JSON.stringify(event));

  // For Lambda Function URLs, the JSON body is a string in event.body
  const body = event.body ? JSON.parse(event.body) : {};
  console.log("PARSED BODY:", body);

  const { code, route } = body;

  const isValidCode = validateCode(code);

  if (!isValidCode) {
    return {
      statusCode: 401,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Wrong code" }),
    };
  }

  const fn = VALID_ROUTES[route];

  if (!fn) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Invalid route" }),
    };
  }

  // Pass parsed body into the route handler
  const result = await fn(body);

  // Make sure response has JSON content type by default
  return {
    ...result,
    headers: {
      "Content-Type": "application/json",
      ...(result.headers || {}),
    },
  };
};
