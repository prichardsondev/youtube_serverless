const { handler } = require("./createUserHandler");

/*
  note username must be unique to database
*/
const event = {
  body: "{\"username\":\"ALYTAR\",\"email\":\"alytar@gmail.com\",\"name\":\"Abigail Lytar\"}"
};

handler(event);


