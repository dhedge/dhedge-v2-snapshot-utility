import fs from "fs";
import config from "./config";
import { getDateBlocks } from "./lib/getDateBlocks";

getDateBlocks(config.snapShotStartDate, config.snapShotEndDate).then(
  (dateBlocks) => {
    const dateBlocksJSON = JSON.stringify(dateBlocks, null, 4);
    fs.writeFile(
      config.dateBlocksFile,
      dateBlocksJSON,
      function (err) {
        if (err) {
          console.error(err);
        } else {
          console.log("Success");
          console.log(dateBlocks);
        }
      }
    );
  }
);
