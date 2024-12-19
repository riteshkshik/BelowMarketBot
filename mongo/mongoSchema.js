const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
    userId: Number,
    productLink: String,
    desiredPrice: Number,
    status: {
        type: String, 
        enum: ['active', 'paused'],
        default: 'active'
    }
});

module.exports = mongoose.model("Request", requestSchema);