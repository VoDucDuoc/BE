const statusCode = require("http-status-codes");

const message = {
  GET: "Get completed",
  CREATE: "Create completed",
  UPDATE: "Update completed",
  DELETE: "Delete completed",
  UNAUTHENTICATE: "Sign in is required",
  UNAUTHORIZE: "Not allowed to access",
};

const Response = (res, data, httpStatus = statusCode.OK) => {
  return res.status(httpStatus).json(data);
};

const Get = (res, data) => {
  return Response(
    res,
    { message: message.GET, data: flat(data) },
    statusCode.OK
  );
};

const Create = (res, data) => {
  return Response(
    res,
    { message: message.CREATE, data: flat(data) },
    statusCode.CREATED
  );
};

/** Nhớ có {} bọc data **/
const Update = (res, data) => {
  return Response(res, {
    message: message.UPDATE,
    data: flat(data), 
  });
};

/** Nhớ có {} bọc data **/
const Delete = (res, data) => {
  return Response(res, {
    message: message.DELETE,
    data: flat(data),
  });
};

const ServerError = (res, error) => {
  return Response(res, { error }, statusCode.INTERNAL_SERVER_ERROR);
};

const Unauthenticated = (res, error) => {
  return Response(res, { error }, statusCode.UNAUTHORIZED);
};

const Unauthorized = (res) => {
  return Response(res, { message: message.UNAUTHORIZE }, statusCode.FORBIDDEN);
};

const BadRequest = (res, error) => {
  return Response(res, { error }, statusCode.BAD_REQUEST);
};

const NotFound = (res, input) => {
  return Response(res, { message: `${input} not found` }, statusCode.NOT_FOUND);
};

const flat = (data) => {
  return Object.keys(data).map((key) => data[key])[0];
};

module.exports = {
  Response,
  Get,
  Create,
  Update,
  Delete,
  BadRequest,
  Unauthenticated,
  Unauthorized,
  NotFound,
  ServerError,
};



