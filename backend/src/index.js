import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectToDB from "./db/connectToDB.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectToDB();

  app.listen(5000, () => {
    console.log(`Listing on PORT : ${PORT}`);
  });
};

startServer();
