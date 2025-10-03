//! Default Compute template program.

/// <reference types="@fastly/js-compute" />
// import { CacheOverride } from "fastly:cache-override";
// import { Logger } from "fastly:logger";
import { env } from "fastly:env";
import { includeBytes } from "fastly:experimental";

import { formatISO } from "date-fns";
import * as crypto from "crypto-js";

// Hash of empty string, used for authentication string generation
// caculated from crypto.SHA256('');
const EMPTY_HASH = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

// The Fastly access key string
const ACCESS_KEY_ID = "3HwM6jJjfnPUNO3I6YdD9w"; // CID: 7hzA9NJMDUmDzix12AcNsi
// The Fastly secret access key paired with the access key above
const SECRET_ACCESS_KEY = "3Urkbd8N8Dw06wfYSg7UlW7LpS6VEmBFRJm8qdWCBLjSMopEMeqj5tE0SpMPaIUWP"; // CID: 7hzA9NJMDUmDzix12AcNsi

const AWS_REGION = "eu-central";
const OBJECT_STORAGE_ENDPOINT = "https://eu-central.object.fastlystorage.app";
const BUCKET_NAME = "images";
const STATIC_DOMAIN = "https://static.boman.church"; // the domain name of the VCL service that serves the images. 
const SIGNED_HEADERS = "host;x-amz-content-sha256;x-amz-date";

// Image file extensions we want to display
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];

// Default image dimensions for optimized display in grid
const DEFAULT_IMAGE_WIDTH = 300;
const DEFAULT_IMAGE_HEIGHT = 200;

// Load a static file as a Uint8Array at compile time.
// File path is relative to root of project, not to this file
const welcomePage = includeBytes("./src/index.html");

// The entry point for your application.
//
// Use this fetch event listener to define your main request handling logic. It could be
// used to route based on the request properties (such as method or path), send
// the request to a backend, make completely new requests, and/or generate
// synthetic responses.

addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
  // Log service version
  console.log("FASTLY_SERVICE_VERSION:", env('FASTLY_SERVICE_VERSION') || 'local');
  
  // Get the client request
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests to the root path
  if (request.method === "GET" && url.pathname === "/") {
    try {
      // Fetch objects from Fastly Object Storage
      const objectListing = await listObjectsFromBucket();
      
      // Generate HTML content based on the objects
      const generatedContent = generateImageGridHTML(objectListing);
      
      // Replace the template placeholder in the HTML
      const htmlContent = new TextDecoder().decode(welcomePage);
      const finalHTML = htmlContent.replace('{template_images}', generatedContent);
      
      return new Response(finalHTML, {
        status: 200,
        headers: new Headers({ 
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=300" // Cache for 5 minutes
        }),
      });
    } catch (error) {
      console.error("Error fetching objects:", error);
      const htmlContent = new TextDecoder().decode(welcomePage);
      const errorHTML = htmlContent.replace('{template_images}', 
        `<div class="col-12">
          <div class="alert alert-danger text-center">
            <h4>Error loading images</h4>
            <p>Unable to fetch images from object storage: ${error.message}</p>
          </div>
        </div>`
      );
      
      return new Response(errorHTML, {
        status: 200,
        headers: new Headers({ "Content-Type": "text/html; charset=utf-8" }),
      });
    }
  }

  // Catch all other requests and return a 404
  return new Response("The page you requested could not be found", {
    status: 404,
  });
}

// Function to list objects from Fastly Object Storage using ListObjectsV2 API
async function listObjectsFromBucket() {
  const listUrl = `${OBJECT_STORAGE_ENDPOINT}/${BUCKET_NAME}/?list-type=2`;
  
  // Create a request for ListObjectsV2
  const listRequest = new Request(listUrl, {
    method: 'GET',
    headers: new Headers()
  });

  // Authorize the request with AWS Signature V4
  authorizeRequestForObjectStorage(listRequest);

  console.log(`Fetching objects from: ${listUrl}`);
  const response = await fetch(listRequest);
  
  if (!response.ok) {
    throw new Error(`Failed to list objects: ${response.status} ${response.statusText}`);
  }

  const xmlResponse = await response.text();
  console.log(`Received XML response length: ${xmlResponse.length}`);
  
  // Parse the XML response to extract object information
  return parseObjectsFromXML(xmlResponse);
}

// Parse XML response from ListObjectsV2 to extract object information
function parseObjectsFromXML(xmlText) {
  const objects = [];
  
  // Simple XML parsing to extract object keys - in a production environment,
  // you might want to use a proper XML parser
  const keyRegex = /<Key>(.*?)<\/Key>/g;
  let match;
  
  while ((match = keyRegex.exec(xmlText)) !== null) {
    const objectKey = match[1];
    
    // Check if this is an image file
    if (isImageFile(objectKey)) {
      objects.push({
        key: objectKey,
        url: `${STATIC_DOMAIN}/${objectKey}?width=${DEFAULT_IMAGE_WIDTH}&height=${DEFAULT_IMAGE_HEIGHT}`
      });
    }
  }
  
  console.log(`Found ${objects.length} image objects`);
  return objects;
}

// Check if a file is an image based on its extension
function isImageFile(filename) {
  const lowerFilename = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lowerFilename.endsWith(ext));
}

