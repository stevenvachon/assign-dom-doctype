"use strict";
const {after, before, beforeEach, describe, it} = require("mocha");
const cartesianProduct = require("cartesian-product");
const puppeteer = require("puppeteer");
const puppeteerCoverage = require("puppeteer-to-istanbul");

let browser, page;



const getDocumentNodes = realms => mapRealms(realms, ({document}) => document);



const getDocumentTypeNodes = (realms, qualifiedNameStr="html", publicId="", systemId="") => mapRealms(realms, ({document}) =>
{
	return document.implementation.createDocumentType(qualifiedNameStr, publicId, systemId);
});



const mapRealms = (realms, callback) => (Array.isArray(realms) ? realms : [realms]).map(callback);

// @todo https://github.com/tc39/proposal-optional-chaining
const removeDoctypes = realms => realms.forEach(({document}) => document.doctype && document.doctype.remove());



const resetDoctypes = realms => realms.forEach(realm =>
{
	const {document, originalDoctype} = realm;

	// @todo https://github.com/tc39/proposal-optional-chaining
	document.doctype && document.doctype.remove();

	document.documentElement.before(originalDoctype);
});



const runInBrowser = func => async () =>
{
	const realms = await page.evaluateHandle(() => [globalThis, iframeGlobalThis]);

	return page.evaluate(func, realms);
};



// @todo also use npmjs.com/puppeteer-firefox
before(async () =>
{
	browser = await puppeteer.launch({ args: ["--no-sandbox"] });
	page = await browser.newPage();

	page.on("console", async msg => console[msg._type](...await Promise.all(msg.args().map(arg => arg.jsonValue()))));
	page.on("pageerror", console.error);

	await Promise.all(
	[
		page.addScriptTag({ path: "node_modules/chai/chai.js" }),
		page.addScriptTag({ path: "temp.js" }),

		// @todo https://github.com/GoogleChrome/puppeteer/issues/5108
		page.addScriptTag(
		{
			content: Object.entries(
				{
					cartesianProduct,
					getDocumentNodes,
					getDocumentTypeNodes,
					mapRealms,
					removeDoctypes,
					resetDoctypes
				})
				.map(([name, value]) => `globalThis.${name} = ${value.toString()}`)
				.join(";\n")
		}),

		// @todo https://github.com/GoogleChrome/puppeteer/issues/3570
		page.coverage.startJSCoverage({ reportAnonymousScripts: true })
	]);

	await page.evaluate(() =>
	{
		globalThis.expect = chai.expect;
		delete globalThis.chai;  // cleanup

		// Add Realm
		const iframe = document.createElement("iframe");
		document.body.append(iframe);

		globalThis.iframeGlobalThis = iframe.contentWindow;
		globalThis.originalDoctype = getDocumentTypeNodes(globalThis)[0];
		iframeGlobalThis.originalDoctype = getDocumentTypeNodes(iframeGlobalThis)[0];
	});
});



beforeEach(runInBrowser(realms => resetDoctypes(realms)));



after(async () =>
{
	let coverage = await page.coverage.stopJSCoverage();

	// Exclude tools
	coverage = coverage.filter(({url}) => !url.includes("chai"));

	puppeteerCoverage.write(coverage);

	await browser.close();
});



it("is a (bundled) function", runInBrowser(() =>
{
	expect(assignDoctype).to.be.a("function");
}));



it("accepts a DocumentType & Document node from any Realm", runInBrowser(realms =>
{
	const fixtureArgs = cartesianProduct(
	[
		getDocumentTypeNodes(realms),
		getDocumentNodes(realms)
	]);

	fixtureArgs.forEach(args => expect(() => assignDoctype(...args)).not.to.throw());
}));



it("rejects a non-DocumentType & non-Document node from any Realm", runInBrowser(realms =>
{
	const documents = getDocumentNodes(realms);
	const documentTypes = getDocumentTypeNodes(realms);

	const others = realms
		.map(realm =>
		[
			"string",
			new String("string"),
			Symbol(),
			{},
			[],
			/regex/,
			true,
			false,
			0,
			new Number(0),
			1,
			new Number(1),
			1n,
			NaN,
			// null is supported
			undefined,
			realm,
			realm.document.createComment("data"),
			realm.document.createDocumentFragment(),
			realm.document.createElement("div"),
			realm.document.createProcessingInstruction("target", "data"),
			realm.document.createTextNode("data"),
			realm.document.implementation.createDocument(null, "root-node").createCDATASection("data")
		])
		.flat();

	const fixtures = [...documents, ...documentTypes, ...others];

	cartesianProduct([fixtures, fixtures])
		.filter(([documentType, document]) => !documents.includes(document) || !documentTypes.includes(documentType))
		.forEach(args => expect(() => assignDoctype(...args)).to.throw(TypeError));
}));



it("inserts a cross- and same-Realm DocumentType node", runInBrowser(realms =>
{
	const documents = getDocumentNodes(realms);
	const documentTypes = getDocumentTypeNodes(realms);

	cartesianProduct([documentTypes, documents]).forEach(([documentType, document]) =>
	{
		removeDoctypes(realms);

		expect(assignDoctype(documentType, document)).to.equal(null);
		expect(document.doctype).to.equal(documentType);
	});
}));



it("replaces a cross- and same-Realm DocumentType node", runInBrowser(realms =>
{
	const documents = getDocumentNodes(realms);
	const documentTypes = getDocumentTypeNodes(realms);

	cartesianProduct([documentTypes, documents]).forEach(([documentType, document]) =>
	{
		resetDoctypes(realms);

		expect(assignDoctype(documentType, document)).to.equal(document.defaultView.originalDoctype);
		expect(document.doctype).to.equal(documentType);
	});
}));



it("removes an existing DocumentType node when its replacement is null", runInBrowser(realms =>
{
	getDocumentNodes(realms).forEach(document =>
	{
		resetDoctypes(realms);

		expect(assignDoctype(null, document)).to.equal(document.defaultView.originalDoctype);
		expect(document.doctype).to.equal(null);
	});
}));



it("does nothing when there is no existing DocumentType node and its replacement is null", runInBrowser(realms =>
{
	getDocumentNodes(realms).forEach(document =>
	{
		removeDoctypes(realms);

		expect(assignDoctype(null, document)).to.equal(null);
		expect(document.doctype).to.equal(null);
	});
}));
