import * as dotenv from "dotenv";
import puppeteer from "puppeteer";

declare function _getFollowers(): any;
declare function _getFollows(): any;
declare function _addFollower(athlete: string): any;
declare function _addFollow(athlete: string): any;

dotenv.config();

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto("https://strava.com/login", {
    waitUntil: "networkidle0",
  });

  await page.waitForSelector("[name='email']");
  await page.type("[name='email']", process.env.STRAVA_EMAIL as string);

  await page.keyboard.down("Tab");
  await page.keyboard.type(process.env.STRAVA_PASSWORD as string);

  await page.keyboard.press("Enter");
  await page.waitForFunction("window.location.pathname == '/dashboard'")
  await page.waitForSelector("#global-header", { visible: true });

  let followers = [] as string[];
  let follows = [] as string[];
  await page.exposeFunction("_getFollowers", function () {
    return followers;
  });
  await page.exposeFunction("_getFollows", function () {
    return follows;
  });
  await page.exposeFunction("_addFollower", function (athlete: string) {
    return followers.push(athlete);
  });

  await page.exposeFunction("_addFollow", function (athlete: string) {
    return follows.push(athlete);
  });

  const MAX_PAGES_FOLLOWERS_FOLLOWS_PAGE = parseInt(
    process.env.STRAVA_ATHLETE_MAX_FOLLOWERS_FOLLOWS_PAGES as unknown as string
  );
  for (let i = 1; i < MAX_PAGES_FOLLOWERS_FOLLOWS_PAGE + 1; i++) {
    await page.goto(
      `https://www.strava.com/athletes/${process.env.STRAVA_ATHLETE_ID}/follows?page=${i}&page_uses_modern_javascript=true&type=following`,
      {
        waitUntil: "networkidle0",
      }
    );
    await page.evaluate(() => {
      document
        .querySelectorAll("[data-athlete-id]")
        .forEach(async function (element) {
          await _addFollow(element.attributes[0].value);
        });
    });
  }

  for (let i = 1; i < MAX_PAGES_FOLLOWERS_FOLLOWS_PAGE + 1; i++) {
    await page.goto(
      `https://www.strava.com/athletes/${process.env.STRAVA_ATHLETE_ID}/follows?page=${i}&page_uses_modern_javascript=true&type=followers`,
      {
        waitUntil: "networkidle0",
      }
    );
    await page.evaluate(() => {
      document
        .querySelectorAll("[data-athlete-id]")
        .forEach(async function (element) {
          debugger;
          await _addFollower(element.attributes[0].value);
        });
    });
  }
  console.table(followers);
  console.table(follows);
  console.log(
    "I'M NOT FOLLOWING",
    followers.filter((x) => !follows.includes(x))
  );
  console.table(follows);
  console.log(
    "NOT FOLLOWING ME",
    follows.filter((x) => !followers.includes(x))
  );
  console.table(follows);

  await browser.close();
})();
