const chromium = require("chrome-aws-lambda");

const url = "https://sledilnik-social.netlify.app/";

const socialButton = "#social-changer + span";
const possibleSocial = ["TW", "FB"];
const possiblePosts = ["lab", "hos", "epi"];
const navButtons = ".tablinks";

const PostLinks = {
  lab: 0,
  hos: 1,
  epi: 2,
};

const removeConsecutiveNewLines = (text) => {
  const step1 = text.replace(/(\r\n|\r|\n){2,}/g, "\n");
  return step1.slice(-1) === "\n" ? step1.slice(0, -1) : step1;
};

exports.handler = async (event, context, callback) => {
  if (!event.queryStringParameters) {
    return callback(undefined, "No target");
  }

  const { post = "", social = "" } = event.queryStringParameters;

  if (!post) {
    return callback(undefined, "No post!");
  }

  const _post = post.toLowerCase();
  const _social = social ? social?.toUpperCase() : "FB";

  if (!possiblePosts.includes(_post)) {
    return callback(undefined, "Wrong post! ['lab' || 'hos' || 'epi']");
  }

  if (!possibleSocial.includes(_social)) {
    return callback(undefined, "Wrong social! ['TW' || 'FB']");
  }

  let result;
  let browser;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });
    console.log("Made browser");

    const page = await browser.newPage();
    console.log("Made Page");

    await page.setViewport({ width: 1366, height: 768 });
    console.log("Set viewport");

    await page.goto(url, { waitUntil: "networkidle0" });
    console.log("Went to ", url);

    if (_social === "FB") {
      await page.waitForSelector(socialButton);
      const socialElement = await page.$(socialButton);
      await socialElement.click();
      console.log("Change to FB!");
    }

    const tabLinks = await page.$$(navButtons);
    const tabLink = tabLinks[PostLinks[_post]];
    await tabLink.click();
    console.log("Go to post: ", _post);

    const postSelector = `#post-${_post}`;
    await page.waitForSelector(postSelector);
    const wantedPost = await page.$(postSelector);
    console.log(`Grabbed post with selector: ${postSelector}`);
    const innerText = await wantedPost.getInnerText();
    console.log("Got innerText");
    const text = removeConsecutiveNewLines(innerText);
    console.log("Removed consecutive new lines");
    result = text;
  } catch (error) {
    return callback(error);
  } finally {
    if (browser !== null) {
      let pages = await browser.pages();
      await Promise.all(pages.map((page) => page.close()));
      console.log("All pages closed");
      await browser.close();
      console.log("Browser closed");
    }
  }

  return callback(null, result);
};

if (require.main === module) {
  console.log(
    "this module was run directly from the command line as in node xxx.js"
  );
} else {
  console.log(
    "this module was not run directly from the command line and probably loaded by something else"
  );
}
