# Cloudinary API Setup Guide (Including Size Limits and Compression Settings)

## I. Cloudinary Account Registration
1. Go to [https://cloudinary.com](https://cloudinary.com) to register a free account.
2. After logging in, enter the Dashboard to obtain the following information:
   - Cloud name
   - API Key
   - API Secret

---

## II. Environment Variable Configuration

For local development, write the following information in the `.env` file in the root directory:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_API_Key
CLOUDINARY_API_SECRET=your_API_Secret
```

> ⚠️ **Note: Make sure `.env` is added to `.gitignore` to prevent sensitive information from being uploaded to GitHub.**

---

## III. Backend Configuration: Two Implementation Methods for Cloudinary Upload

### Method 1: Client-Side Signature Upload (Original Method)

📁 **Put in file: `server/routes/uploads.js`**

```javascript
// server/routes/uploads.js
import express from 'express';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { requireAuth } from '../middleware/auth.js'; // Must include this middleware to ensure user authentication

dotenv.config();

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.get('/signature', requireAuth, (req, res) => {
  try {
    // Get user ID (supports temporary users and registered users)
    const userId = req.user?.id || req.user?.tempId || 'unknown';
    // Set upload directory, categorized by user ID
    const folder = `focus_vision_images/${userId}`;
    // Generate timestamp
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Generate upload signature with limitations
    const signature = cloudinary.utils.api_sign_request({
      timestamp,
      folder,
      allowed_formats: 'jpg,jpeg,png,gif,webp',
      max_file_size: 1000000 // Maximum limit of 1MB
    }, process.env.CLOUDINARY_API_SECRET);

    // Return signature and other required parameters
    res.json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    });
  } catch (error) {
    console.error('Error generating upload signature:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to generate upload signature',
        details: error.message
      }
    });
  }
});

export default router;
```

### Method 2: Server-Side Direct Upload (Officially Recommended Method)

📁 **Add to file: `server/routes/uploads.js`**

```javascript
/**
 * Direct upload of images to Cloudinary (server-side upload)
 * @route POST /api/uploads/direct
 * @access Private - requireAuth should be used in production environment
 */
