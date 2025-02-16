const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    originalValue: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '24h' // Optional: tokens will be automatically deleted after 24 hours
    }
});

module.exports = mongoose.model('Token', tokenSchema); 