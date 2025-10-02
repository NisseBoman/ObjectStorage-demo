# Fastly Object Storage Demo

A comprehensive demo showcasing Fastly Object Storage and Image Optimizer working together. This repository demonstrates how to dynamically fetch images from Object Storage and display them in a responsive Bootstrap grid using Fastly Compute @ Edge.

## Features

- 🌐 **Dynamic Image Loading**: Fetches images from Fastly Object Storage using S3-compatible APIs
- 🖼️ **Image Optimization**: Integrates with Fastly Image Optimizer for automatic resizing and format conversion
- 📱 **Responsive Design**: Bootstrap-powered grid system (4 columns → 2 columns → 1 column)
- ⚡ **Edge Computing**: Hosted on Fastly Compute for ultra-fast global delivery
- 🔐 **Secure Authentication**: AWS Signature V4 authentication for Object Storage access

## Prerequisites

- [Fastly CLI](https://developer.fastly.com/learning/compute/javascript/) installed
- Active Fastly account with Compute services enabled
- Object Storage access (see setup instructions below)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/FastlyObjectStorageDemo.git
cd FastlyObjectStorageDemo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Object Storage

**Before deploying the Compute app, you need to set up Fastly Object Storage:**

1. **Follow the [Object Storage Quick Start Guide](https://fastly.com/documentation/guides/platform/object-storage/object-storage-quick-start/)**
2. **Enable Image Optimizer** following the [Image Optimizer Reference](https://fastly.com/documentation/reference/io/)
3. **Create a bucket** named `images` (or update the `BUCKET_NAME` constant)
4. **Upload some image files** (JPG, PNG, GIF, WEBP, AVIF, SVG supported)
5. **Record your credentials** (Access Key ID and Secret Key) for the next step

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

# Deploy to Fastly
fastly compute publish
```

### 6. Test Your Deployment

Visit your Fastly domain to see the dynamic image grid in action!


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

### Getting Help

- [Fastly Compute Documentation](https://developer.fastly.com/learning/compute/javascript/)
- [Object Storage Documentation](https://fastly.com/documentation/guides/platform/object-storage/working-with-object-storage/)
- [Image Optimizer Documentation](https://fastly.com/documentation/reference/io/)

## License

MIT License - see LICENSE file for details.
