const mongoose = require("mongoose")

// Documento único (_id: "default") com o último sinal de vida do worker local.
const WorkerStatus = mongoose.model('WorkerStatus', new mongoose.Schema({
    _id: { type: String, default: 'default' },
    lastSeenAt: Date,
    state: { type: String, enum: ['running', 'paused'], default: 'running' },
    pausedUntil: Date
}))

module.exports = WorkerStatus