// Generate Bootstrap grid HTML for image objects
function generateImageGridHTML(objects) {
  if (objects.length === 0) {
    return `<div class="col-12">
      <div class="alert alert-info text-center">
        <h4>No Images Found</h4>
        <p>The '${BUCKET_NAME}' bucket is empty or contains no image files.</p>
        <p>Supported formats: JPG, JPEG, PNG, GIF, WEBP, SVG</p>
      </div>
    </div>`;
  }

  let html = '';
  const bootstrapColors = ['primary', 'secondary', 'success', 'info', 'warning', 'danger', 'dark', 'light'];
  
  objects.forEach((image, index) => {
    const colorClass = bootstrapColors[index % bootstrapColors.length];
    const textClass = colorClass === 'warning' || colorClass === 'light' ? 'dark' : 'white';
    
    // Extract filename from the key for display
    const filename = image.key.split('/').pop() || image.key;
    
    // Generate URLs for thumbnail and full-size image
    const thumbnailUrl = image.url;
    const fullSizeUrl = `${STATIC_DOMAIN}/${image.key}?width=1500&height=1500&fit=bounds&quality=75`;
    
    html += `
      <div class="col-12 col-md-6 col-lg-3 mb-3">
        <div class="card h-100 bg-${colorClass} text-${textClass}">
          <img src="${thumbnailUrl}" class="card-img-top image-clickable" alt="${filename}" style="height: 200px; object-fit: cover; cursor: pointer;" data-full-url="${fullSizeUrl}" data-filename="${filename}">
          <div class="card-body">
            <h6 class="card-title text-truncate">${filename}</h6>
            <p class="card-text small">Image from Object Storage</p>
          </div>
        </div>
      </div>`;
  });
  
  return html;
}

// Authorize request for Object Storage operations using AWS Signature V4
function authorizeRequestForObjectStorage(req) {
  const timeStampISO8601Format = formatISO(new Date(), { format: "basic" });
  const YYYYMMDD = timeStampISO8601Format.slice(0, 8);

  const canonicalRequest = generateCanonicalRequestForObjectStorage(req, timeStampISO8601Format);
  console.log(`canonicalRequest = ${canonicalRequest}`);

  const stringToSign = generateStringToSignForObjectStorage(timeStampISO8601Format, YYYYMMDD, canonicalRequest);
  console.log(`stringToSign = ${stringToSign}`);

  const signature = generateSignatureForObjectStorage(YYYYMMDD, stringToSign);
  console.log(`signature = ${signature}`);

  const hostHeader = new URL(req.url).hostname;
  const authorizationValue = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${YYYYMMDD}/${AWS_REGION}/s3/aws4_request,SignedHeaders=${SIGNED_HEADERS},Signature=${signature}`;
  console.log(`authorizationValue = ${authorizationValue}`);

  req.headers.set("host", hostHeader);
  req.headers.set("authorization", authorizationValue);
  req.headers.set("x-amz-content-sha256", EMPTY_HASH);
  req.headers.set("x-amz-date", timeStampISO8601Format);
}

// Generate canonical request for Object Storage operations
function generateCanonicalRequestForObjectStorage(req, timeStampISO8601Format) {
  console.log(`HOST set to: ${req.headers.get('host')}`);
  const httpMethod = req.method;
  
  // Extract the path part after the endpoint for canonical URI
  const url = new URL(req.url);
  let canonicalUri = url.pathname;
  
  // URL encode the path properly for S3
  const decoded = decodeURIComponent(canonicalUri);
  const encoded = encodeURIComponent(decoded);
  canonicalUri = encoded.replaceAll("%2F", "/");

  const canonicalQuery = url.search.slice(1); // Remove the '?' prefix

  const hostHeader = req.headers.get('host') || new URL(req.url).hostname;
  const canonicalHeaders = `host:${hostHeader}\nx-amz-content-sha256:${EMPTY_HASH}\nx-amz-date:${timeStampISO8601Format}\n`;

  return `${httpMethod}\n${canonicalUri}\n${canonicalQuery}\n${canonicalHeaders}\n${SIGNED_HEADERS}\n${EMPTY_HASH}`;
}

// Generate string to sign for Object Storage operations
function generateStringToSignForObjectStorage(timeStampISO8601Format, YYYYMMDD, canonicalRequest) {
  const scope = `${YYYYMMDD}/${AWS_REGION}/s3/aws4_request`;
  const hashedCanonicalRequest = crypto.SHA256(canonicalRequest);

  return `AWS4-HMAC-SHA256\n${timeStampISO8601Format}\n${scope}\n${hashedCanonicalRequest}`;
}

// Calculate signature for Object Storage operations
function generateSignatureForObjectStorage(YYYYMMDD, stringToSign) {
  const round1 = hmacSha256("AWS4" + SECRET_ACCESS_KEY, YYYYMMDD);
  const round2 = hmacSha256(round1, AWS_REGION);
  const round3 = hmacSha256(round2, "s3");
  const round4 = hmacSha256(round3, "aws4_request");

  return hmacSha256(round4, stringToSign);
}

function hmacSha256(signingKey, stringToSign) {
  return crypto.HmacSHA256(stringToSign, signingKey, { asBytes: true });
}