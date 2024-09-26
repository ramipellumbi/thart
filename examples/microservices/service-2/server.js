import http from "node:http";

const server = () =>
  http.createServer(async (req, res) => {
    console.log(`Process ${process.pid} handling request`);
  });

export const startServiceTwo = async (outerId) => {
  console.log(`Service 2 running with id ${outerId} and pid ${process.pid}`);
  new Promise((resolve) => server().listen(3001, resolve));
};
