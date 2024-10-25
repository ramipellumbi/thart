import { thart } from "thart";

import { startServiceOne } from "./service-1/server.js";
import { startServiceTwo } from "./service-2/server.js";

thart({
  // start up two servers on the same host at different ports
  worker: [
    {
      // service 1 will share the same port with all spawned workers
      start: startServiceOne,
      type: "cluster",
      count: 2,
    },
    {
      // service 2 will share the same port with all spawned workers
      start: startServiceTwo,
      type: "cluster",
      count: 2,
    },
  ],
});
