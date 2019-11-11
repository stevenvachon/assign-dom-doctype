import protochain from "protochain";

const NODE_PROTOTYPE_CHAIN = "Node,EventTarget,Object";
const DOCUMENT_PROTOTYPE_CHAIN = `Document,${NODE_PROTOTYPE_CHAIN}`;
const DOCUMENT_TYPE_PROTOTYPE_CHAIN = `DocumentType,${NODE_PROTOTYPE_CHAIN}`;



const getPrototypeNameChain = object => protochain(object).map(({constructor: {name}}) => name).join(",");

// @todo use npmjs.com/dom-predicates
const isDocumentNode = node => getPrototypeNameChain(node).endsWith(DOCUMENT_PROTOTYPE_CHAIN);

// @todo use npmjs.com/dom-predicates
const isDocumentTypeNode = node => getPrototypeNameChain(node).endsWith(DOCUMENT_TYPE_PROTOTYPE_CHAIN);



export default (documentType, document) =>
{
	if (!isDocumentTypeNode(documentType) && documentType!==null)
	{
		throw new TypeError("Parameter 1 must be a DocumentType or null");
	}
	else if (!isDocumentNode(document))
	{
		throw new TypeError("Parameter 2 must be a Document");
	}

	const {doctype: originalDocumentType} = document;

	if (documentType!==null && originalDocumentType!==null)
	{
		originalDocumentType.replaceWith(documentType);
	}
	else if (documentType!==null && originalDocumentType===null)
	{
		document.documentElement.before(documentType);
	}
	else if (documentType===null && originalDocumentType!==null)
	{
		originalDocumentType.remove();
	}

	return originalDocumentType;
};
