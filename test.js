const dotenv = require("dotenv");
dotenv.config();

const { handler } = require(".");

function run(queryStringParameters = { post: null, social: "TW" }) {
  const event = { queryStringParameters };

  console.log({ event });

  const callback = (error, result) => {
    if (error) console.log(error, error.stack);
    if (result) console.log(result);
  };

  (async () => await handler(event, null, callback))();
}

run({ post: "LAB_W", social: "tw" });