router.post('/direct', express.raw({ type: 'image/*', limit: '1mb' }), async (req, res) => {
  try {
    if (!req.body || !req.body.length) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'No image data received' } 
      });
    }

    // Get user ID - should be obtained from req.user in production environment
    const userId = 'test_user'; // Fixed ID used in test environment

    // Convert Buffer to base64 format
    const base64Data = `data:${req.headers['content-type']};base64,${req.body.toString('base64')}`;
    
    // Use official method for direct upload
    const uploadResult = await cloudinary.uploader.upload(base64Data, {
      folder: `focus_vision_images/${userId}`,
      resource_type: 'image',
    });

    // Return result
    res.json({
      success: true,
      data: {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        format: uploadResult.format,
        optimized_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/q_auto,f_auto,w_800/${uploadResult.public_id}`
      }
    });
  } catch (error) {
    console.error('Failed to upload image directly to Cloudinary:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to upload image',
        details: error.message
      }
    });
  }
});
```

📌 Don't forget to add in your `server/server.js`:

```js
import uploadRoutes from './routes/uploads.js';
app.use('/api/uploads', uploadRoutes);
```

### Comparison of the Two Methods

| Feature | Client-Side Signature Upload | Server-Side Direct Upload |
|------|--------------|---------------|
| Security | Lower (API Key exposed in frontend) | Higher (API Secret only on backend) |
| Implementation Complexity | Higher (requires signature, parameter configuration, etc.) | Lower (uses official API for direct upload) |
| Bandwidth Consumption | Lower (files uploaded directly from browser to Cloudinary) | Higher (files transfer through your server) |
| Reliability | Affected by signature expiration issues | More stable, not affected by signature issues |
| Official Recommendation | ✓ | ✓✓✓ (Strongly recommended) |

---

## IV. Frontend Configuration: Image Upload and Size Limits

📁 **Put in file: `client/src/components/GoalSettingGuide/VisionStep.jsx`**

### 1. Limiting User Image Upload Size (Maximum 1MB)

```jsx
// Check file size (maximum 1MB)
if (file.size > 1 * 1024 * 1024) {
  setError('Image size cannot exceed 1MB');
  console.error('File too large:', `${(file.size / 1024 / 1024).toFixed(2)}MB`);
  return;
}
```

### 2. Uploading Images - Method 1: Client-Side Signature Upload

```jsx
// Get Cloudinary upload signature
const signatureRes = await axios.get('/api/uploads/signature', { 
  baseURL: apiService.getDiagnostics().apiUrl,
  withCredentials: true 
});
const { signature, timestamp, folder, cloudName, apiKey } = signatureRes.data;

// Create form data
const formData = new FormData();
formData.append('file', file);
formData.append('signature', signature);
formData.append('timestamp', timestamp);
formData.append('api_key', apiKey);
formData.append('folder', folder);

// Upload to Cloudinary
const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
  method: 'POST',
  body: formData,
  mode: 'cors'
});

const uploadData = await uploadRes.json();
const optimizedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto,w_800/${uploadData.public_id}`;
```

### 3. Uploading Images - Method 2: Server-Side Direct Upload (Recommended)

```jsx
// Send directly to our backend API
const uploadRes = await axios.post('/api/uploads/direct', file, { 
  baseURL: apiService.getDiagnostics().apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': file.type
  }
});

// Use optimized URL provided by backend
const { optimized_url } = uploadRes.data.data;
```

### 4. Complete Upload Handling Function Integrating Both Methods

```jsx
const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  // File size check and other validations...
  setLoading(true);
  
  try {
    // Use server-side upload method (recommended)
    const useServerUpload = true; // Set to true to use server-side upload
    
    if (useServerUpload) {
      // Method 2: Server-side direct upload
      const uploadRes = await axios.post('/api/uploads/direct', file, { 
        baseURL: apiService.getDiagnostics().apiUrl,
        withCredentials: true,
        headers: {
          'Content-Type': file.type
        }
      });
      
      onChange(uploadRes.data.data.optimized_url);
    } else {
      // Method 1: Client-side signature upload
      // Get signature, upload to Cloudinary...
    }
  } catch (err) {
    console.error('Error uploading image:', err);
    setError('Error uploading image, please try again');
  } finally {
    setLoading(false);
  }
};
```

---

## V. Automatic Image Compression When Displaying (Recommended)

Add Cloudinary transformation parameters to the `src` of `<img>`:

```jsx
<img
  src={`https://res.cloudinary.com/${cloudName}/image/upload/q_auto,f_auto,w_1280/image_path`}
  alt="Preview Image"
/>
```

| Parameter | Description |
|------|------|
| `q_auto` | Automatic quality compression |
| `f_auto` | Automatic format conversion (e.g., WebP) |
| `w_1280` | Maximum width limitation of 1280px (adjust according to needs) |

---

## VI. Complete Process Summary

| Step | Signature Upload Method | Direct Upload Method |
|------|----------------|----------------|
| 1. | Register Cloudinary and obtain API keys | Register Cloudinary and obtain API keys |
| 2. | Configure `.env` and add to `.gitignore` | Configure `.env` and add to `.gitignore` |
| 3. | Create `/signature` endpoint to generate signatures | Create `/direct` endpoint to handle uploads |
| 4. | Frontend gets signature, uploads directly to Cloudinary | Frontend sends image to backend, backend uploads to Cloudinary |
| 5. | Handle client-side upload errors and validation | Handle server-side upload errors and validation |
| 6. | Display compressed image | Display compressed image |

---

## VII. Comparison with Official Cloudinary Upload Examples

Official Cloudinary recommended upload method:

```javascript
import { v2 as cloudinary } from 'cloudinary';

// Configuration
cloudinary.config({ 
    cloud_name: 'dh97gts7g', 
    api_key: '398956763661245', 
    api_secret: 'your_api_secret' 
});

// Upload image
const uploadResult = await cloudinary.uploader
  .upload(
     'https://example.com/image.jpg', {
         public_id: 'sample_image',
     }
  );

// Optimize URL
const optimizeUrl = cloudinary.url('sample_image', {
    fetch_format: 'auto',
    quality: 'auto'
});
```

Compared to our server-side direct upload method:
- Both use the `cloudinary.uploader.upload` method
- Both handle everything on the backend, protecting the API Secret
- Both can specify upload parameters and folders

Main differences:
- Our method receives image data sent from the frontend, not a URL
- We convert the image data to base64 format for upload
- We directly return the optimized_url instead of generating it through an additional call to cloudinary.url

---

## VIII. Cloudinary Upload Authorization Process Details

### 1. Overall Authorization Flow - Client-Side Signature Upload

```
┌─────────────┐     Request signature     ┌─────────────┐
│             │ ───────────────────────>  │             │
│  Frontend   │ withCredentials           │  Backend    │ ───┐
│ VisionStep  │ <─────────────────────────│ uploads.js  │    │ Verify user
│             │     Signature data        │             │ <──┘
└─────────────┘                           └─────────────┘
       │                                        │
       │ Use signature                          │ Generate signature
       ▼                                        │
┌─────────────┐                                 │
│             │ <───────────────────────────────┘
│  Cloudinary │
│   Service   │
│             │
└─────────────┘
```

### 2. Overall Authorization Flow - Server-Side Direct Upload

```
┌─────────────┐      Send image       ┌─────────────┐
│             │ ───────────────────>  │             │
│  Frontend   │ withCredentials       │  Backend    │ ───────┐
│ VisionStep  │                       │ uploads.js  │        │
│             │ <─────────────────────│             │ <──────┘
└─────────────┘    Return result      └─────────────┘        │
                                            │                │
                                            │ Upload image   │ Verify user
                                            ▼                │
                                      ┌─────────────┐       │
                                      │             │       │
                                      │  Cloudinary │ <─────┘
                                      │   Service   │
                                      │             │
                                      └─────────────┘
```

### 3. Authentication Key Points

#### Client-Side Signature Upload Method:
- Frontend needs to set `withCredentials: true` when requesting signature
- Backend `/signature` endpoint needs to use the `requireAuth` middleware
- Signatures have time effectiveness; they need to be used immediately after generation

#### Server-Side Direct Upload Method:
- Frontend sets `withCredentials: true` when sending image requests
- Backend `/direct` endpoint should use the `requireAuth` middleware (production environment)
- No need to handle signature expiration issues

### 4. Common Authorization Failure Errors and Solutions

| Error Code | Method | Possible Cause | Solution |
|---------|------|---------|---------|
| 401 Unauthorized | Both methods | Cookie not sent correctly or expired | Ensure withCredentials: true and re-login |
| 400 Bad Request | Client-side signature | Invalid or expired signature | Ensure signature is used immediately after generation |
| 400 Bad Request | Server-side direct upload | Incorrect image format or missing content | Ensure correct format of image data is sent |
| 413 Payload Too Large | Server-side direct upload | Image size exceeds limit | Check and compress image on frontend first |

---

## IX. Deploying Cloudinary Configuration on Render

### 1. Configure Render Environment Variables

Add the following to the environment variable configuration of your Render backend service:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_API_Key
CLOUDINARY_API_SECRET=your_API_Secret
```

Steps:
1. Log in to Render console
2. Go to your backend service settings page
3. Click the "Environment" tab
4. Add the above three variables in the environment variables area
5. Click "Save Changes" to save changes
6. Redeploy the service to apply the new environment variables

![Render Environment Variables Configuration](https://res.cloudinary.com/demo/image/upload/w_700/render_env_vars.png)

### 2. Check if Cloudinary Configuration is Effective

After deployment, you can verify if the configuration is effective through the following methods:

1. Access via browser: `https://your-backend-service.onrender.com/api/health`
2. Try uploading an image using the frontend functionality
3. Check if there are newly uploaded images in the Cloudinary dashboard

### 3. Solutions for Cross-Origin Issues

If you encounter cross-origin issues in the Render deployment environment, please verify:

1. The backend `cors` configuration is correctly set (already configured in server.js)
2. Ensure the frontend request includes the `credentials: true` option (already configured in api.js)
3. Confirm that Cloudinary's CORS settings allow uploads from your domain

> ⚠️ **Note:** If using a custom domain, you need to add that domain to Cloudinary's CORS settings.

---

## X. Common Troubleshooting

### 1. Upload Failure: 401 Unauthorized

Possible causes:
- **Lost authentication cookie** - Ensure the request includes `withCredentials: true`
- **Login status expired** - Try logging in again
- **Middleware configuration error** - Ensure backend routes correctly use the `requireAuth` middleware

### 2. Upload Failure: Invalid Signature

Possible causes:
- **Using client-side signature method** - Consider switching to server-side direct upload method
- **Incomplete signature parameters** - Ensure all necessary parameters (api_key, timestamp, signature, etc.) are correctly set
- **Signature expired** - Signatures have time effectiveness; use immediately after obtaining
- **Cross-origin issues** - Add `mode: 'cors'` to fetch requests

### 3. Upload Failure: Image Cannot Be Processed

Possible causes:
- File format not supported - Ensure uploading valid image files (jpg, png, etc.)
- File too large - Exceeds the set size limit (default 1MB)
- File data corrupted - Ensure complete file data is sent

### 4. Recommended Choice Between Two Upload Methods

| Scenario | Recommended Method |
|---------|------|
| Production environment | Server-side direct upload (more secure and reliable) |
| Development testing | Either method (simplify development process) |
| Large file uploads | Client-side signature upload (saves server bandwidth) |
| Security focus | Server-side direct upload (API Secret not exposed) |
| Multiple transformation processing | Server-side direct upload (can flexibly set more parameters) | 