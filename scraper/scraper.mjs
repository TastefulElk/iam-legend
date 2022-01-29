import puppeteer from "puppeteer";
import cheerio from "cheerio";
import pLimit from "p-limit";

import { writeFile} from "fs";
import { promisify} from "util";

const writeFileAsync = promisify(writeFile);

const scrapeServices = async (url, browser) => {
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  const content = await page.content();
  const $ = cheerio.load(content);

  const services = [];
  $("#awsui-expandable-section-1 ul a").each((_, el) => {
    let name = $(el).text();
    const serviceDocsUrl = url.slice(0, url.lastIndexOf("/")) + "/" + $(el).attr("href");
    services.push({ name, url: serviceDocsUrl });
  });

  await page.close();
  return services;
};

const scrapeService = async (url, browser) => {
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: "networkidle0",
  });

  const content = await page.content();
  const $ = cheerio.load(content);

  try {
    const servicePrefix = getServicePrefix($);
    const serviceName = getServiceName($);
    const actions = getActions($);

    await save({ servicePrefix, serviceName, actions, url });
  } catch (e) {
    console.error(`error scraping: ${url}`);
    throw e;
  } finally {
    await page.close();
  }
};

const save = async ({ serviceName, servicePrefix, actions, url }) =>
  writeFileAsync(
    `./src/data/iam-services/${formatFileName(serviceName)}.json`,
    JSON.stringify({ serviceName, servicePrefix, url, actions }, null, 2)
  );

const formatFileName = (serviceName) => serviceName.replace(/\s+/g, "-").toLowerCase();

const getServicePrefix = ($) => {
  const elements = $("p > code").toArray();

  for (const element of elements) {
    if ($(element.parent).text().includes("service prefix:")) {
      return $(element).text();
    }
  }

  throw new Error("not service prefix found");
};

const getServiceName = ($) => {
  const h1 = $("h1").text();
  return h1.split("keys for ")[1].trim();
};

const getActions = ($) => {
  const actionsTable = $("#main-column table").first();
  const actionRows = actionsTable.find("tr");

  const actions = [];
  actionRows.each((_, el) => {
    const tds = $(el).find("td").toArray();
    if (tds.length === 0) return;
    if (tds.length === 6) {
      const [
        name,
        description,
        accessLevel,
        resourceTypes,
        conditionKeys,
        dependentActions,
      ] = tds.map((x) => $(x).text().trim());
      const documentationUrl = $(tds[0]).find("a[href]").first().attr("href");

      actions.push({
        name: name.split(' ')[0], // action name will always be first word but it may contain junk
        documentationUrl,
        description,
        accessLevel,
        resourceTypes: formatToList(resourceTypes),
        conditionKeys: formatToList(conditionKeys),
        dependentActions: formatToList(dependentActions)
      });
      return;
    }

    const [resourceTypes, conditionKeys, dependentActions] = tds.map((td) => formatToList($(td).text())
    );

    const prevAction = actions[actions.length - 1];
    prevAction.resourceTypes = [...prevAction.resourceTypes, ...resourceTypes];
    prevAction.conditionKeys = [...prevAction.conditionKeys, ...conditionKeys];
    prevAction.dependentActions = [
      ...prevAction.dependentActions,
      ...dependentActions,
    ];
  });

  return actions;
};

const formatToList = (str) => str
  .split("\n")
  .map((x) => x.trim().replace(/\s+/, ""))
  .filter((x) => x.length > 0);

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    ignoreHTTPSErrors: true,
  });
  const limit = pLimit(10);
  const services = await scrapeServices(
    "https://docs.aws.amazon.com/service-authorization/latest/reference/reference_policies_actions-resources-contextkeys.html",
    browser
  );

  await Promise.all(services.map(({ url }) => limit(() => {
    console.log('Scraping: ', url);
    return scrapeService(url, browser);
  })));
  
  await browser.close();
})();
