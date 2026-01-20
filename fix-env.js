const fs = require('fs');
const path = require('path');

const content = [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dodw9wq5x',
    'NEXT_PUBLIC_CLOUDINARY_API_KEY=139657534793136',
    'CLOUDINARY_API_SECRET=NhFWbwmFOiQmLtCpYoSupdbINzY',
    'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=mediaflows_c18e7e50-ff08-4c96-93a1-b8fe3d6b6530'
].join('\n');

const filePath = path.join(__dirname, '.env.local');

try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully wrote .env.local with UTF-8 encoding');
} catch (err) {
    console.error('Failed to write .env.local:', err);
    process.exit(1);
}
