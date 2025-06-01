// models/AuditLog.ts
import { Schema, model, models } from 'mongoose';

const AuditLogSchema = new Schema(
  {
    userId: String,
    name: String,
    role: String,
    path: String,
    timestamp: Date,
    ip: String,
  },
  { timestamps: true }
);

const AuditLog = models.AuditLog || model('AuditLog', AuditLogSchema);
export default AuditLog;