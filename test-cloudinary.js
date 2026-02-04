const cloudinary = require('cloudinary').v2;

const config = {
    cloud_name: 'dodw9wq5x',
    api_key: '139657534793136',
    api_secret: 'NhFWbwmFOiQmLtCpYoSupdbINzY',
};

console.log('Testing Hardcoded Config:', {
    cloud_name: config.cloud_name,
    api_key: config.api_key,
    api_secret: config.api_secret ? 'EXISTS' : 'MISSING'
});

cloudinary.config(config);

console.log('Pinging Cloudinary...');
cloudinary.api.ping((error, result) => {
    if (error) {
        console.error('Ping Failed:', error);
    } else {
        console.log('Ping Success:', result);

        // Try a simple upload test with buffer to simulate server env
        cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
            folder: 'test_repair'
        }, (err, res) => {
            if (err) {
                console.error('Upload Failed:', err);
            } else {
                console.log('Upload Success:', res.secure_url);
            }
        });
    }
});
