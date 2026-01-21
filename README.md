# Fastly Object Storage Demo

A simple demo showcasing Fastly Object Storage and Image Optimizer working together. This repository demonstrates how to dynamically fetch images from Object Storage and display them in a responsive Bootstrap grid using Fastly Compute @ Edge.

## Prerequisites (pre SKO tasks)

- [Fastly CLI](https://developer.fastly.com/learning/compute/javascript/) installed
- Active Fastly account with Compute services enabled
- Object Storage access (see setup instructions below)
- Image Optimizer enabled on a VCL service that we'll use (this also requires a FQDN to be used)
- Dynamic Backends for compute enabled

## Start (SKO training instructions)

### 1. Set Up Object Storage

**Before deploying the Compute app, you need to set up Fastly Object Storage:**

1. **Follow the [Object Storage Quick Start Guide](https://fastly.com/documentation/guides/platform/object-storage/object-storage-quick-start/)**
2. **Record your credentials** (Access Key ID and Secret Key) for the next step
3. **Create a VCL service** That are used to serve the images thru Image Optimizer
4. **Enable Image Optimizer** following the [Image Optimizer Reference](https://fastly.com/documentation/reference/io/)
5. **Create a bucket** named `images` (or update the `BUCKET_NAME` constant)
6. **Upload some image files** (JPG, PNG, GIF, WEBP, AVIF, SVG supported)

   **💡 Pro Tip**: Use the [Fastly Object Storage Demo Tool](https://github.com/Antoinebr/Fastly-Object-Storage-Demo) to easily create buckets and upload files once you have your access key and secret key!


### 2. Clone the Repository

```bash
git clone https://github.com/NisseBoman/ObjectStorage-demo.git
cd ObjectStorage-demo
```

### 3. Install Dependencies

```bash
npm install
```



### 4. Configure Your Environment

Update the following constants in `src/index.js` with your Fastly Object Storage credentials:

```javascript
const ACCESS_KEY_ID = "your-access-key-here";
const SECRET_ACCESS_KEY = "your-secret-key-here";
const OBJECT_STORAGE_ENDPOINT = "https://eu-central.object.fastlystorage.app"; // Update region as needed
const BUCKET_NAME = "images"; // Update bucket name as needed
const STATIC_DOMAIN = "https://your-domain.com"; // Update to your domain
```

### 5. Build and Deploy

```bash
# Build the project
fastly compute build

# Test locally
fastly compute serve

# Deploy to Fastly
fastly compute publish
```

### 6. Test Your Deployment

Visit your Fastly domain to see the dynamic image grid in action or use the local testing.


## Architecture Overview

```
Fastly Edge POP
├── Fastly Compute (JavaScript)
│   ├── ListObjectsV2 API call to Object Storage
│   ├── Image filtering and URL rewriting
│   └── Dynamic HTML generation
├── Fastly Image Optimizer
│   └── Automatic image resizing and optimization
└── Responsive Bootstrap Grid
    └── 300x200px optimized images
```

## Configuration Details

### Supported Image Formats
- JPEG/JPG
- PNG
- GIF
- WebP
- AVIF
- SVG

### Responsive Breakpoints
- **Desktop** (lg+): 4 columns
- **Tablet** (md): 2 columns
- **Mobile** (sm): 1 column

### Image Optimization Parameters
The demo automatically adds `width` and `height` parameters to image URLs:
- **Default**: `width=300&height=200`
- **Configurable**: Modify `DEFAULT_IMAGE_WIDTH` and `DEFAULT_IMAGE_HEIGHT` constants

### Supported Object Storage Regions
- `us-east.object.fastlystorage.app`
- `us-west.object.fastlystorage.app`
- `eu-central.object.fastlystorage.app`

## Development

```bash
# Local development server
fastly compute serve

# Build for production
fastly compute build

# Publish to Fastly
fastly compute publish
```

## Customization

### Adding New Image Types
Update the `IMAGE_EXTENSIONS` array in `src/index.js`:

```javascript
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.your-new-format'];
```

### Adjusting Grid Responsiveness
Modify the Bootstrap classes in the `generateImageGridHTML` function:

```javascript
html += `
  <div class="col-12 col-md-6 col-lg-3 mb-3"> // Change these classes
    <!-- Your content -->
  </div>`;
```

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all dependencies are installed with `npm install`
2. **Authentication Failures**: Verify your Object Storage credentials
3. **Empty Grid**: Check that your bucket contains valid image files
4. **Image Loading Issues**: Confirm Image Optimizer is enabled in your Fastly service
5. **Error message**: Error messages are pretty clear on what the problem is. 

### Getting Help

- [Fastly Compute Documentation](https://developer.fastly.com/learning/compute/javascript/)
- [Object Storage Documentation](https://fastly.com/documentation/guides/platform/object-storage/working-with-object-storage/)
- [Image Optimizer Documentation](https://fastly.com/documentation/reference/io/)

## License

MIT License - see LICENSE file for details.
